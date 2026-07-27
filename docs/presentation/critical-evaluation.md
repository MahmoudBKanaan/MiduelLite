# Critical evaluation — goal, evidence, limitations

Items **208–210** for the oral project report.  
Use as a slide (summary) and as a spoken answer (~60–90 seconds for the goal question).

---

## 208. Was the project goal achieved?

### Short explicit answer (say this)

> **Yes.** The project goal was achieved for the academic objective that was defined.
>
> The goal was **not** to ship a production social platform. The goal was to deliver a **minimum viable full-stack web application** that satisfies IU Task 2: a React SPA with an Express backend and PostgreSQL, two-user interaction, automated tests, Docker Compose, documentation, and a critically evaluated result — including **project-specific live spoken interaction via managed LiveKit**.
>
> That operational system exists, runs locally with Docker Compose (plus LiveKit Cloud for audio), and was demonstrated with two browser sessions. Therefore the **defined goal is achieved**. Remaining gaps are **intentional limitations**, not incomplete requirements of the MVP.

### One-sentence version

> **Yes — for the stated academic MVP, not for production readiness.**

---

## 209. Evidence supporting that answer

| Claim | Evidence |
|-------|----------|
| **Two anonymous users work** | Chrome + Incognito; temporary `playerId` + `sessionToken`; dual-session scripts. |
| **Matching works** | Interest overlap 3→2→1; automated matchmaking tests + dual-session demo. |
| **Spoken turns work** | `answer-complete` phase machine; MatchAudio + LiveKit token endpoint; no answer text in DB. |
| **Scoring & flags work** | Scores 1–10; either player's third personal flag ends immediately (`THREE_FLAGS`); mixed counts never combine; tests + acceptance scripts. |
| **Result works** | Averages exclude flags; winner/DRAW; Result page + tests. |
| **FE + BE + DB + LiveKit integrate** | SPA polls Express; Express SQL to Postgres; SPA media to LiveKit with server-issued JWT. |
| **Docker works** | Three services: frontend, backend, database (`docker compose up --build`). |
| **Tests pass** | Backend Vitest/Supertest; frontend Vitest/RTL (LiveKit mocked in unit tests). |

### Spoken evidence block (~30 seconds)

> Two anonymous browsers create profiles and enter the pool; the backend matches them and both join one LiveKit room for spoken answers. Turns use answer-complete, peer scoring, and review. We demonstrated normal completion and per-player three-flag termination. Secrets stay on the server; speech is not stored. Compose runs the app stack; automated tests pass.

---

## 210. Limitations — why features were scoped

### Short section (say this)

> Production-grade and advanced real-time features were **intentionally excluded** or simplified.
>
> IU Task 2 needs a demonstrable full-stack SPA. **Managed LiveKit** is a **project-specific** choice — **not an IU mandate**. It was preferred over **raw WebRTC** because it reduced **signaling complexity**, **TURN/STUN responsibility**, **connection-management complexity**, and **development time**, while still delivering real two-browser microphone audio. Limitations such as temporary identity, polling for game state, dependence on LiveKit Cloud and the internet for audio, and no recording/transcription are **conscious scope decisions** that protected a reliable academic demo.

### Limitations list (slide-friendly)

| Limitation | Why intentional |
|------------|-----------------|
| No permanent accounts | Immediate play; no auth subsystem required by Task 2 |
| No production authentication | Session headers enough for demo ownership |
| Polling for game state (not WebSockets) | Simpler lifecycle; sufficient for two local users |
| **Dependence on managed LiveKit** | Project-specific; avoids self-hosting media servers and custom TURN |
| **Internet required for audio** | LiveKit Cloud is external; offline audio not in scope |
| **No advanced reconnection** | Demo-level real-time; full reconnect/state recovery would expand scope |
| **No voice moderation** | No public multi-tenant product |
| **No audio recording** | Privacy + simplicity; not required for Task 2 |
| **No transcription** | Keeps MVP free of speech-to-text pipeline and storage |
| **Academic/demo-level real-time architecture** | Not multi-region HA media design |
| Subjective peer scoring | Domain choice; no answer key / AI evaluation needed |
| No match history UI | Temporary sessions |
| No cloud deployment of the app stack | Local Compose satisfies reproducibility |
| No production scalability | Single backend instance fine for oral demo |

### Removed from limitations (obsolete)

Do **not** list **“no audio”** as a limitation of the current MVP. Live spoken audio **is** in scope via LiveKit.

### Distinction for the examiner

| Category | Status |
|----------|--------|
| MVP requirements (SPA, backend, DB, tests, Docker, docs, two-user flow, project live audio) | **Met** |
| Production media platform / commercial features | **Out of scope by design** |

---

## Optional slide text

### Slide: Goal achieved?

**Answer: Yes — for the defined academic MVP.**

- [x] Two anonymous users  
- [x] Matchmaking  
- [x] Spoken turns (LiveKit + answer-complete)  
- [x] Scoring & flags  
- [x] Results  
- [x] FE + BE + DB  
- [x] Docker Compose  
- [x] Automated tests  

### Slide: Intentional limitations

Dependence on managed LiveKit, internet for audio, demo-level reconnection, no recording/transcription/moderation — scoped for a reliable IU demonstration, not a production voice product.
