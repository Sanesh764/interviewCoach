import { uploadToS3 } from '../aws/s3Service.js';
import { transcribeAudio } from '../aws/transcribeService.js';

export const processVoiceRecording = async ({ audioBuffer, mimeType = 'audio/webm' }) => {
  let ext = 'webm';
  if (mimeType.includes('wav')) ext = 'wav';
  else if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = 'mp4';
  else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) ext = 'mp3';
  else if (mimeType.includes('ogg')) ext = 'ogg';

  // 1. Upload audio recording to Amazon S3
  const s3Result = await uploadToS3({
    fileBuffer: audioBuffer,
    mimeType,
    folder: 'voice-recordings',
    originalName: `answer.${ext}`,
  });

  // 2. Transcribe audio via Amazon Transcribe
  const transcript = await transcribeAudio(s3Result.s3Uri, ext);

  return {
    audioUrl: s3Result.url,
    transcript,
  };
};
