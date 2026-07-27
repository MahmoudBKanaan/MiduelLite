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

/**
 * GET /api/matches/:matchId
 * Player-facing match state (names, role, question, phase, answers/scores, flags).
 */
router.get('/:matchId', requireSession, async (req, res, next) => {
  try {
    const state = await getMatchState(req.params.matchId, req.player.id);
    res.json(state);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/matches/:matchId/answer
 * Body: { "answer": "..." }
 */
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

/**
 * POST /api/matches/:matchId/score
 * Body: { "score": 1..10 }
 */
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

/**
 * POST /api/matches/:matchId/review
 * Body: { "flag": false } = ACCEPT, { "flag": true } = FLAG
 *    or { "action": "ACCEPT" | "FLAG" }
 * Player reviews only their own received score; decision is immutable.
 */
router.post('/:matchId/review', requireSession, async (req, res, next) => {
  try {
    const state = await submitReview(
      req.params.matchId,
      req.player.id,
      req.body
    );
    res.json(state);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/:matchId/result
 * Available when status = ENDED.
 */
router.get('/:matchId/result', requireSession, async (req, res, next) => {
  try {
    const result = await calculateResult(req.params.matchId, req.player.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
