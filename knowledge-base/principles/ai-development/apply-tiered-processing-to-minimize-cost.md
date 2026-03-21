---
id: PRI-260320-233B
domain: ai-development
title: "Apply tiered processing to minimize cost per unit of value"
summary: "Use cheap/free models to filter and categorize, expensive models only for what passes the filter. Batch inputs to amortize fixed costs."
confidence: high
supporting_insights:
  - INS-260320-EF3A
  - INS-260320-0511
  - INS-260320-92CC
  - INS-260320-9FD5
  - INS-260320-9937
  - INS-260320-901C
supporting_count: 6
tags:
  - cost-optimization
  - tiered-processing
  - filtering
  - batching
date_created: "2026-03-20"
last_reviewed: "2026-03-20"
resolutions:
  one_line: "Filter cheap, process expensive — tiered model pipelines cut LLM costs by 30x while processing more data."
  standard: |
    Six insights from production LLM systems describe a cost optimization
    pattern that achieved 30x reduction ($300/month to ~$10/month) while
    processing 10x more data (INS-260320-901C).

    Tier 1 — Free/near-free filtering: OpenRouter offers 50-1000 free
    requests/day on certain models (INS-260320-9937). Use these for initial
    relevance scoring and categorization.

    Tier 2 — Cheap model categorization: Use models like gpt-5-nano for
    categorization and relevance scoring, removing 70-90% of irrelevant inputs
    before expensive models see them (INS-260320-0511). Filter by engagement
    signals (upvotes, comments) to remove another 80% (INS-260320-92CC).

    Tier 3 — Expensive models on pre-qualified inputs: Don't default to
    expensive models. Test cheaper alternatives with your data first — DeepSeek
    V3 vs Claude Sonnet showed 21x cost reduction for identical summary quality
    (INS-260320-EF3A).

    Cross-cutting: Batch inputs to amortize system prompt costs. 100 separate
    calls with a 500-token system prompt waste 50,000 tokens; one batched call
    uses 500 (INS-260320-9FD5).

    The principle: every token sent to an expensive model should have survived
    multiple cheaper filters first. Cost optimization is a pipeline design
    problem, not a model selection problem.
embedded: true
embedding_model: "nomic-embed-text"
---

Six insights from production LLM systems describe a cost optimization
pattern that achieved 30x reduction ($300/month to ~$10/month) while
processing 10x more data.

Tier 1 — Free/near-free filtering: OpenRouter offers free requests/day on
certain models. Use these for initial relevance scoring and categorization.

Tier 2 — Cheap model categorization: Use models like gpt-5-nano for
categorization and relevance scoring, removing 70-90% of irrelevant inputs
before expensive models see them. Filter by engagement signals (upvotes,
comments) to remove another 80%.

Tier 3 — Expensive models on pre-qualified inputs: Don't default to
expensive models. Test cheaper alternatives with your data first — DeepSeek
V3 vs Claude Sonnet showed 21x cost reduction for identical summary quality.

Cross-cutting: Batch inputs to amortize system prompt costs. 100 separate
calls with a 500-token system prompt waste 50,000 tokens; one batched call
uses 500.

The principle: every token sent to an expensive model should have survived
multiple cheaper filters first. Cost optimization is a pipeline design
problem, not a model selection problem.
