import mongoose from 'mongoose';
import dns from 'dns';

// In production on AWS VPC, use the VPC Route 53 Resolver (/etc/resolv.conf)
// Only override DNS if explicitly requested or in non-production dev environments
if (process.env.CUSTOM_DNS_SERVERS) {
  const servers = process.env.CUSTOM_DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean);
  if (servers.length > 0) {
    dns.setServers(servers);
  }
} else if ((process.env.NODE_ENV || 'development') !== 'production') {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewcoach';
  const localUri = 'mongodb://127.0.0.1:27017/interviewcoach';
  const isProd = (process.env.NODE_ENV || 'development') === 'production';

  const connectionOptions = {
    serverSelectionTimeoutMS: 8000, // 8-second timeout prevents indefinite Elastic Beanstalk startup hang
  };

  try {
    const conn = await mongoose.connect(primaryUri, connectionOptions);
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
  } catch (primaryError) {
    console.error(`[MongoDB Error] Primary connection failed: ${primaryError.message}`);

    if (isProd) {
      console.error('[MongoDB Fatal] In production, local MongoDB fallback is disabled. Please check your MONGODB_URI and MongoDB Atlas Network Access / IP Whitelist (0.0.0.0/0 or AWS NAT IP).');
      process.exit(1);
    }

    console.warn('[MongoDB Warning] Attempting local MongoDB fallback for development...');
    try {
      const conn = await mongoose.connect(localUri, connectionOptions);
      console.log(`[MongoDB] Connected to local database: ${conn.connection.host}/${conn.connection.name}`);
    } catch (localError) {
      console.error(`[MongoDB Error] Both primary and local connection failed: ${localError.message}`);
      process.exit(1);
    }
  }
};

