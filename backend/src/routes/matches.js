import { Router } from 'express';
import { requireSession } from '../middleware/session.js';
import {
  getMatchState,
  submitAnswer,
  submitScore,
  submitReview,
  calculateResult,
} from '../services/matchService.js';

const router = Router();

router.get('/:matchId', requireSession, async (req, res, next) => {
  try {
    const state = await getMatchState(req.params.matchId, req.player.id);
    res.json(state);
  } catch (err) {
    next(err);
  }
});

router.post('/:matchId/answer', requireSession, async (req, res, next) => {
  try {
    const state = await submitAnswer(
      req.params.matchId,
      req.player.id,
      req.body?.answer
    );
    res.json(state);
  } catch (err) {
    next(err);
  }
});

router.post('/:matchId/score', requireSession, async (req, res, next) => {
  try {
    const state = await submitScore(
      req.params.matchId,
      req.player.id,
      req.body?.score
    );
    res.json(state);
  } catch (err) {
    next(err);
  }
});

router.post('/:matchId/review', requireSession, async (req, res, next) => {
  try {
    const state = await submitReview(
      req.params.matchId,
      req.player.id,
      req.body?.flag
    );
    res.json(state);
  } catch (err) {
    next(err);
  }
});

router.get('/:matchId/result', requireSession, async (req, res, next) => {
  try {
    const result = await calculateResult(req.params.matchId, req.player.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
