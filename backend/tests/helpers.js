import { query } from '../src/db.js';

/**
 * Isolate DB integration tests from leftover queue/match state.
 */
export async function resetMatchmakingState() {
  await query('DELETE FROM queue_entries');
  // End any active matches so pool joins start clean
  await query(
    `UPDATE matches
     SET status = 'ENDED',
         end_reason = COALESCE(end_reason, 'COMPLETED'),
         ended_at = COALESCE(ended_at, NOW())
     WHERE status = 'ACTIVE'`
  );
}
