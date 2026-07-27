# Oral presentation plan — approximately 15 minutes

**Course:** DLBSEPPSD01_E · Oral Project Report  
**Hard limit:** recording stops at **20 minutes** — aim to finish by **~14:30–15:00**.  
**Deck:** `MinduelLite-Oral-Project-Report.pptx` / PDF  
**GitHub (title):** https://github.com/MahmoudBKanaan/MiduelLite  

Focus: **task → planning → architecture → result → testing → reflection**  
Do **not** narrate every UI control; use screens as evidence only.

---

## Timing overview

| Min | Slides | Block | Target |
|-----|--------|--------|--------|
| 0:00–0:45 | 1–2 | Title + outline | 0:45 |
| 0:45–3:00 | 3–5 | Task definition | 2:15 |
| 3:00–5:00 | 6–7 | Planning & process | 2:00 |
| 5:00–8:30 | 8–11 | Architecture & implementation | 3:30 |
| 8:30–11:00 | 12–13 | Testing, Docker, operational result | 2:30 |
| 11:00–13:30 | 14–15 | Evaluation & reflection | 2:30 |
| 13:30–14:30 | 16–18 | Conclusion, figures, bibliography | 1:00 |
| **14:30–15:00** | — | **Buffer / stop** | 0:30 |

If running long: skip deep dive on figures/bibliography (leave on slide for PDF); cut UI screenshot talk first.

---

## Minute-by-minute script cues

### 0:00–0:45 — Title & outline (slides 1–2)

- State name, course, **Task 2 web application**.
- Point to **GitHub link** on title slide.
- Outline: process and architecture first, not a product demo tour.

### 0:45–3:00 — Task definition (slides 3–5)

- **Problem:** friction of registration before short intellectual play.
- **Objective:** smallest reliable full-stack SPA for the exam — not a social network.
- **User/benefit:** anonymous, immediate participation (name, avatar, 3 interests).
- **Scope:** four screens + Compose; explicit exclusions (auth, audio, cloud).

### 3:00–5:00 — Planning & process (slides 6–7)

- Process model: **iterative-incremental + Kanban**; why not Scrum (solo, fixed MVP).
- Figure 1: board evidence.
- User journey as **planned flow** (Welcome→Pool→Match→Result); screenshots = artefacts, not a walkthrough.

### 5:00–8:30 — Architecture & implementation (slides 8–11)

- **C4:** User → React SPA → Express → PostgreSQL; backend authoritative.
- **ER:** five tables; 1000 questions seeded.
- **Matchmaking:** `similarity = shared / 3`; priority 3→2→1; zero = no match.
- **State machine:** phases; three flags or Q10 ends match; mention one code idea (e.g. `resolveAfterBothReviews`) without reading long listings.

### 8:30–11:00 — Testing, Docker, result (slides 12–13)

- Tests: focused Vitest suites (FE + BE); point to pass evidence.
- Docker: `docker compose up --build`; three services; no manual DB setup.
- **Operational result:** two browsers, matching, scoring/flags/results verified — system works end-to-end.

### 11:00–13:30 — Evaluation & reflection (slides 14–15)

- **Goal achieved?** Yes for academic MVP.
- Evidence checklist (users, match, Q10, scores, flags, result, integrate, Docker, tests).
- **Limitations intentional** (scope protection).
- Lessons + future improvements **discussed only**.

### 13:30–14:30 — Close (slides 16–18)

- Conclusion in 3–4 bullets.
- GitHub once more.
- Figures list + bibliography: “sources cited per IU/APA; diagrams own work.”
- Thank you / end.

---

## Demo policy (within 15 minutes)

| Do | Don’t |
|----|--------|
| Optional **30–45 s** live: two windows already open, show match | Play all 10 questions live |
| Prefer pre-captured screenshots / scripts | Debug live failures on camera |
| Say “full Q10 and three-flag paths verified offline” | Expand scope mid-talk |

If live demo fails: switch immediately to screenshots 192–195 and 198.

---

## Pre-recording checklist

- [ ] Student name + matriculation on title slide  
- [ ] Docker stack started **before** recording (if demo)  
- [ ] Incognito + normal Chrome bookmarks to `http://localhost:5173`  
- [ ] PDF version of slides ready (item 218)  
- [ ] GitHub URL visible on title  
- [ ] Timer visible; stop by 15:00  
- [ ] Quiet environment; screen resolution readable  

---

## Backup if over time

**Cut first:** slide 7 screenshot captions, slide 17–18 detail (keep one sentence: “figures and bibliography are in the PDF”).  
**Never cut:** goal answer, architecture one-liner, Docker/tests, limitations intentional.
