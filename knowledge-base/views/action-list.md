# Action List
Generated on 2026-03-21 | 86 actionable insights

## ai-development/agent-patterns
- [INS-260320-1B10] Have Claude review its own code via a specialized review agent — catches critical errors, missing implementations, and security flaws.
- [INS-260320-9D89] Give agents very specific roles and clear instructions on what to RETURN — prevents 'I fixed it!' without details.
- [INS-260321-D3BE] Stop thinking in lines of code — think in macro actions: 'agent 1 builds feature X, agent 2 researches Y, agent 3 plans Z' — then review their work.
- [INS-260321-18D0] Your bottleneck shifted from typing speed to token throughput — maximize how many agent sessions you can run in parallel, not how fast you code.

## ai-development/ai-automation
- [INS-260320-5A6F] AI-enabled beats AI-replaced — keep the human touch in important parts, automate the repetitive.
- [INS-260320-76E7] Only automate what you deeply understand — automating ignorance creates slot machines, not efficiency.

## ai-development/claude-code
- [INS-260320-93E1] Planning is king — always use planning mode before implementation; never let the builder start without plans.
- [INS-260320-A4BF] Attach ready-to-use utility scripts to skills so Claude references proven tools instead of reinventing test scripts from scratch.
- [INS-260320-DDFE] Bash commands (grep, find) bypass Read() deny rules — they scan everything including node_modules even with deny rules configured.
- [INS-260320-E872] Be as specific as possible about desired results — vague prompts produce vague implementations.
- [INS-260320-4DE2] A Stop hook reads the file edit logs, runs builds on affected repos, and catches TypeScript errors — showing small errors to Claude or recommending an auto-resolver agent for larger ones.
- [INS-260320-8DBD] Use a central skill-rules.json config mapping each skill to keywords, regex intent patterns, file path triggers, and content triggers.
- [INS-260320-06EF] Dev docs persist on disk and survive auto-compaction — just say 'continue' in a new session to pick up where you left off.
- [INS-260320-508F] Don't lead in prompts if you want honest feedback — Claude tells you what it thinks you want to hear.
- [INS-260320-7379] A Stop hook detects risky patterns (try-catch, async, DB calls) in edited files and shows gentle non-blocking self-check reminders.
- [INS-260320-0D43] A PostToolUse hook tracks which files were edited, which repo they belong to, and timestamps — feeding downstream hooks like the build checker.
- [INS-260320-4ED6] The full hook pipeline runs in sequence: Claude responds, Prettier formats code, build checker catches errors, error reminder does a self-check — zero errors left behind.
- [INS-260320-F8FD] Claude won't reliably use skills on its own — build a hook system to inject skill reminders automatically.
- [INS-260320-2DDE] Maintain multiple documentation levels — broad architectural overview, specific service docs, API references — to help Claude navigate large codebases.
- [INS-260320-8F12] Start with planning mode to create the plan, review it, then run /dev-docs to generate the three dev doc files.
- [INS-260320-949A] A 5-line pre-execution bash hook checks commands against BLOCKED patterns (node_modules, .env, __pycache__, .git/, dist/, build/) and blocks 99% of token waste.
- [INS-260320-4993] Re-prompt often using double-esc to recall previous prompts — you get better results armed with knowledge of what you DON'T want.
- [INS-260320-6CCE] Take time to review the plan thoroughly — you'd be surprised how often you catch silly mistakes before implementation.
- [INS-260320-96C9] If output quality seems worse, self-reflect on how you're prompting before blaming the model.
- [INS-260320-B210] Keep SKILL.md files under 500 lines and use progressive disclosure via resource files for 40-60% token efficiency improvement.
- [INS-260320-F872] Skills handle 'how to write code' guidelines while CLAUDE.md handles 'how this specific project works' — keep them separate.
- [INS-260320-DC3C] Slash commands expand into full prompts — pack complex, multi-step instructions into simple reusable commands.
- [INS-260320-47DC] If Claude struggles more than 30 minutes on something you could fix in 2 minutes, just step in and do it yourself.
- [INS-260320-69CD] A Stop event hook analyzes edited files after Claude responds and shows gentle self-check reminders for error handling.
- [INS-260320-04A2] Create three dev doc files (plan.md, context.md, tasks.md) for every large task to prevent Claude from losing the plot through compaction.
- [INS-260320-0127] Update dev docs regularly by running /update-dev-docs before context compaction to preserve current state.
- [INS-260320-DCA0] A UserPromptSubmit hook analyzes the prompt for keywords and intent, then injects skill reminders into context BEFORE Claude reads it.

