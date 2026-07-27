import { query, getClient } from '../db.js';

/**
 * Count shared interest IDs between two players' interest lists.
 * Used by matchmaking to rank compatibility (higher is better).
 *
 * @param {number[]|string[]} playerA - interest IDs of player A
 * @param {number[]|string[]} playerB - interest IDs of player B
 * @returns {0|1|2|3} number of identical interest IDs (MVP profiles always pick 3)
 */
export function calculateInterestOverlap(playerA, playerB) {
  const setB = new Set((playerB || []).map(Number));
  let count = 0;
  for (const id of playerA || []) {
    if (setB.has(Number(id))) count += 1;
  }
  if (count > 3) return 3;
  return /** @type {0|1|2|3} */ (count);
}

/**
 * Pick the best waiting candidate for the current player.
 * Priority: 3 shared → 2 shared → 1 shared; 0 = ineligible.
 * Equal overlap → earliest joined_at wins.
 *
 * @param {number[]} currentInterests
 * @param {{ player_id: string, joined_at: Date|string, interests: number[] }[]} waitingPlayers
 * @returns {{ player_id: string, joined_at: Date|string, interests: number[], overlap: number } | null}
 */
export function selectBestCandidate(currentInterests, waitingPlayers) {
  const eligible = (waitingPlayers || [])
    .map((c) => ({
      ...c,
      overlap: calculateInterestOverlap(currentInterests, c.interests),
    }))
    .filter((c) => c.overlap >= 1)
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    });
  return eligible[0] || null;
}

/**
 * Attempt to match a player with the best compatible waiting opponent.
 * Waiting player becomes Player 1; joiner becomes Player 2.
 *
 * @param {string} playerId
 * @returns {Promise<{ status: 'WAITING' } | { status: 'MATCHED', matchId: string }>}
 */
export async function joinPool(playerId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const playerRes = await client.query(
      'SELECT id, interests FROM players WHERE id = $1 FOR UPDATE',
      [playerId]
    );
    if (playerRes.rowCount === 0) {
      const err = new Error('Player not found');
      err.status = 404;
      throw err;
    }

    // Already in an active match → return that match
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

    // Prevent duplicate queue entry: remove any existing row for this player first
    await client.query('DELETE FROM queue_entries WHERE player_id = $1', [
      playerId,
    ]);

    // Lock waiting queue rows for consistent matchmaking
    const waiting = await client.query(
      `SELECT q.player_id, q.joined_at, p.interests
       FROM queue_entries q
       JOIN players p ON p.id = q.player_id
       WHERE q.player_id <> $1
       ORDER BY q.joined_at ASC
       FOR UPDATE OF q`,
      [playerId]
    );

    const best = selectBestCandidate(
      playerRes.rows[0].interests,
      waiting.rows
    );

    if (!best) {
      // No compatible opponent (zero overlap or empty queue) → enqueue
      await client.query(
        `INSERT INTO queue_entries (player_id, joined_at)
         VALUES ($1, NOW())
         ON CONFLICT (player_id) DO NOTHING`,
        [playerId]
      );
      await client.query('COMMIT');
      return { status: 'WAITING' };
    }

    // Waiting player = Player 1; joiner = Player 2
    const matchId = await createMatch(client, best.player_id, playerId);

    // Remove both players from queue
    await client.query(
      'DELETE FROM queue_entries WHERE player_id = ANY($1::uuid[])',
      [[best.player_id, playerId]]
    );

    await client.query('COMMIT');
    return { status: 'MATCHED', matchId };
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Persist a new ACTIVE match and its first round row.
 *
 * @param {import('pg').PoolClient} client - open transaction client
 * @param {string} player1Id - player already waiting in the queue
 * @param {string} player2Id - player who just joined and completed the pair
 * @returns {Promise<string>} new match UUID
 */
async function createMatch(client, player1Id, player2Id) {
  const competitionId = Math.floor(Math.random() * 100) + 1;
  const matchRes = await client.query(
    `INSERT INTO matches (
       player1_id,
       player2_id,
       competition_id,
       current_question,
       phase,
       status,
       flag_count
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
 * Remove current player from the waiting queue.
 * @param {string} playerId
 */
export async function leavePool(playerId) {
  await query('DELETE FROM queue_entries WHERE player_id = $1', [playerId]);
  return { status: 'LEFT' };
}

/**
 * Pool status for the current session player.
 * @param {string} playerId
 * @returns {Promise<{ status: 'MATCHED', matchId: string } | { status: 'WAITING' } | { status: 'IDLE' }>}
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
