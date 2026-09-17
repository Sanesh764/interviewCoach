import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, AWS_CONFIG, verifyAwsConfiguration } from '../../config/awsConfig.js';
import crypto from 'crypto';

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

  // Return S3 URI and Public/Region URL
  const s3Uri = `s3://${AWS_CONFIG.s3BucketName}/${key}`;
  const url = `https://${AWS_CONFIG.s3BucketName}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;

  return {
    key,
    bucket: AWS_CONFIG.s3BucketName,
    s3Uri,
    url,
  };
};
