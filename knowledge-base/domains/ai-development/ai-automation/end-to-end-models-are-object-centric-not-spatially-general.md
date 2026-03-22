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
related:
  - INS-260321-82FE
  - INS-260321-D370
  - INS-260321-9906
  - INS-260321-8567
  - PRI-260320-6847
---
Through systematic experiments, the author proves that sub-1B parameter VLAs approximate 'move toward salient object and grasp' regardless of the prompt. 'Don't move' produces as much motion as 'pick up block'. 'Move away from block' produces motion toward the block. 'Move toward base' works only because the base is a visually grounded object. The model has no understanding of 'up/down/left/right' as spatial primitives — these words describe scene composition in VLM training data, not robot workspace directions. Natural language commands are most reliable when they closely match the training distribution, severely narrowing 'zero-shot generalization.'
