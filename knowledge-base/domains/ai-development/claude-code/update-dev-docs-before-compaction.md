---
id: INS-260320-0127
domain: ai-development
topic: claude-code
title: Run /update-dev-docs before context compaction to preserve state
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - dev-docs
  - compaction
  - state-preservation
  - workflow
sources:
  - type: reddit
    title: Claude Code is a Beast – Tips from 6 Months of Hardcore Use
    author: u/diet103
    url: 'https://reddit.com/r/ClaudeCode'
related:
  - INS-260320-06EF
  - INS-260320-8F12
  - INS-260320-04A2
  - INS-260320-EA19
  - INS-260320-D4BD
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Update dev docs regularly by running /update-dev-docs before context
    compaction to preserve current state.
  standard: |
    Context compaction discards conversation history to free up tokens.
    If dev docs are not updated before compaction happens, progress and
    decisions made during the session are lost. Run /update-dev-docs
    proactively — especially before you expect compaction to occur (long
    sessions, large file operations). This writes the current state of
    the plan, context, and task progress back to the dev doc files so
    they reflect the latest reality. Think of it as saving your game
    before a checkpoint.
---

Context compaction discards conversation history to free up tokens.
If dev docs are not updated before compaction happens, progress and
decisions made during the session are lost. Run /update-dev-docs
proactively — especially before you expect compaction to occur (long
sessions, large file operations). This writes the current state of
the plan, context, and task progress back to the dev doc files so
they reflect the latest reality. Think of it as saving your game
before a checkpoint.
