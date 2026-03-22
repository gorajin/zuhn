---
id: INS-260321-B8E8
domain: ai-development
topic: ai-automation
title: End-to-end models are object-centric not spatially general
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - robotics
  - vla
  - spatial-understanding
  - training-distribution
  - generalization
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
    VLA models have no spatial primitive vocabulary — 'move up', 'move back',
    'don't move' all produce similar grasping motions. Spatial commands only
    work when reducible to 'move toward visible object.'
  standard: >-
    Through systematic experiments, the author proves that sub-1B parameter VLAs
    approximate 'move toward salient object and grasp' regardless of the prompt.
    'Don't move' produces as much motion as 'pick up block'. 'Move away from
    block' produces motion toward the block. 'Move toward base' works only
    because the base is a visually grounded object. The model has no
    understanding of 'up/down/left/right' as spatial primitives — these words
    describe scene composition in VLM training data, not robot workspace
    directions. Natural language commands are most reliable when they closely
    match the training distribution, severely narrowing 'zero-shot
    generalization.'
---
Through systematic experiments, the author proves that sub-1B parameter VLAs approximate 'move toward salient object and grasp' regardless of the prompt. 'Don't move' produces as much motion as 'pick up block'. 'Move away from block' produces motion toward the block. 'Move toward base' works only because the base is a visually grounded object. The model has no understanding of 'up/down/left/right' as spatial primitives — these words describe scene composition in VLM training data, not robot workspace directions. Natural language commands are most reliable when they closely match the training distribution, severely narrowing 'zero-shot generalization.'
