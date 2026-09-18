import { ConverseCommand, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

/**
 * Format model-specific InvokeModel payloads as a resilient fallback
 * if Converse API is not supported by a specific Bedrock deployment.
 */
export const formatInvokeModelPayload = (modelId, { prompt, systemPrompt, maxTokens, temperature }) => {
  if (modelId.startsWith('anthropic.claude')) {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    };
    if (systemPrompt && systemPrompt.trim()) {
      payload.system = systemPrompt.trim();
    }
    return payload;
  }

  if (modelId.startsWith('amazon.nova')) {
    const payload = {
      inferenceConfig: {
        max_new_tokens: maxTokens,
        temperature,
      },
      messages: [{ role: 'user', content: [{ text: prompt }] }],
    };
    if (systemPrompt && systemPrompt.trim()) {
      payload.system = [{ text: systemPrompt.trim() }];
    }
    return payload;
  }

  if (modelId.startsWith('google.gemma')) {
    const formattedPrompt = systemPrompt && systemPrompt.trim()
      ? `<start_of_turn>user\n${systemPrompt.trim()}\n\n${prompt}<end_of_turn>\n<start_of_turn>model\n`
      : `<start_of_turn>user\n${prompt}<end_of_turn>\n<start_of_turn>model\n`;
    return {
      prompt: formattedPrompt,
      max_tokens: maxTokens,
      temperature,
    };
  }

  // Generic fallback
  return {
    prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
    max_tokens: maxTokens,
    temperature,
  };
};

/**
 * Extract text and token usage from model-specific InvokeModel responses
 */
export const parseInvokeModelResponse = (modelId, decodedBody) => {
  const result = typeof decodedBody === 'string' ? JSON.parse(decodedBody) : decodedBody;
  let text = '';
  let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

  if (modelId.startsWith('anthropic.claude')) {
    text = result.content?.[0]?.text || '';
    if (result.usage) {
      usage = {
        inputTokens: result.usage.input_tokens || 0,
        outputTokens: result.usage.output_tokens || 0,
        totalTokens: (result.usage.input_tokens || 0) + (result.usage.output_tokens || 0),
      };
    }
  } else if (modelId.startsWith('amazon.nova')) {
    text = result.output?.message?.content?.[0]?.text || '';
    if (result.usage) {
      usage = {
        inputTokens: result.usage.inputTokens || 0,
        outputTokens: result.usage.outputTokens || 0,
        totalTokens: result.usage.totalTokens || 0,
      };
    }
  } else if (modelId.startsWith('google.gemma')) {
    text = result.outputs?.[0]?.text || result.generation || result.text || '';
  } else {
    text = result.completion || result.text || result.output || '';
  }

  return { text: text.trim(), usage };
};

/**
 * Invoke model via Bedrock Converse API with graceful adapter fallback
 */
export const invokeBedrockModel = async (
  bedrockClient,
  modelId,
  { prompt, systemPrompt = '', maxTokens = 800, temperature = 0.5 }
) => {
  const startTime = Date.now();

  // 1. Primary path: Bedrock Converse API (standard across Claude 3, Nova, Gemma on Bedrock)
  try {
    const converseParams = {
      modelId,
      messages: [
        {
          role: 'user',
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        maxTokens,
        temperature,
      },
    };

    if (systemPrompt && systemPrompt.trim()) {
      converseParams.system = [{ text: systemPrompt.trim() }];
    }

    const command = new ConverseCommand(converseParams);
    const response = await bedrockClient.send(command);
    const latencyMs = Date.now() - startTime;

    const text = response.output?.message?.content?.[0]?.text || '';
    const usage = {
      inputTokens: response.usage?.inputTokens || 0,
      outputTokens: response.usage?.outputTokens || 0,
      totalTokens: response.usage?.totalTokens || 0,
    };

    return {
      text: text.trim(),
      usage,
      modelUsed: modelId,
      latencyMs,
    };
  } catch (converseError) {
    const errName = converseError.name || '';
    const errMsg = converseError.message || '';

    // If AWS Bedrock requires regional inference profile for Nova, auto-resolve to apac
    if (errMsg.includes('inference profile') && !modelId.startsWith('apac.') && modelId.includes('nova')) {
      const apacModelId = `apac.${modelId}`;
      console.log(`[AI Router] Model ${modelId} requires inference profile. Retrying with ${apacModelId}...`);
      return invokeBedrockModel(bedrockClient, apacModelId, { prompt, systemPrompt, maxTokens, temperature });
    }

    // If error is throttling, quota, or access denied, propagate immediately (do not mask)
    if (
      errName === 'ThrottlingException' ||
      errName === 'ServiceQuotaExceededException' ||
      errName === 'AccessDeniedException' ||
      errName === 'UnauthorizedException' ||
      errName === 'UnrecognizedClientException' ||
      errName === 'ResourceNotFoundException' ||
      errName === 'InvalidSignatureException' ||
      converseError.statusCode === 429 ||
      errMsg.includes('tokens per day') ||
      errMsg.includes('quota') ||
      errMsg.includes('model identifier is invalid')
    ) {
      throw converseError;
    }

    // If Converse API is specifically unsupported for this model ID in this region, fallback to InvokeModelCommand
    console.warn(`[AI Router] Converse API returned ${errName} for ${modelId}. Attempting InvokeModelCommand adapter.`);

    const invokePayload = formatInvokeModelPayload(modelId, {
      prompt,
      systemPrompt,
      maxTokens,
      temperature,
    });

    const invokeCommand = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(invokePayload),
    });

    const invokeResponse = await bedrockClient.send(invokeCommand);
    const latencyMs = Date.now() - startTime;
    const decoded = new TextDecoder().decode(invokeResponse.body);
    const { text, usage } = parseInvokeModelResponse(modelId, decoded);

    return {
      text,
      usage,
      modelUsed: modelId,
      latencyMs,
    };
  }
};
