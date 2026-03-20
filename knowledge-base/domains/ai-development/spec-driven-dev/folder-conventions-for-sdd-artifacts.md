---
id: INS-260320-EA19
domain: ai-development
topic: spec-driven-dev
title: "Use folder conventions for spec-driven development artifacts"
actionability: immediate
confidence: medium
shelf_life: evergreen
status: active
tags: [spec-driven-dev, folder-structure, conventions, organization]
sources:
  - type: reddit
    title: "Why we shifted to Spec-Driven Development"
    author: u/unknown
related: []
date_extracted: "2026-03-20"
last_accessed: null
access_count: 0
indexed: true
embedded: false
resolutions:
  one_line: "Use consistent folder conventions: project/story/task/ with requirements.md, instructions.md, research.md, plan.md, code.md, review.md, findings.md."
  standard: |
    Standardize spec artifact locations using a hierarchical folder structure:
    project/story/task/ containing predictable filenames — requirements.md,
    instructions.md, research.md, plan.md, code.md, review.md, findings.md.
    This convention means agents and engineers always know where to find and
    where to write specs without configuration. The hierarchy (project > story
    > task) maps naturally to how work is decomposed, and the fixed filenames
    eliminate ambiguity about what each document should contain.
---

Standardize spec artifact locations using a hierarchical folder structure:
project/story/task/ containing predictable filenames — requirements.md,
instructions.md, research.md, plan.md, code.md, review.md, findings.md.
This convention means agents and engineers always know where to find and
where to write specs without configuration. The hierarchy (project > story
> task) maps naturally to how work is decomposed, and the fixed filenames
eliminate ambiguity about what each document should contain.
