---
id: INS-260321-E2FC
domain: ai-development
topic: claude-code
title: Signal your interaction mode explicitly — automation augmentation or agency
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - prompting
  - interaction-modes
  - delegation
  - ai-fluency
sources:
  - type: blog
    title: Prompt Engineering Guide Resources 2026 — The AI Corner
    author: Ruben Dominguez
    url: 'https://www.the-ai-corner.com/p/prompt-engineering-guide-resources-2026'
date_extracted: '2026-03-21'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Most prompting failures stem from mode mismatch — you intend augmentation
    (think together) but signal automation (just execute), or vice versa.
    Explicitly state which mode you want.
  standard: >-
    Three interaction modes: Automation (you instruct, model executes — best for
    well-defined tasks), Augmentation (you and the model think together
    iteratively — best for complex problems), Agency (you delegate goals, model
    determines approach — requires clear success criteria). 'Help me write a
    blog post about pricing' is ambiguous — it could mean brainstorm together
    (augmentation), write the complete post (automation), or
    research-outline-draft-edit (agency). Mode mismatch is the #1 cause of
    disappointing AI output. Explicit delegation signals prevent oscillation
    between hesitation and overreach.
related:
  - INS-260320-10E8
  - INS-260321-2482
  - INS-260321-D370
  - INS-260321-A56C
  - INS-260322-38D8
  - INS-260321-A5D4
  - INS-260322-A8F2
---
Three interaction modes: Automation (you instruct, model executes — best for well-defined tasks), Augmentation (you and the model think together iteratively — best for complex problems), Agency (you delegate goals, model determines approach — requires clear success criteria). 'Help me write a blog post about pricing' is ambiguous — it could mean brainstorm together (augmentation), write the complete post (automation), or research-outline-draft-edit (agency). Mode mismatch is the #1 cause of disappointing AI output. Explicit delegation signals prevent oscillation between hesitation and overreach.
