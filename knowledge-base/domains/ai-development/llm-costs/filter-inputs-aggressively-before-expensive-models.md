---
id: INS-260320-92CC
domain: ai-development
topic: llm-costs
title: Filter inputs aggressively before expensive model calls
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - llm-costs
  - input-filtering
  - preprocessing
  - cost-reduction
sources:
  - type: reddit
    title: 'After learning this, my AI workflows cost me 30x less'
    author: u/unknown
related:
  - INS-260320-9FD5
  - INS-260320-0511
  - INS-260322-5790
  - INS-260320-EF3A
  - PRI-260320-233B
  - INS-260322-31F8
  - INS-260321-31B3
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Filter aggressively before hitting expensive models — filtering by
    upvotes/comments removes 80% of inputs, saving ~$5/week.
  standard: |
    Before sending data to expensive LLM calls, apply simple heuristic
    filters to eliminate low-value inputs. For social media data, filtering
    by engagement metrics (upvotes, comments, shares) removes approximately
    80% of inputs that would produce low-quality or irrelevant outputs.
    This is pure cost savings with no quality loss — you are only removing
    inputs that would not have produced useful results anyway. At scale,
    this saves ~$5/week per pipeline.
---

Before sending data to expensive LLM calls, apply simple heuristic
filters to eliminate low-value inputs. For social media data, filtering
by engagement metrics (upvotes, comments, shares) removes approximately
80% of inputs that would produce low-quality or irrelevant outputs.
This is pure cost savings with no quality loss — you are only removing
inputs that would not have produced useful results anyway. At scale,
this saves ~$5/week per pipeline.
