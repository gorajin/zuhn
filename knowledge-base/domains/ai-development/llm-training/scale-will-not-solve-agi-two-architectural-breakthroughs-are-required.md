---
id: INS-260321-8C35
domain: ai-development
topic: llm-training
title: Scale will not solve AGI — two architectural breakthroughs are required
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - agi
  - scaling
  - architecture
  - continual-learning
  - causality
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
    AGI requires weight plasticity (continual learning without catastrophic
    forgetting) and causal modeling (simulation over correlation) — neither
    solvable by making models bigger.
  standard: >-
    The common misconception that scaling models larger will eventually produce
    AGI is wrong according to Misra's mathematical framework. Two fundamental
    capabilities are missing from current architectures. First, plasticity:
    human brains remain plastic throughout life, continuously updating synaptic
    weights, while LLM weights freeze after training and forget everything
    between conversations. Continual learning must balance learning new things
    against catastrophic forgetting — a hard unsolved problem. Second, causal
    modeling: when a pen is thrown at you, your brain simulates the trajectory
    rather than computing Bayesian probabilities. LLMs do association (Judea
    Pearl's first level of causal hierarchy) but cannot do intervention or
    counterfactual reasoning (levels two and three). Both breakthroughs require
    new architectures, not more parameters.
related:
  - INS-260321-3967
  - INS-260321-D959
  - INS-260321-E59A
  - INS-260321-B014
  - INS-260322-54F3
  - INS-260321-B7CB
---
The common misconception that scaling models larger will eventually produce AGI is wrong according to Misra's mathematical framework. Two fundamental capabilities are missing from current architectures. First, plasticity: human brains remain plastic throughout life, continuously updating synaptic weights, while LLM weights freeze after training and forget everything between conversations. Continual learning must balance learning new things against catastrophic forgetting — a hard unsolved problem. Second, causal modeling: when a pen is thrown at you, your brain simulates the trajectory rather than computing Bayesian probabilities. LLMs do association (Judea Pearl's first level of causal hierarchy) but cannot do intervention or counterfactual reasoning (levels two and three). Both breakthroughs require new architectures, not more parameters.
