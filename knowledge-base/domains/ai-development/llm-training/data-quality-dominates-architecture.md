---
id: INS-260320-7B4B
domain: ai-development
topic: llm-training
title: Data Quality Dominates Architecture in LLM Training
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - llm
  - training
  - data-quality
  - architecture
  - huggingface
  - smollm
sources:
  - type: reddit
    title: 200+ pages of Hugging Face secrets on how to train an LLM
    author: u/unknown
related:
  - INS-260320-5B49
  - INS-260320-2DDE
  - INS-260320-7682
  - INS-260320-C65B
  - INS-260320-6F8E
  - INS-260320-9935
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    HuggingFace's 200-page training playbook concludes that data quality
    dominates architectural innovation as the key factor in LLM performance.
  standard: |
    The Smol Training Playbook from HuggingFace's pre-training team --
    documenting the full journey of training SmolLM3 (3B params, 11T
    tokens, 384 H100s, ~30 days) -- identifies data quality as the single
    most important factor in LLM training outcomes. Architectural choices
    (attention mechanisms, positional encodings, dense vs. MoE) matter far
    less than careful data curation, mixture design, and curriculum
    evolution across training stages. Successful LLM teams need obsessive
    focus on data quality and rapid iteration speed. The playbook notes
    that "things are not always intuitive with LLMs" -- intuitive
    assumptions about what data strategies will work frequently fail, making
    empirical ablation studies essential.
---

The Smol Training Playbook from HuggingFace's pre-training team --
documenting the full journey of training SmolLM3 (3B params, 11T
tokens, 384 H100s, ~30 days) -- identifies data quality as the single
most important factor in LLM training outcomes. Architectural choices
(attention mechanisms, positional encodings, dense vs. MoE) matter far
less than careful data curation, mixture design, and curriculum
evolution across training stages. Successful LLM teams need obsessive
focus on data quality and rapid iteration speed. The playbook notes
that "things are not always intuitive with LLMs" -- intuitive
assumptions about what data strategies will work frequently fail, making
empirical ablation studies essential.
