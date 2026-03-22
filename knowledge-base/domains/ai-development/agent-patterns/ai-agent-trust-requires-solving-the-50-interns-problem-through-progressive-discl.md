---
id: INS-260321-8414
domain: ai-development
topic: agent-patterns
title: >-
  AI agent trust requires solving the 50-interns problem through progressive
  disclosure design
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - trust
  - ux
  - agents
  - human-in-loop
  - design
  - workflows
sources:
  - type: youtube
    title: 'Atlassian CEO on the SaaS Apocalypse, AI Agents & What Comes Next'
    author: a16z
    url: 'https://youtu.be/0lzo2tFBFy8'
date_extracted: '2026-03-21'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    The biggest barrier to enterprise AI agent adoption isn't model capability
    but trust UX — too many status updates and users say 'stop telling me crap,'
    too few and they say 'what is it doing?' — requiring progressive disclosure
    design patterns that don't yet exist.
  standard: >-
    Atlassian's experience deploying agents in Jira revealed a fundamental
    design paradox: when they gave users detailed step-by-step visibility into
    what the agent was doing, users complained about information overload. When
    they reduced visibility, users lost trust and demanded to know what was
    happening. This mirrors what Cannon-Brookes calls the '50 interns problem' —
    having 50 interns gets a lot of work done, but they also ask you 50
    questions per minute.


    The solution requires solving three layered design challenges: (1) Customer
    trust — how do you build progressive trust so the AI can start taking
    unsupervised actions? (2) Input design — how do you help users provide the
    right context without presenting 17 configuration toggles they don't
    understand? (3) Iteration design — especially in collaborative settings, how
    do you loop human judgment back into agent workflows without breaking flow?


    The key insight from real deployment is that this is primarily a design
    problem, not a model capability problem. Models are 'far ahead of the value
    they're delivering.' The gap is in UX patterns for human-agent collaboration
    — patterns that are roughly where mobile UX was before pull-to-refresh was
    invented. Whatever company solves these design patterns will unlock the
    trapped value in current model capabilities.
related:
  - INS-260321-2482
  - INS-260321-4E98
  - INS-260322-3D21
  - INS-260321-B7CB
  - INS-260321-1A0B
  - INS-260322-2D2F
  - INS-260322-BD0D
  - INS-260322-E4D8
---
Atlassian's experience deploying agents in Jira revealed a fundamental design paradox: when they gave users detailed step-by-step visibility into what the agent was doing, users complained about information overload. When they reduced visibility, users lost trust and demanded to know what was happening. This mirrors what Cannon-Brookes calls the '50 interns problem' — having 50 interns gets a lot of work done, but they also ask you 50 questions per minute.

The solution requires solving three layered design challenges: (1) Customer trust — how do you build progressive trust so the AI can start taking unsupervised actions? (2) Input design — how do you help users provide the right context without presenting 17 configuration toggles they don't understand? (3) Iteration design — especially in collaborative settings, how do you loop human judgment back into agent workflows without breaking flow?

The key insight from real deployment is that this is primarily a design problem, not a model capability problem. Models are 'far ahead of the value they're delivering.' The gap is in UX patterns for human-agent collaboration — patterns that are roughly where mobile UX was before pull-to-refresh was invented. Whatever company solves these design patterns will unlock the trapped value in current model capabilities.
