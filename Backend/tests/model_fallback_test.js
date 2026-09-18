import dotenv from 'dotenv';
dotenv.config();

import { isFallbackEligible, isNonFallbackError, parseJsonResponse, callBedrockRouter } from '../src/services/ai/bedrockService.js';
import { formatInvokeModelPayload, parseInvokeModelResponse } from '../src/services/ai/modelAdapters.js';

let passed = 0;
let failed = 0;

function assert(description, condition, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${description} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

// Mock Bedrock Client factory
function createMockBedrockClient(scenarioHandlers) {
  const calls = [];
  return {
    calls,
    send: async (command) => {
      const modelId = command.input.modelId;
      calls.push({
        modelId,
        commandName: command.constructor.name,
        timestamp: Date.now(),
      });

      const normalizedModelId = modelId.replace(/^(apac|us)\./, '');
      const handler = scenarioHandlers[modelId] || scenarioHandlers[normalizedModelId];
      if (typeof handler === 'function') {
        return handler(command, calls.filter((c) => c.modelId === modelId).length);
      }
      throw new Error(`Unhandled mock modelId: ${modelId}`);
    },
  };
}

// Sample valid LLM responses
const mockQ1Response = JSON.stringify({
  question: 'Can you describe a challenging technical architecture decision you made?',
  category: 'Technical',
});

const mockEvaluationResponse = JSON.stringify({
  evaluation: {
    technicalAccuracy: 8,
    relevance: 9,
    depth: 7,
    clarity: 8,
    completeness: 7,
    communication: 8,
  },
  scores: {
    overall: 78,
    technical: 80,
    communication: 80,
    problemSolving: 75,
    projectKnowledge: 80,
    behavioral: 75,
  },
  strengths: ['Identified database bottleneck properly'],
  missingPoints: ['Did not mention cache invalidation'],
  betterAnswer: 'In distributed systems...',
  shouldFollowUp: false,
  nextQuestion: {
    question: 'How do you handle schema migrations with zero downtime?',
    category: 'Technical',
  },
});

const mockFinalReportResponse = JSON.stringify({
  overallScore: 82,
  categoryScores: {
    technical: 84,
    communication: 80,
    problemSolving: 82,
    projectKnowledge: 85,
    behavioral: 78,
  },
  strengths: ['Strong system design instincts'],
  weakAreas: [
    {
      topic: 'Cache Invalidation',
      whatWasMissing: 'Did not address write-through vs cache-aside',
      whyItMatters: 'Critical for data consistency',
      whatToPractice: 'Review Redis patterns',
    },
  ],
  improvementPlan: [
    { day: 1, title: 'Cache Strategies', focus: 'Redis', tasks: ['Study cache-aside'] },
  ],
  summary: 'Excellent technical depth and communication.',
});

async function runTests() {
  console.log('====================================================');
  console.log('AWS BEDROCK MULTI-MODEL FALLBACK ROUTER TEST SUITE');
  console.log('Models: Claude 3 Haiku -> Nova Lite -> Gemma 3 27B');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // Test A: Primary Model (Claude 3 Haiku) succeeds
  // ----------------------------------------------------
  console.log('Test A: Claude 3 Haiku succeeds on first try');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 40, outputTokens: 25, totalTokens: 65 },
      }),
    });

    const result = await callBedrockRouter('Hello', '', 500, 0.5, mockClient);
    assert('Returns successful response', !!result.text);
    assert('Model used is Claude 3 Haiku', result.modelUsed === 'anthropic.claude-3-haiku-20240307-v1:0');
    assert('Only 1 Bedrock call was made (no duplicate requests)', mockClient.calls.length === 1);
  }

  // ----------------------------------------------------
  // Test B: Claude 3 Haiku throttled -> Nova Lite succeeds
  // ----------------------------------------------------
  console.log('\nTest B: Claude throttled (ThrottlingException) -> Nova Lite succeeds');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => {
        const err = new Error('Rate exceeded');
        err.name = 'ThrottlingException';
        err.statusCode = 429;
        throw err;
      },
      'amazon.nova-lite-v1:0': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 42, outputTokens: 28, totalTokens: 70 },
      }),
    });

    const result = await callBedrockRouter('Hello', '', 500, 0.5, mockClient);
    assert('Nova Lite successfully answered', !!result.text);
    assert('Model used is Nova Lite', result.modelUsed.includes('amazon.nova-lite-v1:0'));
    assert(
      'Gemma was NOT called (stopped at Nova Lite)',
      !mockClient.calls.some((c) => c.modelId === 'google.gemma-3-27b-it')
    );
  }

  // ----------------------------------------------------
  // Test C: Claude quota exceeded -> Nova Lite called
  // ----------------------------------------------------
  console.log('\nTest C: Claude daily quota exceeded -> Nova Lite succeeds');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => {
        const err = new Error('Too many tokens per day, please wait before trying again.');
        err.name = 'ThrottlingException';
        throw err;
      },
      'amazon.nova-lite-v1:0': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 50, outputTokens: 30, totalTokens: 80 },
      }),
    });

    const result = await callBedrockRouter('Hello', '', 500, 0.5, mockClient);
    assert('Fallback succeeded on daily token quota exhaustion', result.modelUsed.includes('amazon.nova-lite-v1:0'));
  }

  // ----------------------------------------------------
  // Test D: Claude temporary unavailable (HTTP 503) -> Nova Lite succeeds
  // ----------------------------------------------------
  console.log('\nTest D: Claude unavailable (HTTP 503) -> Nova Lite succeeds');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => {
        const err = new Error('Service Unavailable');
        err.name = 'ServiceUnavailableException';
        err.statusCode = 503;
        throw err;
      },
      'amazon.nova-lite-v1:0': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 45, outputTokens: 25, totalTokens: 70 },
      }),
    });

    const result = await callBedrockRouter('Hello', '', 500, 0.5, mockClient);
    assert('Fallback triggered on HTTP 503', result.modelUsed.includes('amazon.nova-lite-v1:0'));
  }

  // ----------------------------------------------------
  // Test E: Claude fails + Nova succeeds -> Gemma NOT called
  // ----------------------------------------------------
  console.log('\nTest E: Claude fails + Nova Lite succeeds -> Zero Gemma calls');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => {
        const err = new Error('Throttled');
        err.name = 'ThrottlingException';
        throw err;
      },
      'amazon.nova-lite-v1:0': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 40, outputTokens: 20, totalTokens: 60 },
      }),
      'google.gemma-3-27b-it': () => {
        throw new Error('Gemma should never be called in Test E');
      },
    });

    const result = await callBedrockRouter('Hello', '', 500, 0.5, mockClient);
    assert('Successful response from Nova', !!result.text);
    const gemmaCalls = mockClient.calls.filter((c) => c.modelId === 'google.gemma-3-27b-it');
    assert('Gemma calls count is exactly 0', gemmaCalls.length === 0);
  }

  // ----------------------------------------------------
  // Test F: Claude & Nova throttled -> Gemma 3 27B succeeds
  // ----------------------------------------------------
  console.log('\nTest F: Claude throttled + Nova throttled -> Gemma 3 27B succeeds');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => {
        const err = new Error('Claude throttled');
        err.name = 'ThrottlingException';
        throw err;
      },
      'amazon.nova-lite-v1:0': () => {
        const err = new Error('Nova capacity exceeded');
        err.name = 'ServiceQuotaExceededException';
        throw err;
      },
      'google.gemma-3-27b-it': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 55, outputTokens: 35, totalTokens: 90 },
      }),
    });

    const result = await callBedrockRouter('Hello', '', 500, 0.5, mockClient);
    assert('Gemma 3 27B answered successfully', !!result.text);
    assert('Model used is Gemma 3 27B', result.modelUsed === 'google.gemma-3-27b-it');
  }

  // ----------------------------------------------------
  // Test G: All three models fail -> Clean sanitized 429 error
  // ----------------------------------------------------
  console.log('\nTest G: All three models throttled -> Clean user-facing error');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => {
        const err = new Error('Claude throttled');
        err.name = 'ThrottlingException';
        throw err;
      },
      'amazon.nova-lite-v1:0': () => {
        const err = new Error('Nova throttled');
        err.name = 'ThrottlingException';
        throw err;
      },
      'google.gemma-3-27b-it': () => {
        const err = new Error('Gemma throttled');
        err.name = 'ThrottlingException';
        throw err;
      },
    });

    try {
      await callBedrockRouter('Hello', '', 500, 0.5, mockClient);
      assert('Expected error when all models fail', false);
    } catch (err) {
      assert('Throws sanitized application error', err.statusCode === 429);
      assert('Message is user-friendly (no AWS internals exposed)', !err.message.includes('arn:aws:'));
      assert('Includes attempt history in error object', Array.isArray(err.attempts) && err.attempts.length > 0);
    }
  }

  // ----------------------------------------------------
  // Test H: Invalid AWS credentials -> Immediate error, NO silent fallback
  // ----------------------------------------------------
  console.log('\nTest H: Invalid AWS credentials -> Fails fast without fallback');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => {
        const err = new Error('The security token included in the request is invalid');
        err.name = 'UnrecognizedClientException';
        throw err;
      },
      'amazon.nova-lite-v1:0': () => {
        throw new Error('Should not call Nova on auth failure');
      },
    });

    try {
      await callBedrockRouter('Hello', '', 500, 0.5, mockClient);
      assert('Expected failure on credential error', false);
    } catch (err) {
      assert('Throws 503 Service Unavailable', err.statusCode === 503);
      assert('Only 1 model was attempted (no fallback cycling on credential error)', mockClient.calls.length === 1);
    }
  }

  // ----------------------------------------------------
  // Test I: Invalid model ID -> Immediate error, NO silent fallback
  // ----------------------------------------------------
  console.log('\nTest I: Invalid model ID (ResourceNotFoundException) -> Fails fast');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => {
        const err = new Error('The provided model identifier is invalid.');
        err.name = 'ResourceNotFoundException';
        throw err;
      },
      'amazon.nova-lite-v1:0': () => {
        throw new Error('Should not fallback on invalid model ID');
      },
    });

    try {
      await callBedrockRouter('Hello', '', 500, 0.5, mockClient);
      assert('Expected failure on invalid model ID', false);
    } catch (err) {
      assert('Terminated without fallback cycling', mockClient.calls.length === 1);
    }
  }

  // ----------------------------------------------------
  // Test J: Malformed model output -> Handled safely
  // ----------------------------------------------------
  console.log('\nTest J: Malformed model output handling');
  {
    // 1. JSON in markdown block with trailing comma
    const rawFenced = '```json\n{\n  "question": "Explain event loop in Node.js",\n  "category": "Technical",\n}\n```';
    const parsed = parseJsonResponse(rawFenced, (data) => {
      if (!data.question) return 'Missing question';
      return null;
    });
    assert('Correctly extracts and parses fenced JSON with trailing comma', parsed.question === 'Explain event loop in Node.js');

    // 2. Outermost braces extraction when model adds preamble
    const rawWithPreamble = 'Here is the question:\n{"question": "What is closure?", "category": "Technical"}\nHope this helps!';
    const parsedPreamble = parseJsonResponse(rawWithPreamble);
    assert('Correctly extracts JSON with preamble and postamble', parsedPreamble.question === 'What is closure?');

    // 3. Reject truly invalid text without fabricating fake data
    try {
      parseJsonResponse('Sorry, I cannot fulfill this request.', (data) => {
        if (!data.question) return 'Missing question';
        return null;
      });
      assert('Should reject non-JSON response', false);
    } catch (err) {
      assert('Safely throws when model response cannot be parsed as structured JSON', !!err.message);
    }
  }

  // ----------------------------------------------------
  // Test K: Error Classifier Unit Tests
  // ----------------------------------------------------
  console.log('\nTest K: Error classification accuracy');
  {
    assert('ThrottlingException is fallback eligible', isFallbackEligible({ name: 'ThrottlingException' }));
    assert('ServiceQuotaExceededException is fallback eligible', isFallbackEligible({ name: 'ServiceQuotaExceededException' }));
    assert('HTTP 429 is fallback eligible', isFallbackEligible({ statusCode: 429 }));
    assert('HTTP 503 is fallback eligible', isFallbackEligible({ statusCode: 503 }));
    assert('"tokens per day" string is fallback eligible', isFallbackEligible({ message: 'Too many tokens per day' }));

    assert('AccessDeniedException is non-fallback', isNonFallbackError({ name: 'AccessDeniedException' }));
    assert('UnrecognizedClientException is non-fallback', isNonFallbackError({ name: 'UnrecognizedClientException' }));
    assert('ValidationException is non-fallback', isNonFallbackError({ name: 'ValidationException' }));
    assert('ResourceNotFoundException is non-fallback', isNonFallbackError({ name: 'ResourceNotFoundException' }));
  }

  // ----------------------------------------------------
  // Test L: Interview state preservation across fallback
  // ----------------------------------------------------
  console.log('\nTest L: Structured JSON parsing preserves complete evaluation state');
  {
    const parsed = parseJsonResponse(mockEvaluationResponse);
    assert('Evaluation criteria scores preserved', parsed.evaluation.technicalAccuracy === 8);
    assert('Overall score preserved', parsed.scores.overall === 78);
    assert('Strengths array preserved', parsed.strengths.length === 1);
    assert('Next question preserved', parsed.nextQuestion.question === 'How do you handle schema migrations with zero downtime?');
  }

  // ----------------------------------------------------
  // Test M: Model-specific payload adapter formatting
  // ----------------------------------------------------
  console.log('\nTest M: Model-specific adapter payloads');
  {
    const claudePayload = formatInvokeModelPayload('anthropic.claude-3-haiku-20240307-v1:0', {
      prompt: 'Hello Claude',
      systemPrompt: 'You are an interviewer',
      maxTokens: 500,
      temperature: 0.5,
    });
    assert('Claude adapter uses bedrock-2023-05-31 version', claudePayload.anthropic_version === 'bedrock-2023-05-31');
    assert('Claude adapter sets system prompt', claudePayload.system === 'You are an interviewer');

    const novaPayload = formatInvokeModelPayload('amazon.nova-lite-v1:0', {
      prompt: 'Hello Nova',
      systemPrompt: 'You are an interviewer',
      maxTokens: 500,
      temperature: 0.5,
    });
    assert('Nova adapter sets inferenceConfig', novaPayload.inferenceConfig.max_new_tokens === 500);
    assert('Nova adapter sets messages with content array', Array.isArray(novaPayload.messages[0].content));

    const gemmaPayload = formatInvokeModelPayload('google.gemma-3-27b-it', {
      prompt: 'Hello Gemma',
      systemPrompt: 'You are an interviewer',
      maxTokens: 500,
      temperature: 0.5,
    });
    assert('Gemma adapter formats prompt with turn tokens', gemmaPayload.prompt.includes('<start_of_turn>user'));
  }

  // ----------------------------------------------------
  // Test N: Final report synthesis structure preservation
  // ----------------------------------------------------
  console.log('\nTest N: Final report schema verification');
  {
    const parsed = parseJsonResponse(mockFinalReportResponse, (data) => {
      if (typeof data.overallScore !== 'number') return 'Missing overallScore';
      if (!Array.isArray(data.weakAreas)) return 'Missing weakAreas';
      if (!Array.isArray(data.improvementPlan)) return 'Missing improvementPlan';
      return null;
    });
    assert('Final report overallScore is numeric', typeof parsed.overallScore === 'number');
    assert('Final report weakAreas contains topic and whyItMatters', parsed.weakAreas[0].topic === 'Cache Invalidation');
    assert('Final report contains 7-day plan structure', parsed.improvementPlan[0].day === 1);
  }

  // ----------------------------------------------------
  // Test O: Attempt history and token tracking
  // ----------------------------------------------------
  console.log('\nTest O: Token usage and latency tracking');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => {
        const err = new Error('Quota exceeded');
        err.name = 'ServiceQuotaExceededException';
        throw err;
      },
      'amazon.nova-lite-v1:0': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 45, outputTokens: 25, totalTokens: 70 },
      }),
    });

    const result = await callBedrockRouter('Hello', '', 500, 0.5, mockClient);
    assert('Tracks totalTokens from Bedrock response', result.usage.totalTokens === 70);
    assert('Tracks latencyMs', typeof result.latencyMs === 'number' && result.latencyMs >= 0);
    assert('Attempt history records Claude failure and Nova success', result.attemptHistory.length >= 2);
  }

  // ----------------------------------------------------
  // Test P: Malformed Claude JSON triggers fallback to Nova Lite
  // ----------------------------------------------------
  console.log('\nTest P: Malformed Claude JSON output triggers fallback to Nova Lite');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => ({
        output: { message: { content: [{ text: 'Here is an answer: { "not valid json...' }] } },
        usage: { inputTokens: 40, outputTokens: 20, totalTokens: 60 },
      }),
      'amazon.nova-lite-v1:0': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 45, outputTokens: 25, totalTokens: 70 },
      }),
      'google.gemma-3-27b-it': () => {
        throw new Error('Gemma should not be called in Test P');
      },
    });

    const result = await callBedrockRouter(
      'Generate question',
      '',
      500,
      0.5,
      mockClient,
      (data) => {
        if (!data.question) return 'Missing question';
        return null;
      }
    );

    assert('Malformed Claude JSON caused fallback to Nova Lite', result.modelUsed.includes('amazon.nova-lite-v1:0'));
    assert('Nova Lite parsed output is populated', !!result.parsed?.question);
    assert('Gemma was NOT called', !mockClient.calls.some((c) => c.modelId === 'google.gemma-3-27b-it'));
  }

  // ----------------------------------------------------
  // Test Q: Valid Claude JSON does NOT fallback
  // ----------------------------------------------------
  console.log('\nTest Q: Valid Claude JSON succeeds without fallback');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 35, outputTokens: 20, totalTokens: 55 },
      }),
      'amazon.nova-lite-v1:0': () => {
        throw new Error('Nova Lite should never be called when Claude returns valid JSON');
      },
    });

    const result = await callBedrockRouter(
      'Generate question',
      '',
      500,
      0.5,
      mockClient,
      (data) => {
        if (!data.question) return 'Missing question';
        return null;
      }
    );

    assert('Valid Claude JSON succeeds on Claude', result.modelUsed === 'anthropic.claude-3-haiku-20240307-v1:0');
    assert('Parsed question matches Claude response', result.parsed?.question === 'Can you describe a challenging technical architecture decision you made?');
    assert('Only 1 Bedrock call was made (no fallback cycling)', mockClient.calls.length === 1);
  }

  // ----------------------------------------------------
  // Test R: Truncated Claude JSON (stopReason: max_tokens) triggers fallback
  // ----------------------------------------------------
  console.log('\nTest R: Truncated Claude JSON (stopReason: max_tokens) triggers fallback to Nova Lite');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => ({
        output: { message: { content: [{ text: '{"question": "Incomplete question text that cuts off mid-str' }] } },
        usage: { inputTokens: 50, outputTokens: 500, totalTokens: 550 },
        stopReason: 'max_tokens',
      }),
      'amazon.nova-lite-v1:0': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 50, outputTokens: 30, totalTokens: 80 },
        stopReason: 'end_turn',
      }),
    });

    const result = await callBedrockRouter(
      'Generate question',
      '',
      500,
      0.5,
      mockClient,
      (data) => {
        if (!data.question) return 'Missing question';
        return null;
      }
    );

    assert('Truncated output causes fallback to Nova Lite', result.modelUsed.includes('amazon.nova-lite-v1:0'));
    assert('Nova Lite provided clean complete response', result.stopReason === 'end_turn');
  }

  // ----------------------------------------------------
  // Test S: Schema-invalid Claude JSON triggers fallback to Nova Lite
  // ----------------------------------------------------
  console.log('\nTest S: Schema-invalid Claude JSON triggers fallback to Nova Lite');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => ({
        output: { message: { content: [{ text: JSON.stringify({ wrongField: 123, status: 'ok' }) }] } },
        usage: { inputTokens: 30, outputTokens: 15, totalTokens: 45 },
      }),
      'amazon.nova-lite-v1:0': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 35, outputTokens: 25, totalTokens: 60 },
      }),
    });

    const result = await callBedrockRouter(
      'Generate question',
      '',
      500,
      0.5,
      mockClient,
      (data) => {
        if (!data.question) return 'Missing "question" field';
        return null;
      }
    );

    assert('Schema-invalid output causes fallback to Nova Lite', result.modelUsed.includes('amazon.nova-lite-v1:0'));
    assert('Parsed question is valid', !!result.parsed?.question);
  }

  // ----------------------------------------------------
  // Test T: Programming error (TypeError) fails fast without fallback
  // ----------------------------------------------------
  console.log('\nTest T: Programming error fails fast without fallback');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => ({
        output: { message: { content: [{ text: mockQ1Response }] } },
        usage: { inputTokens: 30, outputTokens: 20, totalTokens: 50 },
      }),
      'amazon.nova-lite-v1:0': () => {
        throw new Error('Should not fallback on programming error');
      },
    });

    try {
      await callBedrockRouter(
        'Generate question',
        '',
        500,
        0.5,
        mockClient,
        () => {
          throw new TypeError('Intentional code bug');
        }
      );
      assert('Expected TypeError to be thrown', false);
    } catch (err) {
      assert('Throws TypeError directly', err instanceof TypeError && err.message === 'Intentional code bug');
      assert('Did not cycle to Nova Lite', mockClient.calls.length === 1);
    }
  }

  // ----------------------------------------------------
  // Test U: Client ValidationException fails fast without fallback
  // ----------------------------------------------------
  console.log('\nTest U: Client ValidationException fails fast without fallback');
  {
    const mockClient = createMockBedrockClient({
      'anthropic.claude-3-haiku-20240307-v1:0': () => {
        const err = new Error('The input parameter was invalid');
        err.name = 'ValidationException';
        throw err;
      },
      'amazon.nova-lite-v1:0': () => {
        throw new Error('Should not fallback on ValidationException');
      },
    });

    try {
      await callBedrockRouter('Generate question', '', 500, 0.5, mockClient);
      assert('Expected ValidationException to fail fast', false);
    } catch (err) {
      assert('Fails fast on ValidationException (HTTP 503)', err.statusCode === 503);
      assert('Did not cycle to Nova Lite', mockClient.calls.length === 1);
    }
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
