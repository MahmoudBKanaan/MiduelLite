import { AccessToken } from 'livekit-server-sdk';
import { TrackSource } from '@livekit/protocol';
import { query } from '../db.js';

/**
 * LiveKit participant tokens (KB V2.0).
 * Tokens and room names are never written to PostgreSQL.
 * API secrets are never returned to clients.
 */

/**
 * Canonical LiveKit room name for a match.
 * @param {string} matchId
 * @returns {string} e.g. "match-<uuid>"
 */
export function roomNameForMatch(matchId) {
  if (!matchId || typeof matchId !== 'string') {
    throw Object.assign(new Error('matchId is required'), { status: 400 });
  }
  return `match-${matchId}`;
}

/**
 * Read LiveKit credentials from environment.
 * @returns {{ apiKey: string, apiSecret: string, serverUrl: string }}
 */
export function getLiveKitConfig() {
  const apiKey = process.env.LIVEKIT_API_KEY || '';
  const apiSecret = process.env.LIVEKIT_API_SECRET || '';
  const serverUrl = process.env.LIVEKIT_URL || '';

  if (!apiKey || !apiSecret || !serverUrl) {
    // Readable server error — no secret values or stack traces for the client
    const err = new Error(
      'LiveKit audio is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET on the server.'
    );
    err.status = 503;
    throw err;
  }

  return { apiKey, apiSecret, serverUrl };
}

/**
 * Generate a LiveKit access JWT for one match participant.
 *
 * Room: match-{matchId}
 * Identity: playerId
 * Permissions: join that room, publish microphone, subscribe to remote audio.
 *
 * @param {{ matchId: string, playerId: string, displayName?: string }} opts
 * @returns {Promise<{ token: string, serverUrl: string, roomName: string, identity: string }>}
 */
export async function createAudioAccessToken({ matchId, playerId, displayName }) {
  if (!playerId || typeof playerId !== 'string') {
    const err = new Error('playerId is required');
    err.status = 400;
    throw err;
  }

  const { apiKey, apiSecret, serverUrl } = getLiveKitConfig();
  const roomName = roomNameForMatch(matchId);
  const identity = String(playerId);

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    // Optional display name for LiveKit participant UI (not used as identity)
    name: displayName ? String(displayName) : identity,
    // Match sessions are short; 2h is ample for a 10-question duel
    ttl: '2h',
  });

  // Only join this room; publish mic; subscribe to others' audio.
  // No roomAdmin, roomCreate, roomRecord, or data-heavy privileges.
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    // Restrict publish sources to microphone only (no camera / screen share)
    canPublishSources: [TrackSource.MICROPHONE],
    canPublishData: false,
  });

  const token = await at.toJwt();

  // Full internal result (roomName/identity for logging/tests only)
  return {
    token,
    serverUrl,
    roomName,
    identity,
  };
}

/**
 * Authorize a match participant and issue a short-lived LiveKit JWT.
 * Does not store tokens or room metadata in the database.
 *
 * @param {string} matchId
 * @param {string} playerId - session-validated player id
 * @param {string} [displayName]
 * @returns {Promise<{ token: string, serverUrl: string }>}
 */
export async function issueMatchAudioToken(matchId, playerId, displayName) {
  const matchRes = await query(
    `SELECT id, player1_id, player2_id, status
     FROM matches
     WHERE id = $1`,
    [matchId]
  );

  if (matchRes.rowCount === 0) {
    const err = new Error('Match not found');
    err.status = 404;
    throw err;
  }

  const match = matchRes.rows[0];
  const pid = String(playerId);
  const isParticipant =
    String(match.player1_id) === pid || String(match.player2_id) === pid;

  if (!isParticipant) {
    const err = new Error('Not a participant in this match');
    err.status = 403;
    throw err;
  }

  if (match.status !== 'ACTIVE') {
    const err = new Error('Match is not active');
    err.status = 409;
    throw err;
  }

  const issued = await createAudioAccessToken({
    matchId: String(match.id),
    playerId: pid,
    displayName,
  });

  // Public API shape only — never return API key/secret
  return {
    token: issued.token,
    serverUrl: issued.serverUrl,
  };
}
