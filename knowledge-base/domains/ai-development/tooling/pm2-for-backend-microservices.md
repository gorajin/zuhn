---
id: INS-260320-4773
domain: ai-development
topic: tooling
title: "Run backend microservices via PM2 so Claude can read individual service logs in real-time"
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags: [PM2, microservices, debugging, logs, backend]
sources:
  - type: reddit
    title: "Claude Code is a Beast – Tips from 6 Months of Hardcore Use"
    author: u/diet103
    url: "https://reddit.com/r/ClaudeCode"
related: [INS-260320-C8CC]
date_extracted: "2026-03-20"
last_accessed: null
access_count: 0
indexed: false
embedded: false
resolutions:
  one_line: "Run all backend microservices via PM2 so Claude can read individual service logs in real-time without manual copy-pasting."
  standard: |
    Instead of running microservices manually in terminal tabs, use PM2 to
    manage all backend services. This gives Claude direct access to individual
    service logs via commands like `pm2 logs email` — no more copy-pasting
    error output from terminal windows. Claude can read logs in real-time,
    correlate errors across services, and debug issues without requiring you
    to be the intermediary. This dramatically reduces the feedback loop for
    backend debugging since Claude can independently investigate service
    behavior.
---

Instead of running microservices manually in terminal tabs, use PM2 to
manage all backend services. This gives Claude direct access to individual
service logs via commands like `pm2 logs email` — no more copy-pasting
error output from terminal windows. Claude can read logs in real-time,
correlate errors across services, and debug issues without requiring you
to be the intermediary. This dramatically reduces the feedback loop for
backend debugging since Claude can independently investigate service
behavior.
