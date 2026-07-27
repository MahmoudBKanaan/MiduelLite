# Implementation excerpts for the oral report (item 202)

Six short excerpts only. Source paths are relative to the repository root.  
Recommend **one excerpt per slide** (or two half-slides). Do not paste entire files.

---

## 1. Profile validation

**File:** `backend/src/services/playerValidation.js`  
**Demonstrates:** server-side input validation (not frontend-only).

```javascript
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
  if (ids.some((id) => !VALID_INTEREST_IDS.includes(id))) {
    return { ok: false, error: 'Invalid interest IDs' };
  }
  if (new Set(ids).size !== 3) {
    return { ok: false, error: 'Interests must be unique' };
  }
  return { ok: true, displayName, avatarId: avatar, interestIds: ids };
}
```

**Say:** Backend rejects invalid profiles before any database write.

---

## 2. Matchmaking

**File:** `backend/src/services/matchmakingService.js`  
**Demonstrates:** interest overlap business logic.

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

// similarity = sharedInterestCount / 3
// Priority when selecting opponent:
export function selectBestCandidate(currentInterests, waitingPlayers) {
  return (waitingPlayers || [])
    .map((c) => ({
      ...c,
      overlap: calculateInterestOverlap(currentInterests, c.interests),
    }))
    .filter((c) => c.overlap >= 1) // 0 shared → never match
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap; // 3 > 2 > 1
      return new Date(a.joined_at) - new Date(b.joined_at);     // earliest wins
    })[0] || null;
}
```

**Say:** No ML — simple set intersection, fully testable and explainable.

---

## 3. Match state transition

**File:** `backend/src/services/matchService.js`  
**Demonstrates:** controlled phase progression after scoring.

```javascript
// After Player 1 answers:
//   phase P1_ANSWER → P2_SCORE_P1
// After Player 2 scores Player 1:
//   phase P2_SCORE_P1 → P2_ANSWER
// After Player 2 answers:
//   phase P2_ANSWER → P1_SCORE_P2
// After Player 1 scores Player 2:
//   phase P1_SCORE_P2 → REVIEW

// Core decision after both players finish REVIEW:
export function resolveAfterBothReviews(flagCount, currentQuestion) {
  if (flagCount >= 3) return { type: 'THREE_FLAGS' };
  if (currentQuestion >= 10) return { type: 'COMPLETED' };
  return { type: 'NEXT', nextQuestion: currentQuestion + 1 };
}
```

**Say:** Frontend only displays `phase` from the API; the server owns the state machine.

---

## 4. Flag / termination logic

**File:** `backend/src/services/matchService.js` — `advanceMatch`  
**Demonstrates:** business rule for ending or continuing the match.

```javascript
export async function advanceMatch(client, matchId, flagCount, currentQuestion) {
  const decision = resolveAfterBothReviews(flagCount, currentQuestion);

  if (decision.type === 'THREE_FLAGS') {
    await client.query(
      `UPDATE matches
       SET status = 'ENDED', end_reason = 'THREE_FLAGS', ended_at = NOW()
       WHERE id = $1`,
      [matchId]
    );
    return decision;
  }
  if (decision.type === 'COMPLETED') {
    await client.query(
      `UPDATE matches
       SET status = 'ENDED', end_reason = 'COMPLETED', ended_at = NOW()
       WHERE id = $1`,
      [matchId]
    );
    return decision;
  }
  // Next question
  await client.query(
    `UPDATE matches SET current_question = $1, phase = 'P1_ANSWER' WHERE id = $2`,
    [decision.nextQuestion, matchId]
  );
  await client.query(
    `INSERT INTO match_rounds (match_id, question_number) VALUES ($1, $2)`,
    [matchId, decision.nextQuestion]
  );
  return decision;
}
```

**Say:** Flagged scores are stored on the round; final averages exclude them in `calculateResult`.

---

## 5. React polling

**File:** `frontend/src/pages/MatchPage.jsx`  
**Demonstrates:** frontend/backend interaction without WebSockets.

```javascript
useEffect(() => {
  if (!requireSessionOrRedirect(navigate)) return undefined;

  let cancelled = false;
  refresh().catch((e) => {
    if (!cancelled) setError(formatUserError(e, 'Could not load match'));
  });

  // Poll GET /api/matches/:matchId approximately once per second
  pollRef.current = setInterval(() => {
    refresh().catch(() => {});
  }, 1000);

  return () => {
    cancelled = true;
    stopPolling(); // clearInterval on unmount / ENDED
  };
}, [matchId, navigate]);
```

**Say:** Simple, debuggable, enough for a two-player local demo (ADR: polling over WebSockets).

---

## 6. Parameterized SQL

**File:** `backend/src/routes/players.js` (and the same pattern everywhere)  
**Demonstrates:** SQL injection prevention + database integration.

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

**Session ownership lookup** (`backend/src/middleware/session.js`):

```javascript
const result = await query(
  `SELECT id, session_token, display_name, avatar_id, interests
   FROM players WHERE id = $1`,
  [playerId]
);
// then compare session_token to X-Session-Token header
```

**Say:** Values are never concatenated into SQL strings; `pg` placeholders bind parameters safely.

---

## Suggested slide order for excerpts

| Slide | Excerpt | Message |
|-------|---------|---------|
| Impl 1 | Profile validation | Trust the server |
| Impl 2 | Matchmaking | Simple domain logic |
| Impl 3 | State transition | Authoritative backend |
| Impl 4 | Flags | Clear termination rule |
| Impl 5 | Polling | Pragmatic multiplayer sync |
| Impl 6 | Parameterized SQL | Basic security + persistence |
