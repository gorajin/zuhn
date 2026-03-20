---
id: INS-260320-949A
domain: ai-development
topic: claude-code
title: "Pre-execution bash validation hook blocks token waste"
actionability: immediate
confidence: high
shelf_life: time-sensitive
status: active
tags: [claude-code, hooks, bash-validation, token-optimization]
sources:
  - type: reddit
    title: "Claude Code usage limit hack"
    author: u/PaschalisDim
related:
  - INS-260320-DDFE
date_extracted: "2026-03-20"
last_accessed: null
access_count: 0
indexed: true
embedded: false
resolutions:
  one_line: "A 5-line pre-execution bash hook checks commands against BLOCKED patterns (node_modules, .env, __pycache__, .git/, dist/, build/) and blocks 99% of token waste."
  standard: |
    Since bash commands bypass Read() deny rules, implement a pre-execution
    bash validation hook — a simple 5-line script that intercepts bash
    commands before execution and checks them against a list of BLOCKED
    patterns: node_modules, .env, __pycache__, .git/, dist/, build/.
    If the command would access a blocked path, the hook exits with error
    code 2, preventing execution. This blocks 99% of accidental token
    waste from Claude scanning large dependency trees or build artifacts
    through bash commands.
---

Since bash commands bypass Read() deny rules, implement a pre-execution
bash validation hook — a simple 5-line script that intercepts bash
commands before execution and checks them against a list of BLOCKED
patterns: node_modules, .env, __pycache__, .git/, dist/, build/.
If the command would access a blocked path, the hook exits with error
code 2, preventing execution. This blocks 99% of accidental token
waste from Claude scanning large dependency trees or build artifacts
through bash commands.
