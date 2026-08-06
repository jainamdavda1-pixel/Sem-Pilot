import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { config } from './config/env.js';

const app = express();

// Standard middlewares
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = (config.CORS_ORIGIN || '').split(',').map(o => o.trim());
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('chrome-extension://') ||
      origin.includes('.vercel.app') ||
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root status check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'SemPilot Backend Server is running', status: 'OK' });
});

// Healthcheck API
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1', apiRouter);

// Fallback middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
export default app;
