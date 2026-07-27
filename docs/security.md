# Security controls (MVP demonstration level)

Minimum security approach for Minduel Lite **as built**.  
Items 125–132 / oral-report section 175. No additional production security systems.

## SEC checklist

| Item | Control | Status |
|------|---------|--------|
| 125 | All SQL uses parameterized `$1…$n` via `pg` | Verified |
| 126 | Backend validation: name, avatar, interests, answer, score, session, match participant, phase | Verified |
| 127 | Helmet enabled | `app.use(helmet())` |
| 128 | CORS only `FRONTEND_ORIGIN` | Verified |
| 129 | `express.json({ limit: '10kb' })` | Verified |
| 130 | DB credentials via env (`DATABASE_URL`, `POSTGRES_*`) | Verified |
| 131 | `.env` in `.gitignore`, not tracked | Verified |
| 132 | No JWT, OAuth, CAPTCHA, WAF, SIEM, etc. | By design |

## Parameterized SQL

All application queries in `backend/src` pass values as the second argument to `query()` / `client.query()`. User input is never concatenated into SQL strings.

## Backend validation map

| Input | Where |
|-------|--------|
| Display name 2–20, trimmed | `playerValidation.js` → `POST /api/players` |
| Avatar 1–12 | `playerValidation.js` |
| Exactly 3 unique interests 1–32 | `playerValidation.js` |
| Answer 1–500 | `validateAnswerText` → `submitAnswer` |
| Score integer 1–10 | `validateScoreValue` → `submitScore` |
| Session ownership | `requireSession` (`X-Player-Id` + `X-Session-Token`) |
| Match participation | `roleOf` / 403 if not player1/player2 |
| Current phase | answer/score/review handlers reject wrong phase |

## Explicitly not implemented

Password hashing, MFA, OAuth, access/refresh tokens, rate limiting platforms, CAPTCHA, WAF, encryption-at-rest management, secret rotation, penetration tooling.
