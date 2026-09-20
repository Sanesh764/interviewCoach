import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { S3Client } from '@aws-sdk/client-s3';
import { TranscribeClient } from '@aws-sdk/client-transcribe';
import { PollyClient } from '@aws-sdk/client-polly';

const getAwsClientConfig = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;
  const region = process.env.AWS_REGION || 'ap-south-1';

  const config = { region };

  if (accessKeyId && secretAccessKey) {
    config.credentials = {
      accessKeyId,
      secretAccessKey,
    };
    if (sessionToken) {
      config.credentials.sessionToken = sessionToken;
    }
  }

  return config;
};

export const isAwsConfigured = () => {
  // 1. Explicit credentials in environment
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return true;
  }
  // 2. Production or AWS deployment environment where IAM instance role / AWS provider resolves credentials
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
    process.env.AWS_PROFILE ||
    process.env.AWS_ROLE_ARN
  ) {
    return true;
  }
  return false;
};

export const verifyAwsConfiguration = (serviceName = 'AWS') => {
  if (!isAwsConfigured()) {
    throw new Error(
      `AI service is not configured. Please configure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) in your Backend .env file or attach an IAM role to enable ${serviceName}.`
    );
  }
};

const baseClientConfig = getAwsClientConfig();

export const bedrockClient = new BedrockRuntimeClient({
  ...baseClientConfig,
  maxAttempts: 1,
});

export const s3Client = new S3Client(baseClientConfig);

export const transcribeClient = new TranscribeClient(baseClientConfig);

export const pollyClient = new PollyClient(baseClientConfig);

export const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'ap-south-1',
  bedrockModelId: process.env.BEDROCK_PRIMARY_MODEL || process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
  bedrockPrimaryModel: process.env.BEDROCK_PRIMARY_MODEL || process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
  bedrockFallbackModel1: process.env.BEDROCK_FALLBACK_MODEL_1 || 'amazon.nova-lite-v1:0',
  bedrockFallbackModel2: process.env.BEDROCK_FALLBACK_MODEL_2 || 'google.gemma-3-27b-it',
  s3BucketName: process.env.S3_BUCKET_NAME || 'interviewcoach-recordings',
  transcribeLanguageCode: process.env.TRANSCRIBE_LANGUAGE_CODE || 'en-US',
  pollyVoiceId: process.env.POLLY_VOICE_ID || 'Joanna',
  pollyEngine: process.env.POLLY_ENGINE || 'neural',
};

/**
 * Resolves model ID with required AWS Bedrock cross-region inference profile if applicable
 * (e.g. In ap-south-1, Nova models require the regional 'apac.' inference profile).
 */
export const resolveBedrockModelId = (modelId, region = AWS_CONFIG.region) => {
  if (!modelId) return modelId;
  if (region.startsWith('ap-') && modelId === 'amazon.nova-lite-v1:0') {
    return 'apac.amazon.nova-lite-v1:0';
  }
  if (region.startsWith('us-') && modelId === 'amazon.nova-lite-v1:0') {
    return 'us.amazon.nova-lite-v1:0';
  }
  return modelId;
};

/**
 * Returns the sequential fallback model chain:
 * Primary (Claude 3 Haiku) -> Fallback 1 (Nova Lite) -> Fallback 2 (Gemma 3 27B)
 */
export const getBedrockModelChain = () => {
  const primary = resolveBedrockModelId(AWS_CONFIG.bedrockPrimaryModel);
  const fallback1 = resolveBedrockModelId(AWS_CONFIG.bedrockFallbackModel1);
  const fallback2 = resolveBedrockModelId(AWS_CONFIG.bedrockFallbackModel2);

  return [primary, fallback1, fallback2].filter(Boolean);
};


