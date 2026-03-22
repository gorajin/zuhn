---
id: INS-260321-8433
domain: ai-development
topic: future-of-work
title: Auto-research beats expert intuition on hyperparameter tuning
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - auto-research
  - hyperparameters
  - recursive-self-improvement
  - llm-training
sources:
  - type: youtube
    title: 'Andrej Karpathy on Code Agents, AutoResearch, and the Loopy Era of AI'
    author: 'No Priors: AI, Machine Learning, Tech, & Startups'
    url: 'https://youtu.be/kwSVtQ7dziU'
date_extracted: '2026-03-21'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Karpathy's auto-research loop found hyperparameter improvements overnight
    that his two decades of ML experience missed — the agent found weight decay
    and Adam beta issues that interact jointly.
  standard: >-
    After manually tuning his GPT model for months using his own expert
    intuition from two decades of ML research, Karpathy let auto-research run
    overnight. It found improvements he didn't see — specifically weight decay
    on value embeddings and insufficiently tuned Adam betas. The key insight is
    that these parameters interact jointly, so tuning one changes what's optimal
    for others. No human can efficiently search this joint space. If it works on
    a 'fairly well tuned' model, it works on anything.
related:
  - INS-260320-4B31
  - INS-260321-D959
  - INS-260321-9824
  - INS-260320-9935
  - INS-260321-1A0B
---
After manually tuning his GPT model for months using his own expert intuition from two decades of ML research, Karpathy let auto-research run overnight. It found improvements he didn't see — specifically weight decay on value embeddings and insufficiently tuned Adam betas. The key insight is that these parameters interact jointly, so tuning one changes what's optimal for others. No human can efficiently search this joint space. If it works on a 'fairly well tuned' model, it works on anything.
