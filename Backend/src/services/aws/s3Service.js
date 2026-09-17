import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, AWS_CONFIG, verifyAwsConfiguration } from '../../config/awsConfig.js';
import crypto from 'crypto';

// Generate a short-lived presigned URL for private S3 object access
export const getPresignedUrl = async (key, expiresIn = 3600) => {
  verifyAwsConfiguration('Amazon S3');
  const command = new GetObjectCommand({
    Bucket: AWS_CONFIG.s3BucketName,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
};

export const uploadToS3 = async ({ fileBuffer, mimeType, folder = 'uploads', originalName = '' }) => {
  verifyAwsConfiguration('Amazon S3');

  const randomString = crypto.randomBytes(8).toString('hex');
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${Date.now()}-${randomString}-${sanitizedName || 'file'}`;

  const command = new PutObjectCommand({
    Bucket: AWS_CONFIG.s3BucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  // Generate secure presigned URL for browser playback/download (bucket remains 100% private)
  let presignedUrl = '';
  try {
    presignedUrl = await getPresignedUrl(key, 3600); // 1 hour expiration
  } catch (signErr) {
    console.warn('[S3] Presigned URL generation warning:', signErr.message);
  }

  const s3Uri = `s3://${AWS_CONFIG.s3BucketName}/${key}`;
  const url = presignedUrl || `https://${AWS_CONFIG.s3BucketName}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;

  return {
    key,
    bucket: AWS_CONFIG.s3BucketName,
    s3Uri,
    url,
  };
};
