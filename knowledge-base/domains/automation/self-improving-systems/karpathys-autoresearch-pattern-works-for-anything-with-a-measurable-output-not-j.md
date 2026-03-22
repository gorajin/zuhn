---
id: INS-260322-24FB
domain: automation
topic: self-improving-systems
title: >-
  Karpathy's Autoresearch pattern works for anything with a measurable output —
  not just ML training
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - autoresearch
  - self-improvement-loops
  - karpathy
  - optimization
sources:
  - type: youtube
    title: Claude Code + Karpathy's Autoresearch = GOD MODE!
    author: AI Andy
    url: 'https://youtu.be/vjJwgXsMfjM'
date_extracted: '2026-03-22'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    The Autoresearch loop (change a file, measure the result, keep or discard)
    can optimize any prompt-driven process with measurable outputs — content,
    emails, landing pages, thumbnails.
  standard: >-
    Karpathy's Autoresearch repo was designed for ML training script
    optimization: an AI agent tweaks code, runs it, checks if results improved,
    keeps changes if they did, discards if not, and repeats. He got 11%
    improvement running hundreds of experiments overnight. But the insight most
    people miss is that this pattern generalizes to anything with three
    components: a file to change (the prompt), instructions on what to optimize,
    and a way to measure whether it got better.


    AI Andy mapped this to content creation: the prompt is his train.py, the
    loop instructions are his program.md, and the eval is real views from
    Instagram/Facebook. The same pattern applies to thumbnail prompts, email
    sequences, landing pages, ad copy — any system where a prompt produces a
    measurable output. The key constraint: you need a real, quantitative
    feedback signal, not vibes-based evaluation.
related:
  - INS-260320-0D43
  - INS-260320-C8CC
  - INS-260320-D3D5
  - INS-260321-FE91
  - INS-260322-4757
  - INS-260320-69CD
  - INS-260320-7379
  - INS-260322-C0D3
  - INS-260320-4DE2
---
Karpathy's Autoresearch repo was designed for ML training script optimization: an AI agent tweaks code, runs it, checks if results improved, keeps changes if they did, discards if not, and repeats. He got 11% improvement running hundreds of experiments overnight. But the insight most people miss is that this pattern generalizes to anything with three components: a file to change (the prompt), instructions on what to optimize, and a way to measure whether it got better.

AI Andy mapped this to content creation: the prompt is his train.py, the loop instructions are his program.md, and the eval is real views from Instagram/Facebook. The same pattern applies to thumbnail prompts, email sequences, landing pages, ad copy — any system where a prompt produces a measurable output. The key constraint: you need a real, quantitative feedback signal, not vibes-based evaluation.
