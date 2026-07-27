import { query } from '../db.js';

/**
 * Validate temporary session headers X-Player-Id and X-Session-Token.
 */
export async function requireSession(req, res, next) {
  const playerId = req.get('X-Player-Id');
  const sessionToken = req.get('X-Session-Token');

  if (!playerId || !sessionToken) {
    return res.status(401).json({ error: 'Missing session identity' });
  }

  try {
    const result = await query(
      'SELECT id, session_token, display_name, avatar_id, interests FROM players WHERE id = $1',
      [playerId]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    if (result.rows[0].session_token !== sessionToken) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    req.player = result.rows[0];
    next();
  } catch (err) {
    next(err);
  }
}
