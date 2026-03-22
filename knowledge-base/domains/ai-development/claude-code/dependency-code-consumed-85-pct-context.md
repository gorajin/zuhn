---
id: INS-260320-CE36
domain: ai-development
topic: claude-code
title: Dependency code consumed 85 percent of context window
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - claude-code
  - context-window
  - token-waste
  - dependencies
sources:
  - type: reddit
    title: Claude Code usage limit hack
    author: u/PaschalisDim
related:
  - INS-260320-949A
  - INS-260320-9FD5
  - INS-260321-0C99
  - INS-260320-69CD
  - INS-260320-10CC
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    85,000 out of 100,000 context tokens were consumed by dependency code — one
    bash validation hook saved 85% of the context window.
  standard: |
    Without a bash validation hook, Claude Code consumed 85,000 out of
    100,000 context tokens scanning dependency code (node_modules and
    similar directories) through bash commands like grep and find. This
    left only 15% of the context window for actual productive work. A
    single pre-execution bash validation hook reclaimed 85% of the
    context window, dramatically extending how much useful work Claude
    can do before hitting context limits. This is one of the highest-ROI
    optimizations for Claude Code usage.
---

Without a bash validation hook, Claude Code consumed 85,000 out of
100,000 context tokens scanning dependency code (node_modules and
similar directories) through bash commands like grep and find. This
left only 15% of the context window for actual productive work. A
single pre-execution bash validation hook reclaimed 85% of the
context window, dramatically extending how much useful work Claude
can do before hitting context limits. This is one of the highest-ROI
optimizations for Claude Code usage.
