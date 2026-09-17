import {
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  DeleteTranscriptionJobCommand,
} from '@aws-sdk/client-transcribe';
import { transcribeClient, AWS_CONFIG, verifyAwsConfiguration } from '../../config/awsConfig.js';
import crypto from 'crypto';

// Sanitize arbitrary browser MIME types into standard Amazon Transcribe media formats
export const getSanitizedAudioFormat = (formatOrMime = 'webm') => {
  const str = String(formatOrMime || 'webm').toLowerCase();
  if (str.includes('wav')) return 'wav';
  if (str.includes('mp4') || str.includes('m4a')) return 'mp4';
  if (str.includes('mp3') || str.includes('mpeg')) return 'mp3';
  if (str.includes('ogg')) return 'ogg';
  return 'webm';
};

export const transcribeAudio = async (s3AudioUri, mediaFormat = 'webm') => {
  verifyAwsConfiguration('Amazon Transcribe');

  const sanitizedFormat = getSanitizedAudioFormat(mediaFormat);

  const randomString = crypto.randomBytes(6).toString('hex');
  const jobName = `interviewcoach-transcribe-${Date.now()}-${randomString}`;

  const startCommand = new StartTranscriptionJobCommand({
    TranscriptionJobName: jobName,
    LanguageCode: AWS_CONFIG.transcribeLanguageCode,
    MediaFormat: sanitizedFormat,
    Media: {
      MediaFileUri: s3AudioUri,
    },
  });

  await transcribeClient.send(startCommand);

  // Poll for completion (timeout after 90 seconds)
  const startTime = Date.now();
  const maxTimeoutMs = 90000;

  try {
    while (Date.now() - startTime < maxTimeoutMs) {
      const statusCommand = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName,
      });

      const response = await transcribeClient.send(statusCommand);
      const job = response.TranscriptionJob;
      const status = job.TranscriptionJobStatus;

      if (status === 'COMPLETED') {
        const transcriptFileUri = job.Transcript?.TranscriptFileUri;
        if (!transcriptFileUri) {
          throw new Error('Transcription completed but no transcript URI was returned.');
        }

        // Fetch the transcript JSON
        const transcriptRes = await fetch(transcriptFileUri);
        const transcriptData = await transcriptRes.json();
        const transcriptText = transcriptData.results?.transcripts?.[0]?.transcript || '';

        return transcriptText.trim();
      } else if (status === 'FAILED') {
        throw new Error(`Amazon Transcribe job failed: ${job.FailureReason || 'Unknown error'}`);
      }

      // Wait 2 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Amazon Transcribe timed out waiting for transcription to complete.');
  } finally {
    // Always clean up transcription job to prevent accumulation in AWS account
    try {
      await transcribeClient.send(
        new DeleteTranscriptionJobCommand({ TranscriptionJobName: jobName })
      );
    } catch (cleanupErr) {
      console.warn(`[Transcribe] Note: failed to delete job ${jobName}:`, cleanupErr.message);
    }
  }
};
