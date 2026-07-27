import { Router } from 'express';
import { requireSession } from '../middleware/session.js';
import {
  joinPool,
  leavePool,
  poolStatus,
} from '../services/matchmakingService.js';

const router = Router();

router.post('/join', requireSession, async (req, res, next) => {
  try {
    const result = await joinPool(req.player.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/status', requireSession, async (req, res, next) => {
  try {
    const result = await poolStatus(req.player.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/leave', requireSession, async (req, res, next) => {
  try {
    const result = await leavePool(req.player.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
