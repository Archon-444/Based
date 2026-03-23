import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { serializeResponse } from './middleware/serializeResponse.js';
import { metricsHandler, metricsMiddleware } from './monitoring/metrics.js';
import { router as apiRouter } from './routes/index.js';

const app = express();

// Strict security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for some CSS-in-JS
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", env.CORS_ORIGIN.split(',').map((o) => o.trim())].flat(),
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS with strict origin validation
const allowedOrigins = env.CORS_ORIGIN.split(',').map((item) => item.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check against whitelist
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('[CORS] Blocked request from origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-wallet-signature',
      'x-wallet-message',
      'x-wallet-address',
      'x-wallet-public-key',
      'x-wallet-timestamp',
      'x-wallet-nonce',
      'x-active-chain',
    ],
    maxAge: 86400, // 24 hours
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.use(serializeResponse);
app.use(metricsMiddleware);

// Multi-layer rate limiting strategy
const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
    // Advanced key generator: IP + User ID (if authenticated)
    keyGenerator: (req) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userId = (req as unknown as Record<string, Record<string, string>>).wallet?.address;
      return userId ? `${ip}:${userId}` : ip;
    },
    handler: (req, res) => {
      logger.warn(
        {
          ip: req.ip,
          path: req.path,
          userId: (req as unknown as Record<string, Record<string, string>>).wallet?.address,
        },
        'Rate limit exceeded'
      );
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// Global rate limiter (general API protection)
const globalLimiter = createRateLimiter(
  env.RATE_LIMIT_WINDOW_MS,
  env.RATE_LIMIT_MAX,
  'Too many requests. Please try again later.'
);

app.use(globalLimiter);

// Swagger API Documentation
// Disable CSP for Swagger UI (it uses inline scripts)
app.use('/api-docs', (req, res, next) => {
  res.removeHeader('Content-Security-Policy');
  next();
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Move Market API Docs',
    customfavIcon: '/favicon.ico',
  })
);

// OpenAPI JSON spec endpoint
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/metrics', metricsHandler);

app.use('/api', apiRouter);

app.use(errorHandler);

export default app;