## ai-development/context-management
- [INS-260320-E6DD] Structure knowledge as a relational database (entities + relationships), not text blobs. Every Claude instance reads/writes the same structured knowledge base.

## ai-development/future-of-work
- [INS-260320-A745] Anthropic's own studies show AI deskilling in coding is real, but depends on HOW you use models — some usage patterns cause skill degradation, some don't.
- [INS-260320-E683] Even if you're only doing 5% of the task and AI does 95%, that 5% gets "super amplified" — you become 20x more productive through comparative advantage.
- [INS-260320-DDD9] In a world where AI can generate anything, "having basic critical thinking skills may be the most important thing to success."
- [INS-260320-F78E] Prompt engineering is like playing piano — you can't just sit down and start; it requires practice and iteration to develop the skill.
- [INS-260321-2F43] The name of the game is to increase your leverage — put in very few tokens once in a while and a huge amount of stuff happens on your behalf.

## ai-development/llm-costs
- [INS-260320-9937] OpenRouter offers 50-1000 free requests/day on certain models — not trial credits, actually free forever.
- [INS-260320-9FD5] Batch inputs to amortize system prompt costs — 100 separate calls with a 500-token system prompt = 50,000 wasted tokens. 1 batched call = 500 tokens.
- [INS-260320-92CC] Filter aggressively before hitting expensive models — filtering by upvotes/comments removes 80% of inputs, saving ~$5/week.
- [INS-260320-D972] Let AI rewrite your prompts in the model's own 'language' for 20-30% quality improvement using the meta-prompt technique.
- [INS-260320-EF3A] Don't default to expensive models — test cheaper ones with YOUR data. DeepSeek V3 vs Claude Sonnet = 21x cost reduction for identical summaries.
- [INS-260320-0511] Use cheap models (gpt-5-nano) for categorization/relevance scoring before expensive models — removes 70-90% of irrelevant inputs.
- [INS-260320-2058] Use OpenRouter for a unified dashboard, model switching, spending tracking, and hard budget limits across all LLM providers.

## ai-development/spec-driven-dev
- [INS-260320-4A82] Commit output specs to git so future agents and engineers see what was done, what failed, and what decisions were made.
- [INS-260320-EA19] Use consistent folder conventions: project/story/task/ with requirements.md, instructions.md, research.md, plan.md, code.md, review.md, findings.md.
- [INS-260320-4BA8] Keep spec templates simple — if too heavy, people skip them. Automate file creation and periodically revisit findings for tech debt.

## ai-development/system-building
- [INS-260320-10CC] 91 unit tests all passed, but an automated spec audit found 12 issues — unit tests verify code works, spec audits verify code matches intent.
- [INS-260320-47FA] MASTER_INDEX to domain overview to topic summary to individual insight — answering "what do I know about X?" requires reading roughly 4 files regardless of total insight count.
- [INS-260320-0F7C] Markdown files are the source of truth; SQLite database, indices, mindmap, and tag files are all generated and disposable — when the DB had schema issues, we just regenerated it.
- [INS-260320-4B31] We spent hours designing a detailed spec before writing any code — the spec caught issues before they became bugs and zero scope creep occurred across 5 phases.
- [INS-260320-8FFC] Sequential IDs stored in a file would be hallucinated by the LLM — timestamp plus title hash made file creation completely stateless with zero collisions across 74 insights.
- [INS-260320-63D3] Each implementation task was dispatched to a fresh subagent with exactly the context it needed — no accumulated confusion from previous tasks.

## ai-development/tooling
- [INS-260320-76D2] Use BetterTouchTool for double-tap hotkeys (CMD+CMD = Claude, OPT+OPT = Browser) and relative URL copy from Cursor.
- [INS-260320-4773] Run all backend microservices via PM2 so Claude can read individual service logs in real-time without manual copy-pasting.
- [INS-260320-26B1] Use SuperWhisper for voice-to-text prompting when your hands are tired from typing all day.

## automation/content-creation
- [INS-260320-D58E] An n8n workflow scrapes YouTube, Reddit, Twitter, and the web daily to identify content outliers and trending topics, then generates detailed content ideas with scripts, hooks, and storylines.
- [INS-260320-41E3] A daily n8n content research automation that scrapes multiple platforms, identifies trends, and delivers a content digest costs under $0.35 per day to operate.

