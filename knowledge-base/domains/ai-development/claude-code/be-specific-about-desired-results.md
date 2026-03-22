---
id: INS-260320-E872
domain: ai-development
topic: claude-code
title: Be as specific as possible about desired results in prompts
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - prompting
  - specificity
  - best-practices
sources:
  - type: reddit
    title: Claude Code is a Beast – Tips from 6 Months of Hardcore Use
    author: u/diet103
    url: 'https://reddit.com/r/ClaudeCode'
related:
  - INS-260321-A5D4
  - INS-260320-4993
  - INS-260321-82FE
  - PRI-260320-8205
  - INS-260321-703F
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Be as specific as possible about desired results — vague prompts produce
    vague implementations.
  standard: |
    Specificity in prompts directly correlates with output quality. Instead
    of saying "add error handling," say "add try-catch blocks to all database
    calls in the UserService, log errors with the service name and operation,
    and return a typed ErrorResponse." Vague prompts give Claude too much
    room to make assumptions, and those assumptions are often wrong. Specific
    prompts constrain the solution space and produce implementations that
    match your expectations on the first attempt. This is especially critical
    for architectural decisions where Claude's defaults may not match your
    project's patterns.
---

Specificity in prompts directly correlates with output quality. Instead
of saying "add error handling," say "add try-catch blocks to all database
calls in the UserService, log errors with the service name and operation,
and return a typed ErrorResponse." Vague prompts give Claude too much
room to make assumptions, and those assumptions are often wrong. Specific
prompts constrain the solution space and produce implementations that
match your expectations on the first attempt. This is especially critical
for architectural decisions where Claude's defaults may not match your
project's patterns.
