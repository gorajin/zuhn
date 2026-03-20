# My Knowledge Map

## ai-development

### agent-patterns
- Have Claude review its own code via a specialized review agent — catches critical errors, missing implementations, and security flaws.
- Give agents very specific roles and clear instructions on what to RETURN — prevents 'I fixed it!' without details.

### claude-code
- Planning is king — always use planning mode before implementation; never let the builder start without plans.
- Attach ready-to-use utility scripts to skills so Claude references proven tools instead of reinventing test scripts from scratch.
- Bash commands (grep, find) bypass Read() deny rules — they scan everything including node_modules even with deny rules configured.
- Be as specific as possible about desired results — vague prompts produce vague implementations.
- A Stop hook reads the file edit logs, runs builds on affected repos, and catches TypeScript errors — showing small errors to Claude or recommending an auto-resolver agent for larger ones.
- Use a central skill-rules.json config mapping each skill to keywords, regex intent patterns, file path triggers, and content triggers.
- 85,000 out of 100,000 context tokens were consumed by dependency code — one bash validation hook saved 85% of the context window.
- Dev docs persist on disk and survive auto-compaction — just say 'continue' in a new session to pick up where you left off.
- Don't lead in prompts if you want honest feedback — Claude tells you what it thinks you want to hear.
- A Stop hook detects risky patterns (try-catch, async, DB calls) in edited files and shows gentle non-blocking self-check reminders.
- A PostToolUse hook tracks which files were edited, which repo they belong to, and timestamps — feeding downstream hooks like the build checker.
- The full hook pipeline runs in sequence: Claude responds, Prettier formats code, build checker catches errors, error reminder does a self-check — zero errors left behind.
- Claude won't reliably use skills on its own — build a hook system to inject skill reminders automatically.
- Maintain multiple documentation levels — broad architectural overview, specific service docs, API references — to help Claude navigate large codebases.
- Start with planning mode to create the plan, review it, then run /dev-docs to generate the three dev doc files.
- A 5-line pre-execution bash hook checks commands against BLOCKED patterns (node_modules, .env, __pycache__, .git/, dist/, build/) and blocks 99% of token waste.
- Re-prompt often using double-esc to recall previous prompts — you get better results armed with knowledge of what you DON'T want.
- Take time to review the plan thoroughly — you'd be surprised how often you catch silly mistakes before implementation.
- If output quality seems worse, self-reflect on how you're prompting before blaming the model.
- Keep SKILL.md files under 500 lines and use progressive disclosure via resource files for 40-60% token efficiency improvement.
- Skills handle 'how to write code' guidelines while CLAUDE.md handles 'how this specific project works' — keep them separate.
- Slash commands expand into full prompts — pack complex, multi-step instructions into simple reusable commands.
- If Claude struggles more than 30 minutes on something you could fix in 2 minutes, just step in and do it yourself.
- A Stop event hook analyzes edited files after Claude responds and shows gentle self-check reminders for error handling.
- Create three dev doc files (plan.md, context.md, tasks.md) for every large task to prevent Claude from losing the plot through compaction.
- Update dev docs regularly by running /update-dev-docs before context compaction to preserve current state.
- A UserPromptSubmit hook analyzes the prompt for keywords and intent, then injects skill reminders into context BEFORE Claude reads it.

### context-management
- Structure knowledge as a relational database (entities + relationships), not text blobs. Every Claude instance reads/writes the same structured knowledge base.
- Curated structured data enables REASONING about connections. Vector memory stores text blobs for retrieval. For business-ready context, structure wins.

### llm-costs
- OpenRouter offers 50-1000 free requests/day on certain models — not trial credits, actually free forever.
- Batch inputs to amortize system prompt costs — 100 separate calls with a 500-token system prompt = 50,000 wasted tokens. 1 batched call = 500 tokens.
- Six strategies combined took production systems from $300+/month to ~$10/month while processing 10x more data.
- Filter aggressively before hitting expensive models — filtering by upvotes/comments removes 80% of inputs, saving ~$5/week.
- Let AI rewrite your prompts in the model's own 'language' for 20-30% quality improvement using the meta-prompt technique.
- Don't default to expensive models — test cheaper ones with YOUR data. DeepSeek V3 vs Claude Sonnet = 21x cost reduction for identical summaries.
- Use cheap models (gpt-5-nano) for categorization/relevance scoring before expensive models — removes 70-90% of irrelevant inputs.
- Use OpenRouter for a unified dashboard, model switching, spending tracking, and hard budget limits across all LLM providers.

### spec-driven-dev
- Commit output specs to git so future agents and engineers see what was done, what failed, and what decisions were made.
- Use consistent folder conventions: project/story/task/ with requirements.md, instructions.md, research.md, plan.md, code.md, review.md, findings.md.
- Keep spec templates simple — if too heavy, people skip them. Automate file creation and periodically revisit findings for tech debt.
- SDD cycle: input specs (PRD, tech brief, requirements) and output specs (research logs, code notes, findings) are both first-class artifacts.
- New engineers hit the ground running with clear specs defining both what to build and what has already been done.
- Research logs and findings surface 'already solved' patterns, preventing teams and agents from reinventing solutions.

### tooling
- Use BetterTouchTool for double-tap hotkeys (CMD+CMD = Claude, OPT+OPT = Browser) and relative URL copy from Cursor.
- PM2 gives you auto-restart on crashes, per-service logs, memory/CPU monitoring, and easy management like `pm2 restart email`.
- Run all backend microservices via PM2 so Claude can read individual service logs in real-time without manual copy-pasting.
- Use SuperWhisper for voice-to-text prompting when your hands are tired from typing all day.

## automation

### n8n-workflows
- Full pipeline: search query to scrape 100+ profiles, extract data, pull company info, AI-generate personalized opener, export to Google Sheets.
- Safety-first scraping: decouple your personal account from the scraping tool. If the tool gets flagged, your account is unaffected.
- Use Linkfinder AI as a proxy for LinkedIn scraping — no direct LinkedIn API connection means zero ban risk for your personal account.
