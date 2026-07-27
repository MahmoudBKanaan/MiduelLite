import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { INTERESTS, AVATAR_IDS } from './config/interests.js';
import playersRouter from './routes/players.js';
import poolRouter from './routes/pool.js';
import matchesRouter from './routes/matches.js';

/**
 * Build the Express application (exported for tests).
 */
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    })
  );
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/config', (_req, res) => {
    res.json({
      interests: INTERESTS,
      avatarIds: AVATAR_IDS,
    });
  });

  app.use('/api/players', playersRouter);
  app.use('/api/pool', poolRouter);
  app.use('/api/matches', matchesRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Never expose stack traces to the client
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    const message =
      status === 500 ? 'Server error' : err.message || 'Request failed';
    if (status === 500) {
      console.error(err);
    }
    res.status(status).json({ error: message });
  });

  return app;
}

export default createApp;
