import { SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { pollyClient, AWS_CONFIG, verifyAwsConfiguration } from '../../config/awsConfig.js';
import { uploadToS3 } from './s3Service.js';

export const synthesizeSpeech = async (text, saveToS3 = true) => {
  verifyAwsConfiguration('Amazon Polly');

  const command = new SynthesizeSpeechCommand({
    OutputFormat: 'mp3',
    Text: text,
    VoiceId: AWS_CONFIG.pollyVoiceId,
    Engine: AWS_CONFIG.pollyEngine,
  });

  const response = await pollyClient.send(command);

  // Convert audio stream to buffer
  const audioBuffer = await response.AudioStream.transformToByteArray();
  const buffer = Buffer.from(audioBuffer);

  let audioUrl = '';

  if (saveToS3) {
    try {
      const s3Upload = await uploadToS3({
        fileBuffer: buffer,
        mimeType: 'audio/mpeg',
        folder: 'ai-questions',
        originalName: 'question.mp3',
      });
      audioUrl = s3Upload.url;
    } catch (err) {
      console.warn('[Polly] S3 upload failed, returning base64 audio URI:', err.message);
      audioUrl = `data:audio/mp3;base64,${buffer.toString('base64')}`;
    }
  } else {
    audioUrl = `data:audio/mp3;base64,${buffer.toString('base64')}`;
  }

  return {
    audioUrl,
    buffer,
  };
};
