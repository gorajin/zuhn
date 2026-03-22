---
id: PRI-260321-D74F
domain: ai-development
title: >-
  Externalize working memory as dev docs — context windows are volatile, disk is
  permanent
summary: >-
  Every large task needs three persistent files: plan.md (what to build),
  context.md (current state), and tasks.md (what's left). These survive
  auto-compaction, session boundaries, and context bloat. Update them before
  compaction. Combined with about-me.md, my-rules.md, and my-templates.md for
  personal context, these files transform Claude from a stateless token
  generator into a teammate with memory. The principle extends to skills vs
  CLAUDE.md: skills encode HOW to write code, CLAUDE.md encodes HOW THIS PROJECT
  works.
confidence: very_high
supporting_insights:
  - INS-260320-04A2
  - INS-260320-06EF
  - INS-260320-0127
  - INS-260321-0C99
  - INS-260320-F872
  - INS-260320-2DDE
  - INS-260321-E9B7
  - INS-260320-8F12
supporting_count: 8
tags:
  - dev-docs
  - context-persistence
  - working-memory
  - session-continuity
  - skills
date_created: '2026-03-21'
last_reviewed: '2026-03-21'
resolutions:
  one_line: >-
    Externalize working memory as dev docs — context windows are volatile, disk
    is permanent
  standard: >-
    Every large task needs three persistent files: plan.md (what to build),
    context.md (current state), and tasks.md (what's left). These survive
    auto-compaction, session boundaries, and context bloat. Update them before
    compaction. Combined with about-me.md, my-rules.md, and my-templates.md for
    personal context, these files transform Claude from a stateless token
    generator into a teammate with memory. The principle extends to skills vs
    CLAUDE.md: skills encode HOW to write code, CLAUDE.md encodes HOW THIS
    PROJECT works.
embedded: true
embedding_model: "nomic-embed-text"
---
Every large task needs three persistent files: plan.md (what to build), context.md (current state), and tasks.md (what's left). These survive auto-compaction, session boundaries, and context bloat. Update them before compaction. Combined with about-me.md, my-rules.md, and my-templates.md for personal context, these files transform Claude from a stateless token generator into a teammate with memory. The principle extends to skills vs CLAUDE.md: skills encode HOW to write code, CLAUDE.md encodes HOW THIS PROJECT works.
