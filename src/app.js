import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import errorHandler from './middleware/errorHandler.js';
import contactRoutes from './routes/contact.routes.js';
import resumeRoutes from './routes/resume.routes.js';

const app = express();

// Disable X-Powered-By Header for security
app.disable('x-powered-by');

// Security HTTP headers
app.use(helmet());

// Compression Middleware
app.use(compression());

// CORS Configuration supporting multiple origins from CLIENT_URL
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser
app.use(cookieParser());

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend Running Successfully',
  });
});

// Application Feature Routes
app.use('/api/contact', contactRoutes);
app.use('/api/resume', resumeRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route Not Found',
  });
});

// Global Centralized Error Handler Middleware
app.use(errorHandler);

export default app;
