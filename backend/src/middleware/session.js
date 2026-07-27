import { query } from '../db.js';

/**
 * Minimal temporary-session validation (NOT login / JWT / accounts).
 *
 * Protected routes must send:
 *   X-Player-Id: <uuid>
 *   X-Session-Token: <uuid>
 *
 * The backend checks that the player row exists and that the session token
 * belongs to that player. Identity is temporary and anonymous.
 */
export async function requireSession(req, res, next) {
  const playerId = req.get('X-Player-Id');
  const sessionToken = req.get('X-Session-Token');

  if (!playerId || !sessionToken) {
    return res.status(401).json({ error: 'Missing session identity' });
  }

  try {
    const result = await query(
      `SELECT id, session_token, display_name, avatar_id, interests
       FROM players
       WHERE id = $1`,
      [playerId]
    );

    // Player ID must exist
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const player = result.rows[0];

    // Session token must belong to this player
    if (String(player.session_token) !== String(sessionToken)) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    req.player = player;
    next();
  } catch (err) {
    next(err);
  }
}
