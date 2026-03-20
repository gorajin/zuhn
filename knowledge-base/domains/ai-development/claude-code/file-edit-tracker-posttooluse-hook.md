---
id: INS-260320-0D43
domain: ai-development
topic: claude-code
title: "File Edit Tracker via PostToolUse hook logs edits with repo and timestamps"
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags: [hooks, PostToolUse, file-tracking, logging]
sources:
  - type: reddit
    title: "Claude Code is a Beast – Tips from 6 Months of Hardcore Use"
    author: u/diet103
    url: "https://reddit.com/r/ClaudeCode"
related: [INS-260320-4DE2, INS-260320-4ED6]
date_extracted: "2026-03-20"
last_accessed: null
access_count: 0
indexed: true
embedded: false
resolutions:
  one_line: "A PostToolUse hook tracks which files were edited, which repo they belong to, and timestamps — feeding downstream hooks like the build checker."
  standard: |
    The File Edit Tracker is a PostToolUse hook that fires after every tool
    invocation. It logs which files were edited, which repository they belong
    to, and timestamps of each edit. This creates an audit trail that
    downstream hooks can consume. The build checker hook, for example, reads
    these edit logs to know which repos need rebuilding. Without this tracker,
    downstream hooks would have no way to know what changed during a session.
    It is the foundation of the entire hook pipeline.
---

The File Edit Tracker is a PostToolUse hook that fires after every tool
invocation. It logs which files were edited, which repository they belong
to, and timestamps of each edit. This creates an audit trail that
downstream hooks can consume. The build checker hook, for example, reads
these edit logs to know which repos need rebuilding. Without this tracker,
downstream hooks would have no way to know what changed during a session.
It is the foundation of the entire hook pipeline.
