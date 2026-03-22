---
id: INS-260320-0F7C
domain: ai-development
topic: system-building
title: >-
  File-based architecture enables total regenerability — if any generated
  artifact breaks, just rebuild it
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - architecture
  - regenerability
  - resilience
sources:
  - type: paste
    title: Building the Zuhn knowledge base — lessons from Phase 1-5
    author: Jin Choi + Claude
related:
  - INS-260320-E6DD
  - INS-260320-8FFC
  - INS-260322-F46F
  - PRI-260320-467A
  - INS-260322-22B3
  - INS-260322-2E1C
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Markdown files are the source of truth; SQLite database, indices, mindmap,
    and tag files are all generated and disposable — when the DB had schema
    issues, we just regenerated it.
  standard: |
    Markdown files are the source of truth. SQLite database, indices, mindmap,
    and tag files are all generated. When the DB had schema issues during
    Phase 4, we just regenerated it from the markdown files. No data loss,
    no migration scripts, no downtime.

    This is the same principle as "structure over blobs" — the structure (YAML
    frontmatter in markdown files) survives because it is human-readable and
    version-controlled. The views (DB, indices, mindmap) are disposable
    projections that can be rebuilt from source at any time.

    Practical implication: never put primary data in a generated artifact.
    If the source of truth is a generated file, you have a single point of
    failure. If the source of truth is structured plain text, you have
    infinite regenerability.
---

Markdown files are the source of truth. SQLite database, indices, mindmap,
and tag files are all generated. When the DB had schema issues during
Phase 4, we just regenerated it from the markdown files. No data loss,
no migration scripts, no downtime.

This is the same principle as "structure over blobs" — the structure (YAML
frontmatter in markdown files) survives because it is human-readable and
version-controlled. The views (DB, indices, mindmap) are disposable
projections that can be rebuilt from source at any time.

Practical implication: never put primary data in a generated artifact.
If the source of truth is a generated file, you have a single point of
failure. If the source of truth is structured plain text, you have
infinite regenerability.
