---
id: INS-260320-9D89
domain: ai-development
topic: agent-patterns
title: Give agents specific roles and clear instructions on what to return
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - agents
  - roles
  - instructions
  - output-format
sources:
  - type: reddit
    title: Claude Code is a Beast – Tips from 6 Months of Hardcore Use
    author: u/diet103
    url: 'https://reddit.com/r/ClaudeCode'
related:
  - INS-260321-2482
  - INS-260322-EAB6
  - INS-260322-D8C3
  - INS-260321-D3BE
  - INS-260320-7914
  - INS-260320-63D3
  - PRI-260320-D5B7
  - INS-260321-C5AA
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Give agents very specific roles and clear instructions on what to RETURN —
    prevents 'I fixed it!' without details.
  standard: |
    When creating specialized agents (code review, error resolver, etc.),
    define their role narrowly and explicitly specify what they must return.
    Without return instructions, agents tend to say "I fixed it!" without
    providing details about what changed, why, or what to verify. Specify
    the exact output format: which files were changed, what the changes were,
    what was the reasoning, and what needs manual verification. Clear return
    instructions transform agents from black boxes into transparent,
    accountable tools whose work you can review efficiently.
---

When creating specialized agents (code review, error resolver, etc.),
define their role narrowly and explicitly specify what they must return.
Without return instructions, agents tend to say "I fixed it!" without
providing details about what changed, why, or what to verify. Specify
the exact output format: which files were changed, what the changes were,
what was the reasoning, and what needs manual verification. Clear return
instructions transform agents from black boxes into transparent,
accountable tools whose work you can review efficiently.
