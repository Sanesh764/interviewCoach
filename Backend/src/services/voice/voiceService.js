import { uploadToS3 } from '../aws/s3Service.js';
import { transcribeAudio } from '../aws/transcribeService.js';

export const processVoiceRecording = async ({ audioBuffer, mimeType = 'audio/webm' }) => {
  // 1. Upload audio recording to Amazon S3
  const s3Result = await uploadToS3({
    fileBuffer: audioBuffer,
    mimeType,
    folder: 'voice-recordings',
    originalName: 'answer.webm',
  });

  // 2. Transcribe audio via Amazon Transcribe
  const transcript = await transcribeAudio(s3Result.s3Uri, 'webm');

  return {
    audioUrl: s3Result.url,
    transcript,
  };
};
