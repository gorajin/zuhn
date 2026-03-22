---
id: INS-260321-9906
domain: ai-development
topic: system-building
title: >-
  Natural language trading precise vocabulary for ambiguous vocabulary is a real
  tradeoff
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - natural-language
  - interfaces
  - ambiguity
  - precision
  - robotics
sources:
  - type: blog
    title: 'Debugging as architecture insight: dissecting a VLA'
    author: Substack
    url: 'https://substack.com/home/post/p-188827303'
date_extracted: '2026-03-21'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Natural language interfaces change who can program a robot, not just what it
    can do — but they trade a small precise vocabulary (preprogrammed tasks) for
    a large ambiguous one where the boundary of understanding is opaque.
  standard: >-
    'Pick up the red block' sounds more expressive than running 'pick_red'
    preprogrammed task, but the boundary of what the model actually understands
    is opaque in a way that a fixed command vocabulary is not. The author proved
    this with counterfactual experiments: equivalent prompts produce similar
    actions (good), but spatial primitives ('up', 'away', 'stop') are unreliable
    because the model learned them as scene descriptions, not workspace
    commands. This is Karpathy's 'apps should become APIs' in reverse —
    sometimes explicit, constrained APIs are safer than flexible natural
    language. The tradeoff is expressivity vs predictability.
related:
  - INS-260320-E872
  - PRI-260320-D2E1
  - INS-260321-B8E8
  - INS-260321-D370
  - INS-260321-AD95
  - INS-260321-A56C
  - PRI-260320-6847
  - INS-260321-7D7C
  - INS-260320-DEAF
---
'Pick up the red block' sounds more expressive than running 'pick_red' preprogrammed task, but the boundary of what the model actually understands is opaque in a way that a fixed command vocabulary is not. The author proved this with counterfactual experiments: equivalent prompts produce similar actions (good), but spatial primitives ('up', 'away', 'stop') are unreliable because the model learned them as scene descriptions, not workspace commands. This is Karpathy's 'apps should become APIs' in reverse — sometimes explicit, constrained APIs are safer than flexible natural language. The tradeoff is expressivity vs predictability.
