import { AVATAR_IDS, VALID_INTEREST_IDS } from '../config/interests.js';

/**
 * Server-side validation for temporary player profile creation.
 * @returns {{ ok: true, displayName: string, avatarId: number, interestIds: number[] }
 *   | { ok: false, error: string }}
 */
export function validatePlayerInput(body) {
  let { displayName, avatarId, interestIds } = body || {};

  if (typeof displayName !== 'string') {
    return { ok: false, error: 'Display name is required' };
  }

  displayName = displayName.trim();
  if (displayName.length < 2 || displayName.length > 20) {
    return { ok: false, error: 'Display name must be 2–20 characters' };
  }

  const avatar = Number(avatarId);
  if (!Number.isInteger(avatar) || !AVATAR_IDS.includes(avatar)) {
    return { ok: false, error: 'Avatar must be an ID from 1 to 12' };
  }

  if (!Array.isArray(interestIds) || interestIds.length !== 3) {
    return { ok: false, error: 'Exactly three interests are required' };
  }

  const ids = interestIds.map(Number);
  if (ids.some((id) => !Number.isInteger(id) || !VALID_INTEREST_IDS.includes(id))) {
    return { ok: false, error: 'Invalid interest IDs' };
  }
  if (new Set(ids).size !== 3) {
    return { ok: false, error: 'Interests must be unique' };
  }

  return {
    ok: true,
    displayName,
    avatarId: avatar,
    interestIds: ids,
  };
}
