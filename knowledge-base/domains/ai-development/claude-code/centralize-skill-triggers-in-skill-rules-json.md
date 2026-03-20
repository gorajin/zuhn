---
id: INS-260320-8DBD
domain: ai-development
topic: claude-code
title: "Centralize skill triggers in skill-rules.json with keywords, intent patterns, and file triggers"
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags: [skills, configuration, skill-rules, triggers, regex]
sources:
  - type: reddit
    title: "Claude Code is a Beast – Tips from 6 Months of Hardcore Use"
    author: u/diet103
    url: "https://reddit.com/r/ClaudeCode"
related: [INS-260320-F8FD, INS-260320-DCA0]
date_extracted: "2026-03-20"
last_accessed: null
access_count: 0
indexed: true
embedded: false
resolutions:
  one_line: "Use a central skill-rules.json config mapping each skill to keywords, regex intent patterns, file path triggers, and content triggers."
  standard: |
    Instead of scattering skill activation logic across multiple files, create a
    single skill-rules.json that serves as the central configuration. Each skill
    entry maps to: keywords (simple string matches), intent patterns (regex for
    semantic matching), file path triggers (activate when certain files are
    touched), and content triggers (activate based on file content patterns).
    This centralized approach makes it easy to add, modify, or debug skill
    activation rules without touching hook code. The hook system reads this
    config at runtime to determine which skills to inject.
---

Instead of scattering skill activation logic across multiple files, create a
single skill-rules.json that serves as the central configuration. Each skill
entry maps to: keywords (simple string matches), intent patterns (regex for
semantic matching), file path triggers (activate when certain files are
touched), and content triggers (activate based on file content patterns).
This centralized approach makes it easy to add, modify, or debug skill
activation rules without touching hook code. The hook system reads this
config at runtime to determine which skills to inject.
