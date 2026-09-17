import multer from 'multer';

// Use memory storage so we can stream to S3 or parse buffers directly
const storage = multer.memoryStorage();

export const uploadResumeMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');
    const isDocx =
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.originalname.toLowerCase().endsWith('.docx');

    if (isPdf || isDocx) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX resume files are supported.'), false);
    }
  },
}).single('resume');

export const uploadAudioMiddleware = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
  },
  fileFilter: (req, file, cb) => {
    // accept webm, wav, mp3, ogg, mp4 audio
    if (file.mimetype.startsWith('audio/') || file.originalname.endsWith('.webm')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio recordings are supported.'), false);
    }
  },
}).single('audio');
