---
id: INS-260320-DCA0
domain: ai-development
topic: claude-code
title: "Use UserPromptSubmit hook to inject skill reminders before Claude reads the message"
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags: [hooks, UserPromptSubmit, skills, context-injection]
sources:
  - type: reddit
    title: "Claude Code is a Beast – Tips from 6 Months of Hardcore Use"
    author: u/diet103
    url: "https://reddit.com/r/ClaudeCode"
related: [INS-260320-F8FD, INS-260320-8DBD]
date_extracted: "2026-03-20"
last_accessed: null
access_count: 0
indexed: false
embedded: false
resolutions:
  one_line: "A UserPromptSubmit hook analyzes the prompt for keywords and intent, then injects skill reminders into context BEFORE Claude reads it."
  standard: |
    The UserPromptSubmit hook fires before Claude processes a user message. It
    analyzes the incoming prompt for keywords and intent patterns, then injects
    relevant skill reminders directly into the context. This means Claude sees
    the skill instructions alongside the prompt, dramatically improving skill
    adherence. The hook acts as a pre-processor that bridges the gap between
    user intent and skill activation without requiring the user to manually
    invoke skills every time.
---

The UserPromptSubmit hook fires before Claude processes a user message. It
analyzes the incoming prompt for keywords and intent patterns, then injects
relevant skill reminders directly into the context. This means Claude sees
the skill instructions alongside the prompt, dramatically improving skill
adherence. The hook acts as a pre-processor that bridges the gap between
user intent and skill activation without requiring the user to manually
invoke skills every time.
