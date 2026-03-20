---
id: PRI-260320-467A
domain: ai-development
title: "Make specifications first-class, versioned artifacts"
summary: "Both input specs (what to build) and output specs (what happened) should be committed to git as first-class artifacts — this creates traceable, reusable institutional memory."
confidence: high
supporting_insights:
  - INS-260320-6F8E
  - INS-260320-4A82
  - INS-260320-EA19
  - INS-260320-4BA8
  - INS-260320-D4BD
  - INS-260320-7914
supporting_count: 6
tags:
  - spec-driven-dev
  - documentation
  - git
  - institutional-memory
date_created: "2026-03-20"
last_reviewed: "2026-03-20"
resolutions:
  one_line: "Commit both input specs and output specs to git — versioned specifications are the institutional memory that survives team turnover and agent sessions."
  standard: |
    Six insights from teams practicing Spec-Driven Development reveal that
    specifications become genuinely powerful only when treated as first-class,
    version-controlled artifacts.

    The SDD cycle produces two kinds of specs (INS-260320-6F8E): input specs
    (PRD, tech brief, requirements) define what to build, and output specs
    (research logs, code notes, findings) document what happened. Both are
    committed to git (INS-260320-4A82) using consistent folder conventions
    (INS-260320-EA19) like project/story/task/ with standardized filenames.

    The payoff is institutional memory that compounds over time. New engineers
    hit the ground running because specs define both what to build and what has
    already been done (INS-260320-D4BD). Research logs and findings surface
    "already solved" patterns, preventing teams and agents from reinventing
    solutions (INS-260320-7914).

    The practical constraint: templates must be simple enough that people
    actually use them. If too heavy, people skip them. Automate file creation
    and periodically revisit findings for tech debt (INS-260320-4BA8).

    The principle: specifications are not overhead — they are the primary
    artifact of knowledge work. Code is the second artifact. Treat specs with
    the same rigor as code: version them, review them, and maintain them.
---

Six insights from teams practicing Spec-Driven Development reveal that
specifications become genuinely powerful only when treated as first-class,
version-controlled artifacts.

The SDD cycle produces two kinds of specs: input specs (PRD, tech brief,
requirements) define what to build, and output specs (research logs, code
notes, findings) document what happened. Both are committed to git using
consistent folder conventions like project/story/task/ with standardized
filenames.

The payoff is institutional memory that compounds over time. New engineers
hit the ground running because specs define both what to build and what has
already been done. Research logs and findings surface "already solved"
patterns, preventing teams and agents from reinventing solutions.

The practical constraint: templates must be simple enough that people
actually use them. If too heavy, people skip them. Automate file creation
and periodically revisit findings for tech debt.

The principle: specifications are not overhead — they are the primary
artifact of knowledge work. Code is the second artifact. Treat specs with
the same rigor as code: version them, review them, and maintain them.
