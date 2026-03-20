---
id: INS-260320-B210
domain: ai-development
topic: claude-code
title: "Keep SKILL.md under 500 lines with progressive disclosure for 40-60% token savings"
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags: [skills, token-efficiency, progressive-disclosure, SKILL.md]
sources:
  - type: reddit
    title: "Claude Code is a Beast – Tips from 6 Months of Hardcore Use"
    author: u/diet103
    url: "https://reddit.com/r/ClaudeCode"
related: [INS-260320-F872]
date_extracted: "2026-03-20"
last_accessed: null
access_count: 0
indexed: true
embedded: false
resolutions:
  one_line: "Keep SKILL.md files under 500 lines and use progressive disclosure via resource files for 40-60% token efficiency improvement."
  standard: |
    Large SKILL.md files waste tokens by loading everything into context
    regardless of relevance. Keep the main SKILL.md under 500 lines with
    a concise overview and essential instructions. Use progressive disclosure
    by linking to separate resource files that Claude can pull in only when
    needed. This approach yields a 40-60% token efficiency improvement because
    Claude only loads the detailed resources when the task actually requires
    them. Structure skills as: core instructions in SKILL.md, detailed examples
    and edge cases in linked resource files.
---

Large SKILL.md files waste tokens by loading everything into context
regardless of relevance. Keep the main SKILL.md under 500 lines with
a concise overview and essential instructions. Use progressive disclosure
by linking to separate resource files that Claude can pull in only when
needed. This approach yields a 40-60% token efficiency improvement because
Claude only loads the detailed resources when the task actually requires
them. Structure skills as: core instructions in SKILL.md, detailed examples
and edge cases in linked resource files.
