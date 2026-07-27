import { Router } from 'express';
import { requireSession } from '../middleware/session.js';
import {
  joinPool,
  leavePool,
  poolStatus,
} from '../services/matchmakingService.js';

const router = Router();

/**
 * POST /api/pool/join
 * Requires X-Player-Id + X-Session-Token.
 * Returns WAITING or MATCHED + matchId.
 */
router.post('/join', requireSession, async (req, res, next) => {
  try {
    const result = await joinPool(req.player.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/pool/status
 * Requires session. Returns WAITING | MATCHED | IDLE.
 */
router.get('/status', requireSession, async (req, res, next) => {
  try {
    const result = await poolStatus(req.player.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/pool/leave
 * Requires session. Removes player from queue.
 */
router.post('/leave', requireSession, async (req, res, next) => {
  try {
    const result = await leavePool(req.player.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
