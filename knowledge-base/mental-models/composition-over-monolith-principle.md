---
id: MM-260320-8AAB
title: "The Composition Over Monolith Principle"
core_statement: "Complex systems that work are invariably built from simple units with clear interfaces. Monolithic systems that try to do everything inevitably become unreliable, undebuggable, and irreplaceable."
domains: [ai-development, automation]
supporting_principles:
  - PRI-260320-D5B7
  - PRI-260320-BC72
  - PRI-260320-6847
supporting_count: 3
confidence: very_high
transferable: true
date_created: "2026-03-20"
last_reviewed: "2026-03-20"
resolutions:
  one_line: "Build from small, focused units with clear interfaces — complexity emerges from composition, not from individual components."
  standard: |
    Three principles across AI development and automation reveal that
    the most effective systems are composed of simple, specialized units
    connected through well-defined interfaces.

    In AI agent design (PRI-260320-D5B7): build agents with single
    responsibilities, slash commands for repeated patterns, utility
    scripts attached to skills. Give each agent a specific role and
    clear instructions on what to RETURN. Have Claude review its own
    code via a SEPARATE review agent. Skills handle patterns; CLAUDE.md
    handles project context. Separation of concerns at every level.

    In automation pipelines (PRI-260320-BC72): chain scraper → analyst
    → formatter. Each agent does one job. Benefits: debuggable (you
    know which stage broke), swappable (replace one model without
    touching others), shareable (export as JSON templates). The Unix
    philosophy applied to AI: do one thing well, compose through
    standard interfaces.

    In prompt optimization (PRI-260320-6847): let the model rewrite
    prompts in its own language. This is composition applied to the
    human-AI interface — separate the INTENT (what you want) from the
    EXPRESSION (how the model processes it). The human composes the
    intent; the model composes the expression.

    Gyeol itself is built this way: each script does one thing
    (reindex, health, embed, learn, mindmap). The post-ingest
    pipeline composes them in sequence. Each can run independently,
    be tested independently, and fail independently without
    cascading.

    The model transfers:
    - Software: microservices over monoliths, functions over god-objects
    - Organizations: small autonomous teams over large hierarchies
    - Writing: short focused chapters over sprawling narratives
    - Learning: spaced discrete concepts over marathon cramming
    - Music: layered tracks mixed together over live one-take recordings

    The anti-pattern to watch for: "just add it to the existing thing."
    When a component starts doing two jobs, that's the moment to split.
    The cost of splitting is linear; the cost of untangling a monolith
    is exponential.
---

Three principles across AI development and automation reveal that the most
effective systems are composed of simple, specialized units connected through
well-defined interfaces.

**In AI agent design:** Build agents with single responsibilities, slash
commands for repeated patterns, utility scripts attached to skills. Give each
agent a specific role and clear instructions on what to RETURN. Have Claude
review its own code via a SEPARATE review agent. Skills handle patterns;
CLAUDE.md handles project context. Separation of concerns at every level.

**In automation pipelines:** Chain scraper → analyst → formatter. Each agent
does one job. Benefits: debuggable (you know which stage broke), swappable
(replace one model without touching others), shareable (export as JSON
templates). The Unix philosophy applied to AI: do one thing well, compose
through standard interfaces.

**In prompt optimization:** Let the model rewrite prompts in its own language.
This is composition applied to the human-AI interface — separate the INTENT
(what you want) from the EXPRESSION (how the model processes it).

**In Gyeol itself:** Each script does one thing (reindex, health, embed, learn,
mindmap). The post-ingest pipeline composes them in sequence. Each can run
independently, be tested independently, and fail independently without
cascading.

**Transferable applications:**
- Software: microservices over monoliths, functions over god-objects
- Organizations: small autonomous teams over large hierarchies
- Writing: short focused chapters over sprawling narratives
- Learning: spaced discrete concepts over marathon cramming

**The anti-pattern to watch for:** "Just add it to the existing thing." When a
component starts doing two jobs, that's the moment to split. The cost of
splitting is linear; the cost of untangling a monolith is exponential.
