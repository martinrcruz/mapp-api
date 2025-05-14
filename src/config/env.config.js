const dotenv = require('dotenv');

// Cargar variables de ambiente
dotenv.config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    uri:
      process.env.MONGODB_URI ||
      'mongodb+srv://mapp-adm-user:IFZJyhKkIVVXZ6Ri@cluster0.vpewp27.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    options: {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 60000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    allowedOrigins: process.env.CORS_ORIGIN
      ? [process.env.CORS_ORIGIN]
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:4200',
          'https://jellyfish-app-drx97.ondigitalocean.app',
          'https://mapp-front-5h2p5.ondigitalocean.app',
        ],
  },
  api: {
    prefix: '/api/v1',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
};

module.exports = config;
