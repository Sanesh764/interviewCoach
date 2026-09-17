import { uploadToS3 } from '../aws/s3Service.js';
import { transcribeAudio, getSanitizedAudioFormat } from '../aws/transcribeService.js';

export const processVoiceRecording = async ({ audioBuffer, mimeType = 'audio/webm' }) => {
  const ext = getSanitizedAudioFormat(mimeType);

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
