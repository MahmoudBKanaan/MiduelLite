import { Router } from 'express';
import { randomUUID } from 'crypto';
import { query } from '../db.js';
import { AVATAR_IDS, VALID_INTEREST_IDS } from '../config/interests.js';

const router = Router();

/**
 * POST /api/players — create temporary anonymous player session.
 */
router.post('/', async (req, res, next) => {
  try {
    let { displayName, avatarId, interestIds } = req.body || {};

    if (typeof displayName !== 'string') {
      return res.status(400).json({ error: 'Display name is required' });
    }
    displayName = displayName.trim();
    if (displayName.length < 2 || displayName.length > 20) {
      return res
        .status(400)
        .json({ error: 'Display name must be 2–20 characters' });
    }

    const avatar = Number(avatarId);
    if (!Number.isInteger(avatar) || !AVATAR_IDS.includes(avatar)) {
      return res.status(400).json({ error: 'Avatar must be an ID from 1 to 12' });
    }

    if (!Array.isArray(interestIds) || interestIds.length !== 3) {
      return res
        .status(400)
        .json({ error: 'Exactly three interests are required' });
    }

    const ids = interestIds.map(Number);
    if (ids.some((id) => !Number.isInteger(id) || !VALID_INTEREST_IDS.includes(id))) {
      return res.status(400).json({ error: 'Invalid interest IDs' });
    }
    if (new Set(ids).size !== 3) {
      return res.status(400).json({ error: 'Interests must be unique' });
    }

    const playerId = randomUUID();
    const sessionToken = randomUUID();

    await query(
      `INSERT INTO players (id, session_token, display_name, avatar_id, interests)
       VALUES ($1, $2, $3, $4, $5)`,
      [playerId, sessionToken, displayName, avatar, ids]
    );

    res.status(201).json({ playerId, sessionToken });
  } catch (err) {
    next(err);
  }
});

export default router;
