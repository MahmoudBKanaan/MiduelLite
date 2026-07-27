# Oral report — presentation package

## Main deck (item 203)

| File | Description |
|------|-------------|
| **[MinduelLite-Oral-Project-Report.pptx](./MinduelLite-Oral-Project-Report.pptx)** | Full oral report (PowerPoint) |
| **[MinduelLite-Oral-Project-Report.pdf](./MinduelLite-Oral-Project-Report.pdf)** | Final PDF for IU submission (item 218) |
| [speaking-plan-15min.md](./speaking-plan-15min.md) | Timed ~15-minute speaking plan (item 212) |
| [critical-evaluation.md](./critical-evaluation.md) | Goal / evidence / limitations |
| [build-presentation.mjs](./build-presentation.mjs) | Regenerates the PPTX |

**Rebuild:** from repo root, with `pptxgenjs` available:  
`node docs/presentation/build-presentation.mjs`

### Slide sequence (process-focused)

1. **Title + GitHub link** (prominent)  
2. Outline — task / planning / architecture / result / testing / reflection  
3–5. Task definition (problem, users, scope)  
6. Planning & process (Kanban)  
7. User journey as planning artefact (not a UI tour)  
8–10. Architecture (C4, ER, matchmaking)  
11. Implementation (state machine)  
12–13. Testing, Docker, operational result  
14–15. Evaluation & reflection  
16. Conclusion + GitHub  
17. **List of figures** (own work labelled)  
18. **Bibliography** (APA-style external sources)  

**Academic pack:** [academic-citations.md](./academic-citations.md) — figures table, APA refs, speaking focus.  

**Before recording:** replace student name / matriculation number on the title slide.

## Supporting materials

| Item | File | Use on slide |
|------|------|----------------|
| 199 C4 | [c4.html](./c4.html), `docs/screenshots/199-c4.png` | Architecture |
| 200 ER | [er.html](./er.html), `docs/screenshots/200-er.png` | Database |
| 201 Flow / state | [state.html](./state.html), `docs/screenshots/201-state.png` | Process / match |
| 202 Excerpts | [code-excerpts.md](./code-excerpts.md) | Implementation detail |
| Diagrams text | [diagrams.md](./diagrams.md) | Backup copy-paste |

**GitHub (title slide):** https://github.com/MahmoudBKanaan/MiduelLite

All diagrams and screenshots are original project material (student’s own work) unless otherwise cited.
