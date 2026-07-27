# Oral report — presentation package

## Main deck (item 203)

| File | Description |
|------|-------------|
| **[MinduelLite-Oral-Project-Report.pptx](./MinduelLite-Oral-Project-Report.pptx)** | Full oral report (~17 slides, ~15 min) |
| [build-presentation.mjs](./build-presentation.mjs) | Regenerates the PPTX |

**Rebuild:** from repo root, with `pptxgenjs` available:  
`node docs/presentation/build-presentation.mjs`

### Slide sequence

1. Title + GitHub link  
2. Outline  
3. Problem and objective  
4. Target user and benefit  
5. MVP requirements and scope  
6. Development process (+ Kanban image)  
7. Wireframes / user journey (screenshots)  
8. Architecture (C4)  
9. Database (ER)  
10. Matchmaking algorithm  
11. Match state machine / code  
12. Testing + Docker  
13. Operational result  
14. Goal achievement + limitations  
15. Reflection + future improvements  
16. Conclusion  
17. List of figures & bibliography  

**Before recording:** replace “Student name / matriculation number” on the title slide.

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
