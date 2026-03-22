---
id: INS-260321-B014
domain: ai-development
topic: llm-training
title: >-
  LLMs are mathematically proven Bayesian inference engines doing correlation
  not causation
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - llm-internals
  - bayesian
  - machine-learning
  - architecture
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
    Bayesian wind tunnel experiments prove transformers perform exact Bayesian
    posterior updating to 10^-3 bits accuracy, but this mechanism is purely
    correlational — not causal.
  standard: >-
    Vishal Misra's research at Columbia created 'Bayesian wind tunnels' —
    controlled environments where blank architectures are given tasks impossible
    to memorize but tractable enough to compute the exact Bayesian posterior
    analytically. Transformers matched the precise Bayesian posterior down to
    10^-3 bits accuracy. The key distinction is between Shannon entropy
    (correlation/prediction from patterns) and Kolmogorov complexity (the
    shortest program that reproduces something). LLMs operate in the Shannon
    entropy world — they find correlations in training data. The digits of pi
    have infinite Shannon entropy but very small Kolmogorov complexity. Deep
    learning cannot cross from correlation to the causal, compressed-program
    world that true intelligence requires.
related:
  - INS-260321-C4CD
  - INS-260322-474A
  - INS-260322-5932
  - INS-260321-8C35
  - PRI-260321-14D8
  - INS-260322-A8F2
---
Vishal Misra's research at Columbia created 'Bayesian wind tunnels' — controlled environments where blank architectures are given tasks impossible to memorize but tractable enough to compute the exact Bayesian posterior analytically. Transformers matched the precise Bayesian posterior down to 10^-3 bits accuracy. The key distinction is between Shannon entropy (correlation/prediction from patterns) and Kolmogorov complexity (the shortest program that reproduces something). LLMs operate in the Shannon entropy world — they find correlations in training data. The digits of pi have infinite Shannon entropy but very small Kolmogorov complexity. Deep learning cannot cross from correlation to the causal, compressed-program world that true intelligence requires.
