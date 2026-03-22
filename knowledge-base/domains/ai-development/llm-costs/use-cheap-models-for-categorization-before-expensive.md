---
id: INS-260320-0511
domain: ai-development
topic: llm-costs
title: Use cheap models for categorization before expensive ones
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - llm-costs
  - model-routing
  - categorization
  - tiered-processing
sources:
  - type: reddit
    title: 'After learning this, my AI workflows cost me 30x less'
    author: u/unknown
related:
  - INS-260320-9937
  - INS-260320-9FD5
  - INS-260320-92CC
  - INS-260320-EF3A
  - PRI-260320-233B
  - INS-260321-3967
  - INS-260320-DEAF
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Use cheap models (gpt-5-nano) for categorization/relevance scoring before
    expensive models — removes 70-90% of irrelevant inputs.
  standard: |
    Implement a tiered model pipeline: use an ultra-cheap model (e.g.,
    gpt-5-nano) as a first pass to categorize and score inputs for relevance.
    Only inputs that pass the relevance threshold get forwarded to the
    expensive model. This two-stage approach removes 70-90% of irrelevant
    inputs at near-zero cost. The cheap model acts as a smart filter that
    understands context, unlike simple heuristic filters.
---

Implement a tiered model pipeline: use an ultra-cheap model (e.g.,
gpt-5-nano) as a first pass to categorize and score inputs for relevance.
Only inputs that pass the relevance threshold get forwarded to the
expensive model. This two-stage approach removes 70-90% of irrelevant
inputs at near-zero cost. The cheap model acts as a smart filter that
understands context, unlike simple heuristic filters.
