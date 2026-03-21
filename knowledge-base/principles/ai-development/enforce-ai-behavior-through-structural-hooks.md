---
id: PRI-260320-C14C
domain: ai-development
title: "Enforce AI behavior through structural hooks, not documentation"
summary: "Claude ignores documentation, skills, and best practices unless hooks structurally force compliance at every interaction."
confidence: high
supporting_insights:
  - INS-260320-F8FD
  - INS-260320-DCA0
  - INS-260320-69CD
  - INS-260320-8DBD
  - INS-260320-4DE2
  - INS-260320-0D43
  - INS-260320-4ED6
  - INS-260320-7379
  - INS-260320-949A
supporting_count: 9
tags:
  - enforcement
  - hooks
  - compliance
  - ai-behavior
date_created: "2026-03-20"
last_reviewed: "2026-03-20"
resolutions:
  one_line: "Hooks enforce what docs suggest — structural enforcement is the only reliable path to consistent AI behavior."
  standard: |
    Across 9 independent insights from months of Claude Code usage, one pattern
    is unambiguous: documentation alone does not change AI behavior. Claude will
    forget skills, ignore CLAUDE.md guidelines, skip error checks, and scan
    forbidden directories — unless a hook intercepts the action and enforces the
    rule structurally.

    The evidence spans every hook type: UserPromptSubmit hooks inject skill
    reminders before Claude reads the prompt (INS-260320-DCA0). Stop hooks run
    builds, check for risky patterns, and show self-check reminders after Claude
    responds (INS-260320-4DE2, INS-260320-69CD, INS-260320-7379). PostToolUse
    hooks track file edits to feed downstream enforcement (INS-260320-0D43).
    Pre-execution bash hooks block wasteful commands before they run
    (INS-260320-949A). A central skill-rules.json config maps triggers to
    actions (INS-260320-8DBD).

    The full pipeline runs in sequence — format, build-check, error-remind —
    leaving zero errors behind (INS-260320-4ED6). This is not about distrust;
    it is about designing systems that work reliably regardless of model
    attention or context window state.

    Principle: if a behavior matters, encode it as a hook. If it is merely
    documented, treat it as aspirational.
embedded: true
embedding_model: "nomic-embed-text"
---

Across 9 independent insights from months of Claude Code usage, one pattern
is unambiguous: documentation alone does not change AI behavior. Claude will
forget skills, ignore CLAUDE.md guidelines, skip error checks, and scan
forbidden directories — unless a hook intercepts the action and enforces the
rule structurally.

The evidence spans every hook type: UserPromptSubmit hooks inject skill
reminders before Claude reads the prompt. Stop hooks run builds, check for
risky patterns, and show self-check reminders after Claude responds.
PostToolUse hooks track file edits to feed downstream enforcement.
Pre-execution bash hooks block wasteful commands before they run. A central
skill-rules.json config maps triggers to actions.

The full pipeline runs in sequence — format, build-check, error-remind —
leaving zero errors behind. This is not about distrust; it is about designing
systems that work reliably regardless of model attention or context window
state.

Principle: if a behavior matters, encode it as a hook. If it is merely
documented, treat it as aspirational.
