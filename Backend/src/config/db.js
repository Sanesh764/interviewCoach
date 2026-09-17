import mongoose from 'mongoose';

export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewcoach';
  const localUri = 'mongodb://127.0.0.1:27017/interviewcoach';

  try {
    const conn = await mongoose.connect(primaryUri);
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
  } catch (primaryError) {
    console.warn(`[MongoDB Warning] Primary connection failed (${primaryError.message}). Attempting local MongoDB...`);
    try {
      const conn = await mongoose.connect(localUri);
      console.log(`[MongoDB] Connected to local database: ${conn.connection.host}/${conn.connection.name}`);
    } catch (localError) {
      console.error(`[MongoDB Error] Both primary and local connection failed: ${localError.message}`);
      process.exit(1);
    }
  }
};
