---
id: INS-260321-D370
domain: ai-development
topic: ai-automation
title: VLAs fail silently while classical robotics fails loudly
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - robotics
  - vla
  - safety
  - failure-modes
  - end-to-end
  - debugging
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
    Classical robotics systems fail loudly (joint limit hit, object not
    detected, planner infeasible). VLAs fail silently — producing
    plausible-looking but wrong trajectories with no mechanism to detect
    out-of-distribution inputs.
  standard: >-
    End-to-end training eliminates the explicit interfaces that make failure
    detection possible. In classical robotics, you can unit-test each stage:
    calibrate cameras → verify detection overlay → check actuators. With VLAs,
    camera extrinsics and joint parameters aren't isolated — the network learns
    spatial transforms end-to-end. The failure boundary is defined implicitly by
    the training distribution, not explicitly by an engineer. You can't issue
    recovery commands ('stop', 'move away') and expect them to override the
    trained behavioral prior. This is the same 'jaggedness' problem Tao
    describes for math AI — VLAs are either on-rails or producing confident
    nonsense.
related:
  - INS-260321-2482
  - INS-260321-B8E8
  - PRI-260321-7307
  - INS-260321-E2FC
  - INS-260321-1A0B
  - INS-260320-76E7
  - INS-260321-1F9F
  - INS-260322-A8F2
---
End-to-end training eliminates the explicit interfaces that make failure detection possible. In classical robotics, you can unit-test each stage: calibrate cameras → verify detection overlay → check actuators. With VLAs, camera extrinsics and joint parameters aren't isolated — the network learns spatial transforms end-to-end. The failure boundary is defined implicitly by the training distribution, not explicitly by an engineer. You can't issue recovery commands ('stop', 'move away') and expect them to override the trained behavioral prior. This is the same 'jaggedness' problem Tao describes for math AI — VLAs are either on-rails or producing confident nonsense.
