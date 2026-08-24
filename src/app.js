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
import candidateApplicationRoutes from './routes/candidateApplication.routes.js';

const app = express();

// Trust reverse proxy headers on Render/Vercel for express-rate-limit
app.set('trust proxy', 1);

// Disable X-Powered-By Header for security
app.disable('x-powered-by');

// Security HTTP headers
app.use(helmet());

// Compression Middleware
app.use(compression());

// CORS Configuration supporting production domains, Vercel frontend, localhost, and env origins
const defaultOrigins = [
  'https://www.jmsgroups.com',
  'https://jmsgroups.com',
  'https://jms-group-fronthend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const parseOrigins = (envVar) => {
  if (!envVar) return [];
  return envVar
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
};

const envOrigins = [
  ...parseOrigins(process.env.CLIENT_URL),
  ...parseOrigins(process.env.ALLOWED_ORIGINS),
];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

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
app.use('/api/applications', candidateApplicationRoutes);
app.use('/api/candidate-applications', candidateApplicationRoutes);

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
