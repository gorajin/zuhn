---
id: PRI-260320-07A4
domain: ai-development
title: "Externalize context to survive AI amnesia"
summary: "AI agents lose context through compaction, session boundaries, and conversation drift — persist state as structured files on disk."
confidence: high
supporting_insights:
  - INS-260320-04A2
  - INS-260320-8F12
  - INS-260320-0127
  - INS-260320-06EF
  - INS-260320-2DDE
supporting_count: 5
tags:
  - context-persistence
  - dev-docs
  - compaction
  - state-management
date_created: "2026-03-20"
last_reviewed: "2026-03-20"
resolutions:
  one_line: "What lives only in the context window will be forgotten — persist state to disk as structured files."
  standard: |
    AI agents have a structural memory problem: context compaction discards
    details, sessions end, and long conversations drift. Five insights converge
    on a single solution — externalize state to disk as structured files that
    survive these boundaries.

    The dev-docs pattern (INS-260320-04A2) creates three files for every large
    task: plan.md (what to build), context.md (decisions and constraints), and
    tasks.md (current progress). These are written with /dev-docs after planning
    (INS-260320-8F12) and updated before compaction events (INS-260320-0127).
    Because dev docs are files on disk, they survive auto-compaction and session
    resets — saying "continue" in a new session picks up exactly where the
    previous one left off (INS-260320-06EF).

    For larger codebases, multiple documentation levels (architectural overview,
    service docs, API references) give the AI a navigation map that would
    otherwise be lost (INS-260320-2DDE).

    The underlying principle: treat AI context like volatile memory. Anything
    not written to persistent storage will eventually be lost. The disk is the
    only reliable memory an AI agent has.
embedded: true
embedding_model: "nomic-embed-text"
---

AI agents have a structural memory problem: context compaction discards
details, sessions end, and long conversations drift. Five insights converge
on a single solution — externalize state to disk as structured files that
survive these boundaries.

The dev-docs pattern creates three files for every large task: plan.md (what
to build), context.md (decisions and constraints), and tasks.md (current
progress). These are written after planning and updated before compaction
events. Because dev docs are files on disk, they survive auto-compaction and
session resets — saying "continue" in a new session picks up exactly where
the previous one left off.

For larger codebases, multiple documentation levels (architectural overview,
service docs, API references) give the AI a navigation map that would
otherwise be lost.

The underlying principle: treat AI context like volatile memory. Anything
not written to persistent storage will eventually be lost. The disk is the
only reliable memory an AI agent has.
