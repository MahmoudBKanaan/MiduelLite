# Implementation excerpts for the oral report

Readable **source excerpts** (not function names alone). Paths relative to repository root.

---

## 1. LiveKit token generation

**File:** `backend/src/services/audioTokenService.js`  
**Demonstrates:** server-side JWT; secret never leaves backend; mic-only grant.

```javascript
export async function createAudioAccessToken({ matchId, playerId, displayName }) {
  const { apiKey, apiSecret, serverUrl } = getLiveKitConfig();
  const roomName = roomNameForMatch(matchId); // "match-{matchId}"
  const identity = String(playerId);

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name: displayName ? String(displayName) : identity,
    ttl: '2h',
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishSources: [TrackSource.MICROPHONE],
    canPublishData: false,
  });

  const token = await at.toJwt();
  return { token, serverUrl, roomName, identity };
}
```

**Say:** Membership is checked before this runs (`issueMatchAudioToken`). API secret is env-only.

---

## 2. MatchAudio connection lifecycle

**File:** `frontend/src/components/MatchAudio.jsx`  
**Demonstrates:** one Room per match; connect; mic; cleanup on unmount (not on phase change).

```javascript
const connect = async () => {
  setAudioState('CONNECTING');
  const { token, serverUrl } = await getAudioToken(matchId);
  if (cancelled) return;

  room = new Room({ adaptiveStream: true, dynacast: true });
  roomRef.current = room;

  room.on(RoomEvent.TrackSubscribed, (track) => {
    if (track.kind === Track.Kind.Audio) attachRemoteAudio(track);
  });

  await room.connect(serverUrl, token);
  if (cancelled) { await cleanupRoom(room); return; }

  await room.localParticipant.setMicrophoneEnabled(true);
  if (!cancelled) setAudioState('CONNECTED');
};

// Cleanup only when matchId changes / unmount / retry — not when phase changes
return () => {
  cancelled = true;
  onConnectedRef.current?.(false);
  cleanupRoom(roomRef.current || room); // mic off, disconnect, remove listeners
};
// useEffect deps: [matchId, retryNonce, ...]
```

**Say:** Game phases poll REST; audio room stays up for the whole match.

---

## 3. Matchmaking (business logic)

**File:** `backend/src/services/matchmakingService.js`

```javascript
export function calculateInterestOverlap(playerA, playerB) {
  const setB = new Set((playerB || []).map(Number));
  let count = 0;
  for (const id of playerA || []) {
    if (setB.has(Number(id))) count += 1;
  }
  if (count > 3) return 3;
  return count; // 0 | 1 | 2 | 3
}

export function selectBestCandidate(currentInterests, waitingPlayers) {
  return (waitingPlayers || [])
    .map((c) => ({
      ...c,
      overlap: calculateInterestOverlap(currentInterests, c.interests),
    }))
    .filter((c) => c.overlap >= 1) // zero shared → never match
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return new Date(a.joined_at) - new Date(b.joined_at);
    })[0] || null;
}
```

---

## 4. Third-flag termination (business logic)

**File:** `backend/src/services/matchService.js` — inside `submitReview`

```javascript
// FLAG → increment only the reviewing player's personal count
if (flag) {
  if (role === 'PLAYER_1') {
    await client.query(
      `UPDATE matches
       SET player1_flag_count = player1_flag_count + 1
       WHERE id = $1`,
      [matchId]
    );
  } else {
    await client.query(
      `UPDATE matches
       SET player2_flag_count = player2_flag_count + 1
       WHERE id = $1`,
      [matchId]
    );
  }
}

const m = (await client.query(
  'SELECT * FROM matches WHERE id = $1',
  [matchId]
)).rows[0];

// Do not wait for the other player's review
if (m.player1_flag_count >= 3 || m.player2_flag_count >= 3) {
  await client.query(
    `UPDATE matches
     SET status = 'ENDED', end_reason = 'THREE_FLAGS', ended_at = NOW()
     WHERE id = $1`,
    [matchId]
  );
  await client.query('COMMIT');
  return getMatchState(matchId, playerId);
}
```

---

## 5. Parameterized SQL

**File:** `backend/src/routes/players.js`

```javascript
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
```

**Say:** Values bound via `$n` — never string-concatenated into SQL.

---

## Suggested oral use

| Excerpt | Message |
|---------|---------|
| LiveKit token | Server owns secrets; scoped room + identity |
| MatchAudio lifecycle | One room; connect/mic/cleanup |
| Matchmaking | Simple domain logic, no ML |
| Third flag | Immediate end when either one player's own count reaches 3; counts never combine |
| Parameterized SQL | Baseline security + persistence |
