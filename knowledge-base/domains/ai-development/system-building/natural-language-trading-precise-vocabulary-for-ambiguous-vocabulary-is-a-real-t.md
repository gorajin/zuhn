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
    author:
      - '@type': Person
        name: Avik De
        url: 'https://substack.com/@avikde'
        description: 'Safe, efficient robotics & AI -- Robotics Ph.D. and founder'
        identifier: 'user:356074997'
        image:
          '@type': ImageObject
          contentUrl: >-
            https://substackcdn.com/image/fetch/$s_!E5et!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F30589b07-e0a0-4de5-8997-78db1ed3f65b_1290x1290.png
          thumbnailUrl: >-
            https://substackcdn.com/image/fetch/$s_!E5et!,w_128,h_128,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F30589b07-e0a0-4de5-8997-78db1ed3f65b_1290x1290.png
    url: 'https://substack.com/home/post/p-188827303'
date_extracted: '2026-03-21'
last_accessed: null
access_count: 0
indexed: false
embedded: false
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
---
'Pick up the red block' sounds more expressive than running 'pick_red' preprogrammed task, but the boundary of what the model actually understands is opaque in a way that a fixed command vocabulary is not. The author proved this with counterfactual experiments: equivalent prompts produce similar actions (good), but spatial primitives ('up', 'away', 'stop') are unreliable because the model learned them as scene descriptions, not workspace commands. This is Karpathy's 'apps should become APIs' in reverse — sometimes explicit, constrained APIs are safer than flexible natural language. The tradeoff is expressivity vs predictability.
