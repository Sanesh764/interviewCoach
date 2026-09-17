import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

export const parseResumeFile = async (fileBuffer, mimeType, originalName = '') => {
  let rawText = '';

  const isPdf =
    mimeType === 'application/pdf' ||
    originalName.toLowerCase().endsWith('.pdf');

  const isDocx =
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    originalName.toLowerCase().endsWith('.docx');

  if (isPdf) {
    const pdfData = await pdf(fileBuffer);
    rawText = pdfData.text || '';
  } else if (isDocx) {
    const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
    rawText = docxResult.value || '';
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
  }

  // Clean raw text
  rawText = rawText.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim();

  return {
    rawText,
    fileName: originalName,
  };
};
