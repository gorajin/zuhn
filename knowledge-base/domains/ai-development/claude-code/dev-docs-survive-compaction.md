---
id: INS-260320-06EF
domain: ai-development
topic: claude-code
title: "Dev docs survive auto-compaction so you can continue in new sessions"
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags: [dev-docs, compaction, session-continuity, persistence]
sources:
  - type: reddit
    title: "Claude Code is a Beast – Tips from 6 Months of Hardcore Use"
    author: u/diet103
    url: "https://reddit.com/r/ClaudeCode"
related: [INS-260320-04A2, INS-260320-0127]
date_extracted: "2026-03-20"
last_accessed: null
access_count: 0
indexed: true
embedded: false
resolutions:
  one_line: "Dev docs persist on disk and survive auto-compaction — just say 'continue' in a new session to pick up where you left off."
  standard: |
    Because dev docs (plan.md, context.md, tasks.md) are written to disk,
    they survive both auto-compaction and session boundaries. When starting
    a new session or after compaction occurs, simply say "continue" and
    Claude will read the dev docs to re-orient itself. This is the key
    advantage of externalizing state to files rather than relying on
    conversation context. The dev docs act as a persistent checkpoint
    that allows seamless continuation of complex multi-session tasks.
---

Because dev docs (plan.md, context.md, tasks.md) are written to disk,
they survive both auto-compaction and session boundaries. When starting
a new session or after compaction occurs, simply say "continue" and
Claude will read the dev docs to re-orient itself. This is the key
advantage of externalizing state to files rather than relying on
conversation context. The dev docs act as a persistent checkpoint
that allows seamless continuation of complex multi-session tasks.
