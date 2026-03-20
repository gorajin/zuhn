---
id: INS-260320-04A2
domain: ai-development
topic: claude-code
title: >-
  Create plan.md, context.md, and tasks.md for every large task to prevent
  context loss
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - dev-docs
  - planning
  - context-management
  - compaction
sources:
  - type: reddit
    title: Claude Code is a Beast – Tips from 6 Months of Hardcore Use
    author: u/diet103
    url: 'https://reddit.com/r/ClaudeCode'
related:
  - INS-260320-06EF
  - INS-260320-8F12
  - INS-260320-B210
  - INS-260320-F872
  - INS-260320-0127
  - INS-260320-EA19
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Create three dev doc files (plan.md, context.md, tasks.md) for every large
    task to prevent Claude from losing the plot through compaction.
  standard: |
    For any large task, create three dedicated files: plan.md (the overall
    approach and architecture decisions), context.md (relevant background
    information Claude needs to understand the codebase), and tasks.md
    (a checklist of specific implementation steps). These files serve as
    persistent external memory that survives context compaction. Without
    them, Claude loses track of the bigger picture as conversation history
    gets compressed. The three-file structure ensures Claude can always
    re-orient itself by reading these docs at the start of a new session
    or after compaction.
---

For any large task, create three dedicated files: plan.md (the overall
approach and architecture decisions), context.md (relevant background
information Claude needs to understand the codebase), and tasks.md
(a checklist of specific implementation steps). These files serve as
persistent external memory that survives context compaction. Without
them, Claude loses track of the bigger picture as conversation history
gets compressed. The three-file structure ensures Claude can always
re-orient itself by reading these docs at the start of a new session
or after compaction.
