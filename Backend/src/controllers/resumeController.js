import { parseResumeFile } from '../services/resume/resumeParser.js';
import aiProvider from '../services/ai/aiProvider.js';
import { uploadToS3 } from '../services/aws/s3Service.js';
import { isAwsConfigured } from '../config/awsConfig.js';

export const handleResumeUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded.',
      });
    }

    // 1. Parse text from PDF or DOCX
    const { rawText, fileName } = await parseResumeFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    if (!rawText || rawText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract readable text from the uploaded resume file.',
      });
    }

    // 2. Upload to S3 if AWS configured
    let fileUrl = '';
    if (isAwsConfigured()) {
      try {
        const s3Upload = await uploadToS3({
          fileBuffer: req.file.buffer,
          mimeType: req.file.mimetype,
          folder: 'resumes',
          originalName: fileName,
        });
        fileUrl = s3Upload.url;
      } catch (s3Err) {
        console.warn('[Resume Upload] S3 upload skipped/failed:', s3Err.message);
      }
    }

    // 3. Analyze resume via AI Provider
    const structuredData = await aiProvider.analyzeResume(rawText);

    res.status(200).json({
      success: true,
      message: 'Resume parsed and analyzed successfully',
      resumeData: {
        fileName,
        fileUrl,
        rawText,
        skills: structuredData.skills || [],
        projects: structuredData.projects || [],
        technologies: structuredData.technologies || [],
        experience: structuredData.experience || [],
        education: structuredData.education || [],
      },
    });
  } catch (error) {
    next(error);
  }
};
