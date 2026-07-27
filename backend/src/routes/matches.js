import { Router } from 'express';
import { requireSession } from '../middleware/session.js';
import {
  getMatchState,
  completeAnswer,
  submitScore,
  submitReview,
  calculateResult,
} from '../services/matchService.js';
import { issueMatchAudioToken } from '../services/audioTokenService.js';

const router = Router();

/**
 * POST /api/matches/:matchId/audio-token
 * Issue a LiveKit participant JWT for an ACTIVE match participant.
 * Requires temporary session (X-Player-Id, X-Session-Token).
 * Response: { token, serverUrl } only — never API secrets.
 * Tokens/rooms are not stored in PostgreSQL.
 */
router.post('/:matchId/audio-token', requireSession, async (req, res, next) => {
  try {
    const payload = await issueMatchAudioToken(
      req.params.matchId,
      req.player.id,
      req.player.display_name
    );
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/matches/:matchId
 * Player-facing match state (names, role, question, phase, completion/scores, flags).
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
 * POST /api/matches/:matchId/answer-complete
 * Mark spoken answer complete (no request body — LiveKit audio only).
 * Requires temporary session headers (X-Player-Id, X-Session-Token).
 * Spoken-turn completion only (empty body). Legacy POST .../answer is not registered.
 */
router.post('/:matchId/answer-complete', requireSession, async (req, res, next) => {
  try {
    const state = await completeAnswer(req.params.matchId, req.player.id);
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
