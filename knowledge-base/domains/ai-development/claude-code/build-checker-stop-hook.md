---
id: INS-260320-4DE2
domain: ai-development
topic: claude-code
title: >-
  Build Checker Stop hook reads edit logs and runs builds to catch TypeScript
  errors
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - hooks
  - Stop-event
  - build-checker
  - TypeScript
  - error-detection
sources:
  - type: reddit
    title: Claude Code is a Beast – Tips from 6 Months of Hardcore Use
    author: u/diet103
    url: 'https://reddit.com/r/ClaudeCode'
related:
  - INS-260320-1B10
  - INS-260320-9D89
  - INS-260320-DDFE
  - INS-260320-0D43
  - INS-260320-69CD
  - INS-260320-4ED6
  - INS-260320-7379
  - INS-260320-DCA0
  - INS-260320-CE36
  - INS-260320-949A
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    A Stop hook reads the file edit logs, runs builds on affected repos, and
    catches TypeScript errors — showing small errors to Claude or recommending
    an auto-resolver agent for larger ones.
  standard: |
    The Build Checker fires as a Stop hook after Claude finishes responding.
    It reads the edit logs produced by the File Edit Tracker to identify
    which repositories had files changed, then runs builds on those repos
    to catch TypeScript and compilation errors. If fewer than 5 errors are
    found, they are shown directly to Claude for immediate fixing. If 5 or
    more errors are detected, it recommends spawning an auto-error-resolver
    agent to handle the volume. This threshold-based approach prevents
    Claude from getting overwhelmed by large error lists while still
    catching small issues inline.
---

The Build Checker fires as a Stop hook after Claude finishes responding.
It reads the edit logs produced by the File Edit Tracker to identify
which repositories had files changed, then runs builds on those repos
to catch TypeScript and compilation errors. If fewer than 5 errors are
found, they are shown directly to Claude for immediate fixing. If 5 or
more errors are detected, it recommends spawning an auto-error-resolver
agent to handle the volume. This threshold-based approach prevents
Claude from getting overwhelmed by large error lists while still
catching small issues inline.
