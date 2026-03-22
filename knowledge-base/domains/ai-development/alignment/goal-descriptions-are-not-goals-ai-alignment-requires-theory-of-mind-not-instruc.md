---
id: INS-260322-A208
domain: ai-development
topic: alignment
title: >-
  Goal descriptions are not goals — AI alignment requires theory of mind not
  instruction following
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - alignment
  - theory-of-mind
  - goal-inference
  - instruction-following
sources:
  - type: youtube
    title: >-
      Emmett Shear on Building AI That Actually Cares: Beyond Control and
      Steering
    author: a16z
    url: 'https://youtu.be/Ua8nPJ1_yk8'
date_extracted: '2026-03-22'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    When you tell an AI to do something, you give it a description of a goal,
    not the goal itself — the AI must infer the actual goal, which requires
    theory of mind humans take for granted.
  standard: >-
    Shear draws a critical distinction: when you instruct an AI, you transmit a
    byte string or audio vibrations — a description of a goal — not the goal
    itself. The AI must then infer what goal that description corresponds to,
    which is a fundamentally different task from instruction-following. Humans
    are so fast at this inference (turning descriptions into goals) that we
    don't even notice it happening, which causes us to confuse the two.


    The classic 'robot puts the baby in the trash while cleaning the room'
    example isn't a values problem — it's a goal inference failure. The robot
    failed to infer the correct goal states from the description. This maps to
    the OODA loop: bad at observing/orienting, bad at deciding, or bad at acting
    are three distinct failure modes. Technical alignment therefore requires:
    (1) theory of mind to infer what goal a description corresponds to, (2)
    theory of the world to determine what actions serve that goal, and (3) skill
    at balancing competing goals. Current AI systems are worse at technical
    alignment than at value alignment — we're better at guessing what to tell AI
    to do than AI is at doing what we tell it.
related:
  - INS-260320-E872
  - INS-260320-9118
  - INS-260320-5F14
  - PRI-260320-D2E1
  - INS-260321-E9B7
  - INS-260321-167A
  - INS-260321-28FB
  - INS-260322-EE1B
  - INS-260321-F864
  - INS-260321-C99A
---
Shear draws a critical distinction: when you instruct an AI, you transmit a byte string or audio vibrations — a description of a goal — not the goal itself. The AI must then infer what goal that description corresponds to, which is a fundamentally different task from instruction-following. Humans are so fast at this inference (turning descriptions into goals) that we don't even notice it happening, which causes us to confuse the two.

The classic 'robot puts the baby in the trash while cleaning the room' example isn't a values problem — it's a goal inference failure. The robot failed to infer the correct goal states from the description. This maps to the OODA loop: bad at observing/orienting, bad at deciding, or bad at acting are three distinct failure modes. Technical alignment therefore requires: (1) theory of mind to infer what goal a description corresponds to, (2) theory of the world to determine what actions serve that goal, and (3) skill at balancing competing goals. Current AI systems are worse at technical alignment than at value alignment — we're better at guessing what to tell AI to do than AI is at doing what we tell it.
