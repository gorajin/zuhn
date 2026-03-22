---
id: INS-260320-96C9
domain: ai-development
topic: claude-code
title: Self-reflect on prompting quality before blaming the model for worse output
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - prompting
  - self-reflection
  - output-quality
  - debugging
sources:
  - type: reddit
    title: Claude Code is a Beast – Tips from 6 Months of Hardcore Use
    author: u/diet103
    url: 'https://reddit.com/r/ClaudeCode'
related:
  - PRI-260320-8205
  - PRI-260320-6847
  - INS-260322-5790
  - PRI-260321-14D8
  - INS-260320-EF3A
  - INS-260322-A36C
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    If output quality seems worse, self-reflect on how you're prompting before
    blaming the model.
  standard: |
    When Claude's output quality drops, the instinct is to blame the model.
    But more often the issue is prompt quality degradation — as you get
    comfortable, you tend to write shorter, less specific prompts. Before
    concluding that the model is worse, audit your recent prompts: Are they
    as detailed as when you started? Are you providing enough context? Are
    you being specific about expected output format? Often, improving your
    prompts immediately restores output quality. The model is more consistent
    than your prompting habits.
---

When Claude's output quality drops, the instinct is to blame the model.
But more often the issue is prompt quality degradation — as you get
comfortable, you tend to write shorter, less specific prompts. Before
concluding that the model is worse, audit your recent prompts: Are they
as detailed as when you started? Are you providing enough context? Are
you being specific about expected output format? Often, improving your
prompts immediately restores output quality. The model is more consistent
than your prompting habits.
