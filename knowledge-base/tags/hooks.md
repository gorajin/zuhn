# Tag: hooks

- `INS-260320-4DE2` A Stop hook reads the file edit logs, runs builds on affected repos, and catches TypeScript errors — showing small errors to Claude or recommending an auto-resolver agent for larger ones.
- `INS-260320-7379` A Stop hook detects risky patterns (try-catch, async, DB calls) in edited files and shows gentle non-blocking self-check reminders.
- `INS-260320-0D43` A PostToolUse hook tracks which files were edited, which repo they belong to, and timestamps — feeding downstream hooks like the build checker.
- `INS-260320-4ED6` The full hook pipeline runs in sequence: Claude responds, Prettier formats code, build checker catches errors, error reminder does a self-check — zero errors left behind.
- `INS-260320-F8FD` Claude won't reliably use skills on its own — build a hook system to inject skill reminders automatically.
- `INS-260320-949A` A 5-line pre-execution bash hook checks commands against BLOCKED patterns (node_modules, .env, __pycache__, .git/, dist/, build/) and blocks 99% of token waste.
- `INS-260320-69CD` A Stop event hook analyzes edited files after Claude responds and shows gentle self-check reminders for error handling.
- `INS-260320-DCA0` A UserPromptSubmit hook analyzes the prompt for keywords and intent, then injects skill reminders into context BEFORE Claude reads it.
