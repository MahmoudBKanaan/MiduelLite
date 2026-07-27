import { query, getClient } from '../db.js';

/**
 * Count shared interest IDs between two interest arrays.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} 0–3
 */
export function calculateInterestOverlap(a, b) {
  const setB = new Set(b);
  let count = 0;
  for (const id of a) {
    if (setB.has(id)) count += 1;
  }
  return count;
}

/**
 * Attempt to match a player with the best compatible waiting opponent.
 * Waiting player becomes Player 1; joiner becomes Player 2.
 * @param {string} playerId
 * @returns {Promise<{ status: 'WAITING' } | { status: 'MATCHED', matchId: string }>}
 */
export async function joinPool(playerId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Ensure player exists
    const playerRes = await client.query(
      'SELECT id, interests FROM players WHERE id = $1',
      [playerId]
    );
    if (playerRes.rowCount === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Player not found');
      err.status = 404;
      throw err;
    }

    // Already in an active match?
    const activeMatch = await client.query(
      `SELECT id FROM matches
       WHERE status = 'ACTIVE' AND (player1_id = $1 OR player2_id = $1)
       LIMIT 1`,
      [playerId]
    );
    if (activeMatch.rowCount > 0) {
      await client.query('COMMIT');
      return { status: 'MATCHED', matchId: activeMatch.rows[0].id };
    }

    // Remove stale queue entry for this player then re-evaluate
    await client.query('DELETE FROM queue_entries WHERE player_id = $1', [playerId]);

    const waiting = await client.query(
      `SELECT q.player_id, q.joined_at, p.interests
       FROM queue_entries q
       JOIN players p ON p.id = q.player_id
       WHERE q.player_id <> $1
       ORDER BY q.joined_at ASC`,
      [playerId]
    );

    const currentInterests = playerRes.rows[0].interests;
    let best = null;
    let bestOverlap = 0;

    for (const candidate of waiting.rows) {
      const overlap = calculateInterestOverlap(currentInterests, candidate.interests);
      if (overlap < 1) continue;
      if (
        overlap > bestOverlap ||
        (overlap === bestOverlap &&
          best &&
          new Date(candidate.joined_at) < new Date(best.joined_at))
      ) {
        bestOverlap = overlap;
        best = candidate;
      } else if (!best && overlap >= 1) {
        bestOverlap = overlap;
        best = candidate;
      }
    }

    // Prefer highest overlap; earliest joined_at already ordered, refine:
    if (waiting.rows.length > 0) {
      const eligible = waiting.rows
        .map((c) => ({
          ...c,
          overlap: calculateInterestOverlap(currentInterests, c.interests),
        }))
        .filter((c) => c.overlap >= 1)
        .sort((a, b) => {
          if (b.overlap !== a.overlap) return b.overlap - a.overlap;
          return new Date(a.joined_at) - new Date(b.joined_at);
        });
      best = eligible[0] || null;
    }

    if (!best) {
      await client.query(
        'INSERT INTO queue_entries (player_id) VALUES ($1) ON CONFLICT (player_id) DO NOTHING',
        [playerId]
      );
      await client.query('COMMIT');
      return { status: 'WAITING' };
    }

    const matchId = await createMatchWithClient(client, best.player_id, playerId);
    await client.query('DELETE FROM queue_entries WHERE player_id = ANY($1::uuid[])', [
      [best.player_id, playerId],
    ]);
    await client.query('COMMIT');
    return { status: 'MATCHED', matchId };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Create a match: player1 is the waiting player, player2 is the joiner.
 * @param {import('pg').PoolClient} client
 * @param {string} player1Id
 * @param {string} player2Id
 */
async function createMatchWithClient(client, player1Id, player2Id) {
  const competitionId = Math.floor(Math.random() * 100) + 1;
  const matchRes = await client.query(
    `INSERT INTO matches (
       player1_id, player2_id, competition_id, current_question, phase, status, flag_count
     ) VALUES ($1, $2, $3, 1, 'P1_ANSWER', 'ACTIVE', 0)
     RETURNING id`,
    [player1Id, player2Id, competitionId]
  );
  const matchId = matchRes.rows[0].id;
  await client.query(
    `INSERT INTO match_rounds (match_id, question_number) VALUES ($1, 1)`,
    [matchId]
  );
  return matchId;
}

/**
 * @param {string} playerId
 */
export async function leavePool(playerId) {
  await query('DELETE FROM queue_entries WHERE player_id = $1', [playerId]);
  return { status: 'LEFT' };
}

/**
 * @param {string} playerId
 */
export async function poolStatus(playerId) {
  const activeMatch = await query(
    `SELECT id FROM matches
     WHERE status = 'ACTIVE' AND (player1_id = $1 OR player2_id = $1)
     ORDER BY created_at DESC
     LIMIT 1`,
    [playerId]
  );
  if (activeMatch.rowCount > 0) {
    return { status: 'MATCHED', matchId: activeMatch.rows[0].id };
  }
  const waiting = await query(
    'SELECT 1 FROM queue_entries WHERE player_id = $1',
    [playerId]
  );
  if (waiting.rowCount > 0) {
    return { status: 'WAITING' };
  }
  return { status: 'IDLE' };
}
