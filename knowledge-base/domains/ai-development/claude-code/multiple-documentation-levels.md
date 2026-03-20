---
id: INS-260320-2DDE
domain: ai-development
topic: claude-code
title: >-
  Use multiple documentation levels from broad architecture to specific API
  references
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - documentation
  - architecture
  - codebase-navigation
  - multi-level
sources:
  - type: reddit
    title: Claude Code is a Beast – Tips from 6 Months of Hardcore Use
    author: u/diet103
    url: 'https://reddit.com/r/ClaudeCode'
related:
  - INS-260320-5B49
  - INS-260320-7B4B
  - INS-260320-6F8E
  - INS-260320-EA19
  - INS-260320-4BA8
  - INS-260320-C65B
  - INS-260320-F872
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Maintain multiple documentation levels — broad architectural overview,
    specific service docs, API references — to help Claude navigate large
    codebases.
  standard: |
    Large codebases need layered documentation for Claude to navigate
    effectively. Create at least three levels: (1) a broad architectural
    overview explaining how services relate, data flows, and key design
    decisions; (2) specific service documentation covering each service's
    responsibilities, dependencies, and internal structure; (3) API
    references with endpoint signatures, request/response formats, and
    error codes. Claude uses these layers progressively — starting with
    the overview to understand where to look, then drilling into service
    docs and API references as needed. Without this hierarchy, Claude
    either wastes tokens reading everything or misses critical context.
---

Large codebases need layered documentation for Claude to navigate
effectively. Create at least three levels: (1) a broad architectural
overview explaining how services relate, data flows, and key design
decisions; (2) specific service documentation covering each service's
responsibilities, dependencies, and internal structure; (3) API
references with endpoint signatures, request/response formats, and
error codes. Claude uses these layers progressively — starting with
the overview to understand where to look, then drilling into service
docs and API references as needed. Without this hierarchy, Claude
either wastes tokens reading everything or misses critical context.
