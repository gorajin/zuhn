---
id: INS-260320-4A82
domain: ai-development
topic: spec-driven-dev
title: Commit output specs to git to prevent context loss
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - spec-driven-dev
  - git
  - context-preservation
  - agent-continuity
sources:
  - type: reddit
    title: Why we shifted to Spec-Driven Development
    author: u/unknown
related:
  - PRI-260320-467A
  - INS-260320-D4BD
  - INS-260320-6F8E
  - INS-260320-4BA8
  - INS-260320-A4BF
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Commit output specs to git so future agents and engineers see what was done,
    what failed, and what decisions were made.
  standard: |
    Output specs (research logs, code notes, findings) should be committed
    to git alongside the code they describe. This prevents context loss
    across agent sessions, team handoffs, and time gaps. When a future
    agent or engineer picks up the work, they can read the committed specs
    to understand not just what was built, but why specific decisions were
    made, what alternatives were considered, and what failed. This is
    especially critical for AI agents that lose context between sessions.
---

Output specs (research logs, code notes, findings) should be committed
to git alongside the code they describe. This prevents context loss
across agent sessions, team handoffs, and time gaps. When a future
agent or engineer picks up the work, they can read the committed specs
to understand not just what was built, but why specific decisions were
made, what alternatives were considered, and what failed. This is
especially critical for AI agents that lose context between sessions.
