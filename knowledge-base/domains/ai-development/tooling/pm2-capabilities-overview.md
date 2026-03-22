---
id: INS-260320-C8CC
domain: ai-development
topic: tooling
title: >-
  PM2 provides auto-restart, per-service logs, memory monitoring, and easy
  management
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - PM2
  - process-management
  - monitoring
  - auto-restart
sources:
  - type: reddit
    title: Claude Code is a Beast – Tips from 6 Months of Hardcore Use
    author: u/diet103
    url: 'https://reddit.com/r/ClaudeCode'
related:
  - INS-260322-71E4
  - INS-260320-4773
  - INS-260322-6042
  - INS-260320-69CD
  - INS-260322-24FB
  - INS-260320-26B1
  - INS-260320-00C2
  - INS-260320-5A6F
  - INS-260322-4F7A
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    PM2 gives you auto-restart on crashes, per-service logs, memory/CPU
    monitoring, and easy management like `pm2 restart email`.
  standard: |
    PM2 is a production process manager for Node.js that provides several
    key capabilities for development workflows: auto-restart on crashes
    (services come back up without manual intervention), per-service log
    files (each microservice gets its own log stream), memory and CPU
    monitoring (spot resource-hungry services), and simple management
    commands like `pm2 restart email` or `pm2 stop auth`. For Claude Code
    workflows specifically, the per-service logs and auto-restart are the
    most valuable — Claude can read logs directly and services stay running
    even if they crash during development.
---

PM2 is a production process manager for Node.js that provides several
key capabilities for development workflows: auto-restart on crashes
(services come back up without manual intervention), per-service log
files (each microservice gets its own log stream), memory and CPU
monitoring (spot resource-hungry services), and simple management
commands like `pm2 restart email` or `pm2 stop auth`. For Claude Code
workflows specifically, the per-service logs and auto-restart are the
most valuable — Claude can read logs directly and services stay running
even if they crash during development.
