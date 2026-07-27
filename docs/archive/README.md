# Archived specifications

This folder holds **historical** documents that are **not** the current build specification.

## Knowledge Base V1.0 (text answers)

| Path | Content |
|------|---------|
| [`knowledge-base-v1.0-text-answers/`](./knowledge-base-v1.0-text-answers/) | Full Minduel Lite KB **Version 1.0** |

V1.0 described the completed **text-answer** MVP, including rules that are **superseded** by V2.0, for example:

- live audio / LiveKit **out of scope** (V1 ADR-001)
- answers as **plain text** (1–500 characters)
- no browser-to-browser audio room

### Authoritative specification now

**Knowledge Base Version 2.0** is the only current authoritative build specification:

- Repository root: `MinduelLite Knowledge Base KB.txt` / `.docx`
- Canonical under docs: [`../MinduelLite-Knowledge-Base-KB.txt`](../MinduelLite-Knowledge-Base-KB.txt)

V2.0 requires **LiveKit live audio** for spoken intellectual interaction during matches. Do not implement from V1.0.

### Code snapshot (text-answer application)

Git branch: **`safety/text-answer-mvp`**  
Git tag: **`text-answer-mvp-complete`**

That branch freezes the known-working **text-answer** application and V1 documentation tree at the time the audio refactor began. Use it only for recovery or comparison—not as the product roadmap.
