# Topic: claude-code

> 27 insights

- `INS-260320-93E1` [high] Planning is king — always use planning mode before implementation; never let the builder start without plans.
- `INS-260320-A4BF` [high] Attach ready-to-use utility scripts to skills so Claude references proven tools instead of reinventing test scripts from scratch.
- `INS-260320-DDFE` [high] Bash commands (grep, find) bypass Read() deny rules — they scan everything including node_modules even with deny rules configured.
- `INS-260320-E872` [high] Be as specific as possible about desired results — vague prompts produce vague implementations.
- `INS-260320-4DE2` [high] A Stop hook reads the file edit logs, runs builds on affected repos, and catches TypeScript errors — showing small errors to Claude or recommending an auto-resolver agent for larger ones.
- `INS-260320-8DBD` [high] Use a central skill-rules.json config mapping each skill to keywords, regex intent patterns, file path triggers, and content triggers.
- `INS-260320-CE36` [high] 85,000 out of 100,000 context tokens were consumed by dependency code — one bash validation hook saved 85% of the context window.
- `INS-260320-06EF` [high] Dev docs persist on disk and survive auto-compaction — just say 'continue' in a new session to pick up where you left off.
- `INS-260320-508F` [high] Don't lead in prompts if you want honest feedback — Claude tells you what it thinks you want to hear.
- `INS-260320-7379` [high] A Stop hook detects risky patterns (try-catch, async, DB calls) in edited files and shows gentle non-blocking self-check reminders.
- `INS-260320-0D43` [high] A PostToolUse hook tracks which files were edited, which repo they belong to, and timestamps — feeding downstream hooks like the build checker.
- `INS-260320-4ED6` [high] The full hook pipeline runs in sequence: Claude responds, Prettier formats code, build checker catches errors, error reminder does a self-check — zero errors left behind.
- `INS-260320-F8FD` [high] Claude won't reliably use skills on its own — build a hook system to inject skill reminders automatically.
- `INS-260320-2DDE` [high] Maintain multiple documentation levels — broad architectural overview, specific service docs, API references — to help Claude navigate large codebases.
- `INS-260320-8F12` [high] Start with planning mode to create the plan, review it, then run /dev-docs to generate the three dev doc files.
- `INS-260320-949A` [high] A 5-line pre-execution bash hook checks commands against BLOCKED patterns (node_modules, .env, __pycache__, .git/, dist/, build/) and blocks 99% of token waste.
- `INS-260320-4993` [high] Re-prompt often using double-esc to recall previous prompts — you get better results armed with knowledge of what you DON'T want.
- `INS-260320-6CCE` [high] Take time to review the plan thoroughly — you'd be surprised how often you catch silly mistakes before implementation.
- `INS-260320-96C9` [high] If output quality seems worse, self-reflect on how you're prompting before blaming the model.
- `INS-260320-B210` [high] Keep SKILL.md files under 500 lines and use progressive disclosure via resource files for 40-60% token efficiency improvement.
- `INS-260320-F872` [high] Skills handle 'how to write code' guidelines while CLAUDE.md handles 'how this specific project works' — keep them separate.
- `INS-260320-DC3C` [high] Slash commands expand into full prompts — pack complex, multi-step instructions into simple reusable commands.
- `INS-260320-47DC` [high] If Claude struggles more than 30 minutes on something you could fix in 2 minutes, just step in and do it yourself.
- `INS-260320-69CD` [high] A Stop event hook analyzes edited files after Claude responds and shows gentle self-check reminders for error handling.
- `INS-260320-04A2` [high] Create three dev doc files (plan.md, context.md, tasks.md) for every large task to prevent Claude from losing the plot through compaction.
- `INS-260320-0127` [high] Update dev docs regularly by running /update-dev-docs before context compaction to preserve current state.
- `INS-260320-DCA0` [high] A UserPromptSubmit hook analyzes the prompt for keywords and intent, then injects skill reminders into context BEFORE Claude reads it.
