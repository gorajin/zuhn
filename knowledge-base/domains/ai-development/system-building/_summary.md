# Topic: system-building

> 6 insights

- `INS-260320-10CC` [high] 91 unit tests all passed, but an automated spec audit found 12 issues — unit tests verify code works, spec audits verify code matches intent.
- `INS-260320-47FA` [high] MASTER_INDEX to domain overview to topic summary to individual insight — answering "what do I know about X?" requires reading roughly 4 files regardless of total insight count.
- `INS-260320-0F7C` [high] Markdown files are the source of truth; SQLite database, indices, mindmap, and tag files are all generated and disposable — when the DB had schema issues, we just regenerated it.
- `INS-260320-4B31` [high] We spent hours designing a detailed spec before writing any code — the spec caught issues before they became bugs and zero scope creep occurred across 5 phases.
- `INS-260320-8FFC` [high] Sequential IDs stored in a file would be hallucinated by the LLM — timestamp plus title hash made file creation completely stateless with zero collisions across 74 insights.
- `INS-260320-63D3` [high] Each implementation task was dispatched to a fresh subagent with exactly the context it needed — no accumulated confusion from previous tasks.
