import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { S3Client } from '@aws-sdk/client-s3';
import { TranscribeClient } from '@aws-sdk/client-transcribe';
import { PollyClient } from '@aws-sdk/client-polly';

const getAwsCredentials = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  const creds = {
    accessKeyId,
    secretAccessKey,
  };

  if (sessionToken) {
    creds.sessionToken = sessionToken;
  }

  return { credentials: creds, region };
};

export const isAwsConfigured = () => {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
};

export const verifyAwsConfiguration = (serviceName = 'AWS') => {
  if (!isAwsConfigured()) {
    throw new Error(
      `AI service is not configured. Please configure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) in your Backend .env file to enable ${serviceName}.`
    );
  }
};

const awsAuth = getAwsCredentials();

export const bedrockClient = new BedrockRuntimeClient(
  awsAuth ? awsAuth : { region: process.env.AWS_REGION || 'us-east-1' }
);

export const s3Client = new S3Client(
  awsAuth ? awsAuth : { region: process.env.AWS_REGION || 'us-east-1' }
);

export const transcribeClient = new TranscribeClient(
  awsAuth ? awsAuth : { region: process.env.AWS_REGION || 'us-east-1' }
);

export const pollyClient = new PollyClient(
  awsAuth ? awsAuth : { region: process.env.AWS_REGION || 'us-east-1' }
);

export const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  bedrockModelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0',
  s3BucketName: process.env.S3_BUCKET_NAME || 'interviewcoach-recordings',
  transcribeLanguageCode: process.env.TRANSCRIBE_LANGUAGE_CODE || 'en-US',
  pollyVoiceId: process.env.POLLY_VOICE_ID || 'Joanna',
  pollyEngine: process.env.POLLY_ENGINE || 'neural',
};
