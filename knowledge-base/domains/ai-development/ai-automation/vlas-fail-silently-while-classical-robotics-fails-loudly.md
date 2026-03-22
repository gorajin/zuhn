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
---
End-to-end training eliminates the explicit interfaces that make failure detection possible. In classical robotics, you can unit-test each stage: calibrate cameras → verify detection overlay → check actuators. With VLAs, camera extrinsics and joint parameters aren't isolated — the network learns spatial transforms end-to-end. The failure boundary is defined implicitly by the training distribution, not explicitly by an engineer. You can't issue recovery commands ('stop', 'move away') and expect them to override the trained behavioral prior. This is the same 'jaggedness' problem Tao describes for math AI — VLAs are either on-rails or producing confident nonsense.
