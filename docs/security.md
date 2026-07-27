# Security controls (MVP demonstration level)

Minimum security approach for Minduel Lite **as built** (Knowledge Base V2.0 live-audio MVP).  
No additional production security systems (WAF, SIEM, CAPTCHA, etc.).

## SEC checklist

| Item | Control | Status |
|------|---------|--------|
| 125 | All SQL uses parameterized `$1…$n` via `pg` | Verified |
| 126 | Backend validation: name, avatar, interests, answer-complete, score, session, match participant, phase | Verified |
| 127 | Helmet enabled | `app.use(helmet())` |
| 128 | CORS only `FRONTEND_ORIGIN` | Verified |
| 129 | `express.json({ limit: '10kb' })` | Verified |
| 130 | DB credentials via env (`DATABASE_URL`, `POSTGRES_*`) | Verified |
| 131 | `.env` in `.gitignore`, not tracked | Verified |
| 132 | No account JWT login, OAuth, CAPTCHA, WAF, SIEM | By design |
| LiveKit | API secret **backend-only**; tokens restricted by membership | Verified |

## Parameterized SQL

All application queries in `backend/src` pass values as the second argument to `query()` / `client.query()`. User input is never concatenated into SQL strings.

## Backend validation map

| Input | Where |
|-------|--------|
| Display name 2–20, trimmed | `playerValidation.js` → `POST /api/players` |
| Avatar 1–12 | `playerValidation.js` |
| Exactly 3 unique interests 1–32 | `playerValidation.js` |
| Spoken answer complete (no text body) | `completeAnswer` → `POST /api/matches/:id/answer-complete` |
| Score integer 1–10 | `validateScoreValue` → `submitScore` |
| Session ownership | `requireSession` (`X-Player-Id` + `X-Session-Token`) |
| Match participation | `roleOf` / 403 if not player1/player2 |
| Current phase | answer-complete / score / review handlers reject wrong phase |

## LiveKit and spoken audio

| Control | Implementation |
|---------|----------------|
| **Backend-only LiveKit secret** | `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are read only in the backend (`audioTokenService.js`). They are never sent to the frontend, never embedded in Vite env, and never returned in JSON. |
| **Token membership validation** | `POST /api/matches/:matchId/audio-token` requires a valid temporary session, an existing match, requesting player as participant, and `status = ACTIVE`. Outsiders get **403**; ended matches get **409**. |
| **Signed token scope** | JWT grants join only for room `match-{matchId}`, identity `playerId`, microphone publish + subscribe — not admin/record APIs. |
| **Transient audio** | Microphone media flows browser ↔ LiveKit only for the live session. The application does not write audio blobs to disk or PostgreSQL. |
| **No recording** | No recording pipeline, no egress to object storage, no `roomRecord` grant for participants. |
| **No transcription** | No speech-to-text service, no transcript tables, no text derived from voice. |

Response shape for a successful audio token (only):

```json
{ "token": "...", "serverUrl": "..." }
```

## Explicitly not implemented

Password hashing, MFA, OAuth, access/refresh account tokens, rate limiting platforms, CAPTCHA, WAF, encryption-at-rest management, secret rotation, penetration tooling, voice moderation, production abuse detection.
