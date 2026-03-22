---
id: INS-260320-8FFC
domain: ai-development
topic: system-building
title: >-
  Stateless ID generation avoids LLM hallucination — never ask an AI to track
  sequential counters
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - id-generation
  - hallucination
  - stateless-design
sources:
  - type: paste
    title: Building the Zuhn knowledge base — lessons from Phase 1-5
    author: Jin Choi + Claude
related:
  - INS-260320-0F7C
  - INS-260321-E4EB
  - PRI-260321-D74F
  - INS-260321-E59A
  - PRI-260320-07A4
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Sequential IDs stored in a file would be hallucinated by the LLM — timestamp
    plus title hash made file creation completely stateless with zero collisions
    across 74 insights.
  standard: |
    An external reviewer identified that sequential IDs stored in a counter
    file would eventually be hallucinated by the LLM — skipping numbers,
    guessing the next value, or creating duplicates. The solution was a
    ULID-inspired scheme: timestamp (date) plus a 4-character SHA256 hash of
    the title, making file creation completely stateless.

    Validated: zero ID collisions across 74 insights. No counter file to
    read, no state to maintain, no race conditions between concurrent agents.
    Each agent can independently generate a unique ID from just the title
    string and the current date.

    General principle: never ask an LLM to maintain sequential state. LLMs
    hallucinate counters, skip numbers, and lose track of sequences. Design
    stateless operations where each invocation is self-contained and
    deterministic from its inputs alone.
---

An external reviewer identified that sequential IDs stored in a counter
file would eventually be hallucinated by the LLM — skipping numbers,
guessing the next value, or creating duplicates. The solution was a
ULID-inspired scheme: timestamp (date) plus a 4-character SHA256 hash of
the title, making file creation completely stateless.

Validated: zero ID collisions across 74 insights. No counter file to
read, no state to maintain, no race conditions between concurrent agents.
Each agent can independently generate a unique ID from just the title
string and the current date.

General principle: never ask an LLM to maintain sequential state. LLMs
hallucinate counters, skip numbers, and lose track of sequences. Design
stateless operations where each invocation is self-contained and
deterministic from its inputs alone.
