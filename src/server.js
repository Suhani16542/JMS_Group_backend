import path from 'path';
import dotenv from 'dotenv';

// 1. Resolve absolute path of .env file in project root
const envPath = path.resolve(process.cwd(), '.env');

// 2. Initialize dotenv BEFORE any application modules are loaded
const envResult = dotenv.config({ path: envPath });

// Print environment initialization info immediately after dotenv loads
console.log(`[ENV DEBUG] process.cwd(): ${process.cwd()}`);
console.log(`[ENV DEBUG] Loaded .env path: ${envPath}`);
console.log(`[ENV DEBUG] process.env.SMTP_USER immediately after dotenv: ${process.env.SMTP_USER}`);

// 3. Dynamically import modules after process.env is fully loaded
const { default: logger } = await import('./utils/logger.js');
const { default: validateEnv } = await import('./config/envValidation.js');
const { default: connectDB } = await import('./config/database.js');
const { verifyCloudinary } = await import('./config/cloudinary.js');
const { verifySMTP } = await import('./config/smtp.js');
const { default: app } = await import('./app.js');

// Print loaded .env metadata and variable status
logger.info(`Loaded .env File Path: ${envPath}`);
logger.info(`MONGODB_URI Exists in process.env: ${Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim())}`);

// Validate required environment variables
validateEnv();

const PORT = process.env.PORT || 5000;

// Connect Database & Verify Configs then Start Server
const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Verify Cloudinary Configuration
    await verifyCloudinary();

    // 3. Verify Brevo SMTP Transporter Configuration asynchronously (non-blocking)
    verifySMTP().catch((err) => {
      logger.warn(`[SMTP Warning] Brevo SMTP connection check failed: ${err.message}`);
    });

    // 4. Start Express HTTP Server
    const server = app.listen(PORT, () => {
      logger.success(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle Uncaught Exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Server initialization failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
