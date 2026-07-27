import { Router } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../db.js';
import { validatePlayerInput } from '../services/playerValidation.js';

const router = Router();

/**
 * POST /api/players
 * Create a temporary anonymous player session.
 * Returns { playerId, sessionToken } — no accounts, no JWT.
 */
router.post('/', async (req, res, next) => {
  try {
    const validated = validatePlayerInput(req.body);
    if (!validated.ok) {
      return res.status(400).json({ error: validated.error });
    }

    const playerId = randomUUID();
    const sessionToken = randomUUID();

    await query(
      `INSERT INTO players (id, session_token, display_name, avatar_id, interests)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        playerId,
        sessionToken,
        validated.displayName,
        validated.avatarId,
        validated.interestIds,
      ]
    );

    res.status(201).json({ playerId, sessionToken });
  } catch (err) {
    next(err);
  }
});

export default router;