## automation/n8n-workflows
- [INS-260320-D3D5] Process items sequentially in n8n batch loops to respect API rate limits -- pull from a queue (e.g., Google Sheets rows), process one at a time, and skip already-completed items.
- [INS-260320-C9B1] An n8n workflow scrapes any business URL and generates a full analysis report (overview, audience personas, brand analysis, customer journey, E-E-A-T) for approximately $0.20 per run.
- [INS-260320-6A9D] Safety-first scraping: decouple your personal account from the scraping tool. If the tool gets flagged, your account is unaffected.
- [INS-260320-336E] Chain specialized AI agents in n8n -- scraper (Firecrawl) feeds analyst (Perplexity) feeds formatter (Gemini) -- each agent does one job well, keeping the pipeline modular and cheap.
- [INS-260320-0063] n8n workflows can be exported as JSON and shared on GitHub with Google Doc templates -- the business analysis workflow repo has 98 stars and is MIT licensed.
- [INS-260320-B8B0] Use Linkfinder AI as a proxy for LinkedIn scraping — no direct LinkedIn API connection means zero ban risk for your personal account.
- [INS-260320-6845] An n8n workflow pulls YouTube links from Google Sheets, extracts transcripts via Dumpling AI, transforms them into newsletter drafts with GPT-4o, and logs results back to Sheets.

## music-production/synthesis
- [INS-260320-77C2] Sample analog synth sounds (like Moog DFAM) into a digital sampler/sequencer (like Elektron Digitakt) to get warm analog timbre with precise digital sequencing and pattern control.

## pets/dog-care
- [INS-260320-8B06] Letting dogs make small choices -- which toy to play with, which direction to walk, whether to engage or rest -- builds confidence and reduces anxiety-driven behaviors.
- [INS-260320-9118] Allow dogs to sniff freely during walks -- scent exploration is their primary way of processing the world and provides more mental stimulation than the physical exercise of the walk itself.

## startups/bootstrapping
- [INS-260320-B7DA] Charge $99/year from day one even when conventional wisdom says students won't pay — premium pricing signals reliability, and raising from $99 to $129 actually increased both users and revenue.
- [INS-260320-39A3] Shelter your team and family from acquisition signal-to-noise until the wire hits — deals fall apart in the last week, and premature sharing creates damaging anxiety.
- [INS-260320-00C2] When users try to cancel, ask "Do you just need more time?" — trial extensions retained the most users, outperforming discounts and 3-month pause options, while keeping users on auto-renew.

## startups/founder-mindset
- [INS-260320-F751] Build something exceptional and they will come — fundraising, hiring, and network emerge from the product itself.
- [INS-260320-3798] Chase proving yourself wrong — the faster you disprove ideas, the faster you find the real one.
- [INS-260320-07A2] Hire people who were already customers — they have conviction you can't interview for.

## startups/growth-marketing
- [INS-260320-A1D3] Keep your content creator team to 5-10 people max, meet with each 1:1, and share what converts vs what doesn't — a small elite team compounds while a large team dilutes quality.
- [INS-260320-1B38] Longer onboarding (15 screens) increased trial starts by 16% — more investment, personalization, and social proof beats short onboarding, and moving login after the paywall prevented a 10% drop-off.
- [INS-260320-630D] Frame your product as a solution to a problem, not a toy — a video framing Coconote as a fun toy got 41M views but terrible conversion, while solution-framed videos converted far better.
- [INS-260320-446F] Hire content creators directly (Gmail in bio, 5-10K followers) — if their email is at an agency, the arbitrage is already gone.
- [INS-260320-70FA] Target the person who pays, not just the person who uses — students used Coconote but moms often bought it, and "my mom just changed my life" content drove viral parent-to-parent purchasing.
- [INS-260320-080B] Ask customers how they describe your product, then use their exact words as marketing copy — Coconote asked and the majority said "never miss a key detail," which became their App Store headline.
- [INS-260320-DADA] You cannot pour fuel on organic fire — viral UGC repurposed as paid ads underperformed, while a separate clip agency creating performance-specific creatives outperformed significantly.

## video-production/audio-sync
- [INS-260320-10E8] Always clap once or use a clapboard at the start of each take -- the sharp transient creates a visible spike in both audio waveforms, making manual sync alignment trivial.
- [INS-260320-232D] Set all audio devices to 48kHz when recording for video -- mismatched sample rates between camera and external recorder cause drift that worsens over longer recordings.

## video-production/sound-design
- [INS-260320-D44B] The foundational rule of video sound design: you should be able to hear everything you see -- nothing on screen is truly silent, and even empty rooms have ambient sound.
- [INS-260320-105E] The sound design workflow for video follows three steps: lay down temp music/score first, add creative SFX and foley second, then apply final audio treatment and mixing.
