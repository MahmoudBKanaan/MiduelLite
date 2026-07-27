# Tutor Concept Submission Package

## IU requirement (Task 2 — Web Application)

From the examination task:

> For all tasks, the first step is to identify and describe the **problem** addressed, as well as the **users** of the software solution and the **benefits** that result from using the application.  
> **This concept must be submitted to the tutor for approval.** Afterwards, the implementation of the task can begin.

This file is the **submission package** you can send to the tutor.  
**You** must submit it via the official IU channel (myCampus / tutor message / as instructed for DLBSEPPSD01_E). This repository cannot submit on your behalf.

---

## Checklist before you send

- [ ] Attach or paste the concept content below (or export to PDF/DOCX if preferred)  
- [ ] Optionally attach wireframes (`docs/wireframes.md`) and architecture sketch (`docs/architecture.md`)  
- [ ] Note course: **DLBSEPPSD01_E — Software Development**  
- [ ] Note examination form: **Oral Project Report — Task 2: Development of a web application**  
- [ ] After approval: record date and tutor feedback in the section at the bottom  

---

## Suggested message to tutor

**Subject:** DLBSEPPSD01_E — Concept approval request (Minduel Lite web application)

Dear Tutor,

Please find below my project concept for the oral project report (Task 2: Development of a web application).

**Working title:** Minduel Lite — An Interest-Based Two-Player Intellectual Competition Web Application  

I would be grateful for your approval of this concept so that I may proceed with implementation.

Kind regards,  
[Your full name]  
[Matriculation number]  
[Course: DLBSEPPSD01_E]

---

## Concept for approval (copy-ready)

### 1. Project title

Minduel Lite: An Interest-Based Two-Player Intellectual Competition Web Application

### 2. Problem

Users who want a short intellectual interaction with another person often face multiplayer platforms that require registration, authentication, permanent profiles, and social features before they can participate. This creates unnecessary friction for a lightweight, anonymous exchange.

### 3. Target users

People who want a brief, anonymous, two-player intellectual competition without creating a permanent account or providing personally identifiable information.

### 4. User benefit

Immediate participation: choose a temporary display name, a predefined avatar, and three interests; join a matchmaking pool; compete in a ten-question peer-scored duel—without email, password, friends list, or complex settings.

### 5. Solution overview (MVP)

A **mobile-first single-page web application** with four screens:

1. **Welcome** — temporary profile (name, avatar, exactly 3 of 32 interests)  
2. **Pool** — matchmaking by shared interests  
3. **Match** — ten questions; players answer and score each other; optional flagging of received scores  
4. **Result** — average scores (excluding flagged), winner/draw; play again or reset profile  

Matchmaking prefers 3 shared interests, then 2, then 1; players with zero overlap are not matched. Three combined flagged scores end the match early.

### 6. Why a web application (not a native mobile app)

The examination option selected is **Task 2: Development of a web application**. The product is a **browser-based SPA** (mobile-first layout), not an Android APK. Two users can demonstrate multiplayer interaction using two browser sessions on one computer against a shared backend.

### 7. Technology (planned / used)

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), JavaScript, React Router, plain CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Communication | REST/JSON, short polling (~1 s) |
| Infrastructure | Docker + Docker Compose |
| Tests | Vitest, React Testing Library, Supertest |

### 8. Architecture (summary)

```
User → React SPA → Node.js/Express API → PostgreSQL
```

The backend is authoritative for matchmaking and match state.

### 9. Process model

**Iterative-incremental development managed with Kanban**  
Justification: solo project, small fixed MVP, short development period, minimal administrative overhead.

### 10. Scope boundaries (explicit exclusions)

No permanent accounts/login, no chat, no rankings, no live audio/WebRTC, no cloud deployment, no production-scale infrastructure. Focus remains a demonstrable full-stack academic MVP.

### 11. Deliverables for the oral report

- Operational SPA + backend + database via Docker Compose  
- Automated tests for core functionality  
- Documentation (concept, wireframes, architecture, code documentation)  
- GitHub repository (link on presentation title slide)  
- Critical evaluation and lessons learned  

---

## Supporting documents in this repository

| File | Purpose |
|------|---------|
| `docs/concept.md` | Full written concept |
| `docs/wireframes.md` | Four UI wireframes |
| `docs/architecture.md` | C4 container diagram |
| `docs/er-diagram.md` | Database ER model |
| `docs/process-model.md` | Process selection & justification |
| `docs/MinduelLite-Knowledge-Base-KB.txt` | Full authoritative specification |

---

## Approval log (fill in after tutor reply)

| Field | Value |
|-------|--------|
| Submitted on | _YYYY-MM-DD_ |
| Submitted via | _e.g. myCampus / email_ |
| Tutor | _Name_ |
| Decision | _Approved / Changes requested / Pending_ |
| Feedback summary | _…_ |
| Implementation may proceed from | _YYYY-MM-DD_ |

**Important:** Per IU task text, begin (or treat as begun) the formal implementation phase only after concept approval, unless your tutor instructs otherwise.
