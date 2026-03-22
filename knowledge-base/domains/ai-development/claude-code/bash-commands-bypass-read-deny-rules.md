---
id: INS-260320-DDFE
domain: ai-development
topic: claude-code
title: Bash commands bypass Claude Code Read deny rules
actionability: immediate
confidence: high
shelf_life: time-sensitive
status: active
tags:
  - claude-code
  - security
  - permissions
  - bash
  - deny-rules
sources:
  - type: reddit
    title: Claude Code usage limit hack
    author: u/PaschalisDim
related:
  - INS-260320-949A
  - INS-260320-7379
  - INS-260321-2482
  - INS-260320-4DE2
  - INS-260320-1B10
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Bash commands (grep, find) bypass Read() deny rules — they scan everything
    including node_modules even with deny rules configured.
  standard: >
    Claude Code has two separate permission systems that do not communicate

    with each other. The Read() deny rules (e.g., "deny":
    ["Read(node_modules/)"])

    only block the Read tool. Bash commands like grep and find operate outside

    this system and will scan everything, including denied directories like

    node_modules, .env files, and other excluded paths. This means your

    deny rules give a false sense of security — Claude can still access

    denied content through bash commands, consuming massive amounts of

    context tokens in the process.
---

Claude Code has two separate permission systems that do not communicate
with each other. The Read() deny rules (e.g., "deny": ["Read(node_modules/)"])
only block the Read tool. Bash commands like grep and find operate outside
this system and will scan everything, including denied directories like
node_modules, .env files, and other excluded paths. This means your
deny rules give a false sense of security — Claude can still access
denied content through bash commands, consuming massive amounts of
context tokens in the process.
