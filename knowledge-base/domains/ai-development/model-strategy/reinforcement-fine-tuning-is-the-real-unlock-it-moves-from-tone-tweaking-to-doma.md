---
id: INS-260322-3616
domain: ai-development
topic: model-strategy
title: >-
  Reinforcement fine-tuning is the real unlock — it moves from tone-tweaking to
  domain-expert-level customization
actionability: reference
confidence: high
shelf_life: time-sensitive
status: active
tags:
  - fine-tuning
  - rft
  - reinforcement-learning
  - model-customization
sources:
  - type: youtube
    title: >-
      How OpenAI Builds for 800 Million Weekly Users: Model Specialization and
      Fine-Tuning
    author: a16z
    url: 'https://youtu.be/3x0jhpEj_6o'
date_extracted: '2026-03-22'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Supervised fine-tuning only changed tone and instruction-following;
    reinforcement fine-tuning lets companies train models to domain-expert level
    on their proprietary data, creating the first real moat from model
    customization.
  standard: >-
    OpenAI's early fine-tuning API (2022-2023) was limited to supervised
    fine-tuning (SFT), which in practice only produced 'instruction following
    plus' — you could adjust tone, make models less pedantic, but not
    meaningfully improve capability. It was too limited for companies to
    leverage their data troves.


    Reinforcement fine-tuning (RFT) changes the paradigm: it lets companies
    actually run RL on their proprietary data, potentially achieving
    domain-expert-level performance on specific use cases. This is why uptake
    has accelerated — the value proposition shifted from 'make the model
    slightly different' to 'create the world's best model for YOUR specific
    problem.' OpenAI even offers pricing incentives: discounted inference and
    potentially free training for companies willing to share their fine-tuning
    data, acknowledging the mutual value of this data exchange.
related:
  - INS-260321-8C35
  - INS-260322-019A
  - INS-260322-7282
  - PRI-260320-6847
  - INS-260322-17B3
  - INS-260321-B7CB
---
OpenAI's early fine-tuning API (2022-2023) was limited to supervised fine-tuning (SFT), which in practice only produced 'instruction following plus' — you could adjust tone, make models less pedantic, but not meaningfully improve capability. It was too limited for companies to leverage their data troves.

Reinforcement fine-tuning (RFT) changes the paradigm: it lets companies actually run RL on their proprietary data, potentially achieving domain-expert-level performance on specific use cases. This is why uptake has accelerated — the value proposition shifted from 'make the model slightly different' to 'create the world's best model for YOUR specific problem.' OpenAI even offers pricing incentives: discounted inference and potentially free training for companies willing to share their fine-tuning data, acknowledging the mutual value of this data exchange.
