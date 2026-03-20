---
id: SRC-260320-F619
type: reddit
title: "Claude Code usage limit hack"
author: u/PaschalisDim
url: "https://reddit.com/r/ClaudeAI"
subreddit: r/ClaudeAI
date_ingested: "2026-03-20"
insight_count: 3
---

Reveals that bash commands (grep, find) bypass Claude Code's Read() deny rules,
scanning everything including node_modules. Shows a pre-execution bash validation
hook that blocks 99% of token waste by checking commands against blocked patterns.
Reports 85,000 of 100,000 context tokens were consumed by dependency code before
the fix.
