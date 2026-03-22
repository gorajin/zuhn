---
id: INS-260320-9FD5
domain: ai-development
topic: llm-costs
title: Batch inputs to amortize system prompt token costs
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - llm-costs
  - batching
  - token-optimization
  - system-prompts
sources:
  - type: reddit
    title: 'After learning this, my AI workflows cost me 30x less'
    author: u/unknown
related:
  - INS-260320-CE36
  - PRI-260320-233B
  - INS-260321-A5D4
  - INS-260321-18D0
  - INS-260320-92CC
  - PRI-260321-14D8
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Batch inputs to amortize system prompt costs — 100 separate calls with a
    500-token system prompt = 50,000 wasted tokens. 1 batched call = 500 tokens.
  standard: |
    Every API call includes the full system prompt in the token count. With
    100 separate calls each carrying a 500-token system prompt, you waste
    50,000 tokens on repeated system prompts alone. By batching multiple
    inputs into a single call, you pay the system prompt cost once. This
    yields up to 100x token reduction on the system prompt portion. The
    key constraint is staying within the model's context window, but for
    most categorization and summarization tasks, batching 10-100 items
    per call is practical.
---

Every API call includes the full system prompt in the token count. With
100 separate calls each carrying a 500-token system prompt, you waste
50,000 tokens on repeated system prompts alone. By batching multiple
inputs into a single call, you pay the system prompt cost once. This
yields up to 100x token reduction on the system prompt portion. The
key constraint is staying within the model's context window, but for
most categorization and summarization tasks, batching 10-100 items
per call is practical.
