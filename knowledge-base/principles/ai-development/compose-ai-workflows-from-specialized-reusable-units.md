---
id: PRI-260320-D5B7
domain: ai-development
title: "Compose AI workflows from specialized, reusable units"
summary: "Build agents with single responsibilities, slash commands for repeated patterns, utility scripts attached to skills — composition over monoliths."
confidence: high
supporting_insights:
  - INS-260320-9D89
  - INS-260320-1B10
  - INS-260320-DC3C
  - INS-260320-A4BF
  - INS-260320-B210
  - INS-260320-F872
supporting_count: 6
tags:
  - composition
  - agents
  - reuse
  - modularity
date_created: "2026-03-20"
last_reviewed: "2026-03-20"
resolutions:
  one_line: "Build AI systems from small, specialized, reusable pieces — single-purpose agents, slash commands, and attached utility scripts."
  standard: |
    Six insights converge on the same software engineering principle applied to
    AI workflows: composition beats monoliths.

    At the agent level, give each agent a specific role and clear return
    instructions (INS-260320-9D89). A dedicated review agent catches critical
    errors, missing implementations, and security flaws that the building agent
    misses (INS-260320-1B10). Single-responsibility agents are easier to debug,
    cheaper to run, and produce more reliable output.

    At the command level, slash commands expand into full multi-step prompts —
    packing complex instructions into simple reusable commands (INS-260320-DC3C).
    Attach ready-to-use utility scripts to skills so Claude references proven
    tools instead of reinventing them (INS-260320-A4BF).

    At the architecture level, keep SKILL.md files under 500 lines using
    progressive disclosure via resource files for 40-60% token efficiency
    (INS-260320-B210). Skills handle "how to write code" while CLAUDE.md
    handles "how this project works" — clear separation of concerns
    (INS-260320-F872).

    The principle: AI workflows should be assembled from well-defined,
    independently testable components. Each piece does one thing well. The
    composition layer connects them. This makes the system debuggable,
    evolvable, and resilient to individual component failures.
---

Six insights converge on the same software engineering principle applied to
AI workflows: composition beats monoliths.

At the agent level, give each agent a specific role and clear return
instructions. A dedicated review agent catches critical errors, missing
implementations, and security flaws that the building agent misses.
Single-responsibility agents are easier to debug, cheaper to run, and
produce more reliable output.

At the command level, slash commands expand into full multi-step prompts —
packing complex instructions into simple reusable commands. Attach
ready-to-use utility scripts to skills so Claude references proven tools
instead of reinventing them.

At the architecture level, keep SKILL.md files under 500 lines using
progressive disclosure via resource files for token efficiency. Skills
handle "how to write code" while CLAUDE.md handles "how this project
works" — clear separation of concerns.

The principle: AI workflows should be assembled from well-defined,
independently testable components. Each piece does one thing well. The
composition layer connects them. This makes the system debuggable,
evolvable, and resilient to individual component failures.
