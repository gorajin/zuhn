---
id: INS-260320-47FA
domain: ai-development
topic: system-building
title: >-
  Compression hierarchy works in practice — logarithmic navigation at 74
  insights scales the same at 10,000
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - hierarchy
  - compression
  - navigation
  - scaling
sources:
  - type: paste
    title: Building the Zuhn knowledge base — lessons from Phase 1-5
    author: Jin Choi + Claude
related:
  - INS-260320-E6DD
  - INS-260320-5B49
  - INS-260320-2DDE
  - INS-260320-C65B
  - INS-260320-4773
  - INS-260320-9118
  - INS-260320-71C1
  - INS-260321-ADB4
  - INS-260320-080B
  - INS-260321-AACC
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    MASTER_INDEX to domain overview to topic summary to individual insight —
    answering "what do I know about X?" requires reading roughly 4 files
    regardless of total insight count.
  standard: |
    The compression hierarchy — MASTER_INDEX (30 lines) to domain overview
    to topic summary to individual insight — provides logarithmic navigation.
    Answering "what do I know about X?" requires reading approximately 4 files
    regardless of total insight count.

    At 74 insights this was the spec's core thesis. We proved it works: the
    MASTER_INDEX fits in 30 lines, each domain overview covers 10-30 insights
    in a single page, and topic summaries group 3-8 related insights with
    one-line resolutions. The navigation depth is constant (4 levels) while
    the breadth grows linearly.

    This means the system scales to 10,000 insights without changing the
    navigation pattern. An AI agent reading 4 files (roughly 200 lines total)
    can locate any insight in the knowledge base. This is the same principle
    as B-tree indexing in databases — logarithmic access through hierarchical
    compression.
---

The compression hierarchy — MASTER_INDEX (30 lines) to domain overview
to topic summary to individual insight — provides logarithmic navigation.
Answering "what do I know about X?" requires reading approximately 4 files
regardless of total insight count.

At 74 insights this was the spec's core thesis. We proved it works: the
MASTER_INDEX fits in 30 lines, each domain overview covers 10-30 insights
in a single page, and topic summaries group 3-8 related insights with
one-line resolutions. The navigation depth is constant (4 levels) while
the breadth grows linearly.

This means the system scales to 10,000 insights without changing the
navigation pattern. An AI agent reading 4 files (roughly 200 lines total)
can locate any insight in the knowledge base. This is the same principle
as B-tree indexing in databases — logarithmic access through hierarchical
compression.
