---
id: INS-260321-AD95
domain: ai-development
topic: system-building
title: Debugging end-to-end models requires inventing new probe methods
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - debugging
  - end-to-end
  - probe-methods
  - interpretability
  - engineering
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
    Since VLAs eliminate the interfaces needed for classical debugging, you must
    invent new probe methods: attention visualization, camera ablations,
    counterfactual prompting, and primitive action tests.
  standard: >-
    The author develops four debugging techniques for opaque end-to-end models:
    (1) Visualize attention on tokens to check if vision looks at the right
    object. (2) Camera ablations — move or remove cameras to test if vision does
    object detection or spatial template matching. (3) Counterfactual prompting
    — try semantically equivalent prompts ('red block' vs 'red cube') to test
    robustness. (4) Primitive action prompts — test if 'don't move' produces
    motion to reveal training distribution bias. These surface-level probes
    can't fully decompose failures ('is this vision or control?') but they
    identify structural behaviors. This is a transferable methodology for
    debugging any end-to-end system.
---
The author develops four debugging techniques for opaque end-to-end models: (1) Visualize attention on tokens to check if vision looks at the right object. (2) Camera ablations — move or remove cameras to test if vision does object detection or spatial template matching. (3) Counterfactual prompting — try semantically equivalent prompts ('red block' vs 'red cube') to test robustness. (4) Primitive action prompts — test if 'don't move' produces motion to reveal training distribution bias. These surface-level probes can't fully decompose failures ('is this vision or control?') but they identify structural behaviors. This is a transferable methodology for debugging any end-to-end system.
