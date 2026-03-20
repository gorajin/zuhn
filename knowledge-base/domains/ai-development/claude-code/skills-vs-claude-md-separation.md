---
id: INS-260320-F872
domain: ai-development
topic: claude-code
title: "Separate concerns: Skills for code guidelines, CLAUDE.md for project-specific context"
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags: [skills, CLAUDE.md, separation-of-concerns, project-context]
sources:
  - type: reddit
    title: "Claude Code is a Beast – Tips from 6 Months of Hardcore Use"
    author: u/diet103
    url: "https://reddit.com/r/ClaudeCode"
related: [INS-260320-B210]
date_extracted: "2026-03-20"
last_accessed: null
access_count: 0
indexed: true
embedded: false
resolutions:
  one_line: "Skills handle 'how to write code' guidelines while CLAUDE.md handles 'how this specific project works' — keep them separate."
  standard: |
    Maintain a clear separation of concerns between Skills and CLAUDE.md.
    Skills should contain general coding guidelines — how to write code,
    patterns to follow, error handling approaches, testing conventions.
    CLAUDE.md should contain project-specific context — architecture decisions,
    service relationships, deployment details, environment setup. This
    separation means skills are reusable across projects while CLAUDE.md
    remains project-specific. It also prevents bloat in either file and
    makes it clear where to add new information.
---

Maintain a clear separation of concerns between Skills and CLAUDE.md.
Skills should contain general coding guidelines — how to write code,
patterns to follow, error handling approaches, testing conventions.
CLAUDE.md should contain project-specific context — architecture decisions,
service relationships, deployment details, environment setup. This
separation means skills are reusable across projects while CLAUDE.md
remains project-specific. It also prevents bloat in either file and
makes it clear where to add new information.
