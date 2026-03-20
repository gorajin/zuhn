---
id: INS-260320-A4BF
domain: ai-development
topic: claude-code
title: "Attach utility scripts to skills instead of letting Claude reinvent them"
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags: [skills, utility-scripts, reuse, efficiency]
sources:
  - type: reddit
    title: "Claude Code is a Beast – Tips from 6 Months of Hardcore Use"
    author: u/diet103
    url: "https://reddit.com/r/ClaudeCode"
related: [INS-260320-2DDE, INS-260320-B210]
date_extracted: "2026-03-20"
last_accessed: null
access_count: 0
indexed: false
embedded: false
resolutions:
  one_line: "Attach ready-to-use utility scripts to skills so Claude references proven tools instead of reinventing test scripts from scratch."
  standard: |
    When a skill involves running tests, data migrations, or other scripted
    operations, attach the actual utility scripts as resources. Instead of
    Claude reinventing a test runner or data seeder from scratch each time,
    the skill references ready-to-use, tested tools. This saves tokens
    (Claude reads a reference instead of generating code), ensures
    consistency (the same proven script is used every time), and avoids
    bugs (Claude's ad-hoc scripts often have edge case issues). Package
    utility scripts alongside their skills and reference them in the
    SKILL.md instructions.
---

When a skill involves running tests, data migrations, or other scripted
operations, attach the actual utility scripts as resources. Instead of
Claude reinventing a test runner or data seeder from scratch each time,
the skill references ready-to-use, tested tools. This saves tokens
(Claude reads a reference instead of generating code), ensures
consistency (the same proven script is used every time), and avoids
bugs (Claude's ad-hoc scripts often have edge case issues). Package
utility scripts alongside their skills and reference them in the
SKILL.md instructions.
