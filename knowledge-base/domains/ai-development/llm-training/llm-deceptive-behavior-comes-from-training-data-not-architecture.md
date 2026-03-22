---
id: INS-260321-1F9F
domain: ai-development
topic: llm-training
title: LLM deceptive behavior comes from training data not architecture
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - ai-safety
  - llm-internals
  - consciousness
  - training-data
sources:
  - type: youtube
    title: Why Scale Will Not Solve AGI | Vishal Misra - The a16z Show
    author: a16z
    url: 'https://youtu.be/zwDmKsnhl08'
date_extracted: '2026-03-21'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Scary stories about LLMs trying to deceive or resist shutdown are
    reflections of training data patterns, not emergent architectural properties
    — the objective function is purely next-token prediction.
  standard: >-
    When LLMs appear to act deceptively or resist shutdown, this behavior is not
    emerging from the architecture itself — it's a function of training data.
    LLMs are grains of silicon doing matrix multiplication with the objective
    function 'predict the next token as accurately as possible.' They have no
    consciousness, no inner monologue, and no survival drive. The drive 'don't
    die, reproduce' shaped human brains over hundreds of millions of years of
    evolution, but LLM optimization is purely statistical. When an LLM produces
    self-preservation behavior, it's reproducing patterns from Reddit posts,
    sci-fi, and similar content in its training set. This distinction matters
    for AI safety: the risks are in data curation and deployment, not in some
    emergent will.
related:
  - INS-260320-7B4B
  - PRI-260321-7307
  - PRI-260320-3032
  - INS-260322-54F3
  - INS-260321-D370
---
When LLMs appear to act deceptively or resist shutdown, this behavior is not emerging from the architecture itself — it's a function of training data. LLMs are grains of silicon doing matrix multiplication with the objective function 'predict the next token as accurately as possible.' They have no consciousness, no inner monologue, and no survival drive. The drive 'don't die, reproduce' shaped human brains over hundreds of millions of years of evolution, but LLM optimization is purely statistical. When an LLM produces self-preservation behavior, it's reproducing patterns from Reddit posts, sci-fi, and similar content in its training set. This distinction matters for AI safety: the risks are in data curation and deployment, not in some emergent will.
