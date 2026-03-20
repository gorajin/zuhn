# Knowledge Base Master Index

> Last rebuilt: 2026-03-20 | Total insights: 74 | Sources: 14

**NOTE:** Access counts and last_accessed are updated automatically when insights are retrieved.

## Domains

| Domain | Topics | Insights | Principles | Last Updated |
| ------ | ------ | -------- | ---------- | ------------ |
| ai-development | 7 | 54 | 0 | 2026-03-20 |
| automation | 2 | 12 | 0 | 2026-03-20 |
| music-production | 1 | 2 | 0 | 2026-03-20 |
| pets | 1 | 2 | 0 | 2026-03-20 |
| video-production | 2 | 4 | 0 | 2026-03-20 |

## Mental Models

_No mental models extracted yet._

## Top Tags

n8n(11) workflow(8) hooks(8) llm-costs(8) automation(7) skills(6) prompting(6) spec-driven-dev(6) llm(5) huggingface(5) planning(4) claude-code(4) dev-docs(4) context-management(3) Stop-event(3) compaction(3) error-handling(3) cost-reduction(3) scraping(3) agents(2)

## Flags (for Claude)

_No flags._

## Recently Added (last 7 days)

- `INS-260320-1B10` Have Claude review its own code via a specialized review agent — catches critical errors, missing implementations, and security flaws. _(2026-03-20)_
- `INS-260320-9D89` Give agents very specific roles and clear instructions on what to RETURN — prevents 'I fixed it!' without details. _(2026-03-20)_
- `INS-260320-E6DD` Structure knowledge as a relational database (entities + relationships), not text blobs. Every Claude instance reads/writes the same structured knowledge base. _(2026-03-20)_
- `INS-260320-5B49` Curated structured data enables REASONING about connections. Vector memory stores text blobs for retrieval. For business-ready context, structure wins. _(2026-03-20)_
- `INS-260320-93E1` Planning is king — always use planning mode before implementation; never let the builder start without plans. _(2026-03-20)_
- `INS-260320-A4BF` Attach ready-to-use utility scripts to skills so Claude references proven tools instead of reinventing test scripts from scratch. _(2026-03-20)_
- `INS-260320-DDFE` Bash commands (grep, find) bypass Read() deny rules — they scan everything including node_modules even with deny rules configured. _(2026-03-20)_
- `INS-260320-E872` Be as specific as possible about desired results — vague prompts produce vague implementations. _(2026-03-20)_
- `INS-260320-4DE2` A Stop hook reads the file edit logs, runs builds on affected repos, and catches TypeScript errors — showing small errors to Claude or recommending an auto-resolver agent for larger ones. _(2026-03-20)_
- `INS-260320-8DBD` Use a central skill-rules.json config mapping each skill to keywords, regex intent patterns, file path triggers, and content triggers. _(2026-03-20)_
- `INS-260320-CE36` 85,000 out of 100,000 context tokens were consumed by dependency code — one bash validation hook saved 85% of the context window. _(2026-03-20)_
- `INS-260320-06EF` Dev docs persist on disk and survive auto-compaction — just say 'continue' in a new session to pick up where you left off. _(2026-03-20)_
- `INS-260320-508F` Don't lead in prompts if you want honest feedback — Claude tells you what it thinks you want to hear. _(2026-03-20)_
- `INS-260320-7379` A Stop hook detects risky patterns (try-catch, async, DB calls) in edited files and shows gentle non-blocking self-check reminders. _(2026-03-20)_
- `INS-260320-0D43` A PostToolUse hook tracks which files were edited, which repo they belong to, and timestamps — feeding downstream hooks like the build checker. _(2026-03-20)_
- `INS-260320-4ED6` The full hook pipeline runs in sequence: Claude responds, Prettier formats code, build checker catches errors, error reminder does a self-check — zero errors left behind. _(2026-03-20)_
- `INS-260320-F8FD` Claude won't reliably use skills on its own — build a hook system to inject skill reminders automatically. _(2026-03-20)_
- `INS-260320-2DDE` Maintain multiple documentation levels — broad architectural overview, specific service docs, API references — to help Claude navigate large codebases. _(2026-03-20)_
- `INS-260320-8F12` Start with planning mode to create the plan, review it, then run /dev-docs to generate the three dev doc files. _(2026-03-20)_
- `INS-260320-949A` A 5-line pre-execution bash hook checks commands against BLOCKED patterns (node_modules, .env, __pycache__, .git/, dist/, build/) and blocks 99% of token waste. _(2026-03-20)_
- `INS-260320-4993` Re-prompt often using double-esc to recall previous prompts — you get better results armed with knowledge of what you DON'T want. _(2026-03-20)_
- `INS-260320-6CCE` Take time to review the plan thoroughly — you'd be surprised how often you catch silly mistakes before implementation. _(2026-03-20)_
- `INS-260320-96C9` If output quality seems worse, self-reflect on how you're prompting before blaming the model. _(2026-03-20)_
- `INS-260320-B210` Keep SKILL.md files under 500 lines and use progressive disclosure via resource files for 40-60% token efficiency improvement. _(2026-03-20)_
- `INS-260320-F872` Skills handle 'how to write code' guidelines while CLAUDE.md handles 'how this specific project works' — keep them separate. _(2026-03-20)_
- `INS-260320-DC3C` Slash commands expand into full prompts — pack complex, multi-step instructions into simple reusable commands. _(2026-03-20)_
- `INS-260320-47DC` If Claude struggles more than 30 minutes on something you could fix in 2 minutes, just step in and do it yourself. _(2026-03-20)_
- `INS-260320-69CD` A Stop event hook analyzes edited files after Claude responds and shows gentle self-check reminders for error handling. _(2026-03-20)_
- `INS-260320-04A2` Create three dev doc files (plan.md, context.md, tasks.md) for every large task to prevent Claude from losing the plot through compaction. _(2026-03-20)_
- `INS-260320-0127` Update dev docs regularly by running /update-dev-docs before context compaction to preserve current state. _(2026-03-20)_
- `INS-260320-DCA0` A UserPromptSubmit hook analyzes the prompt for keywords and intent, then injects skill reminders into context BEFORE Claude reads it. _(2026-03-20)_
- `INS-260320-9937` OpenRouter offers 50-1000 free requests/day on certain models — not trial credits, actually free forever. _(2026-03-20)_
- `INS-260320-9FD5` Batch inputs to amortize system prompt costs — 100 separate calls with a 500-token system prompt = 50,000 wasted tokens. 1 batched call = 500 tokens. _(2026-03-20)_
- `INS-260320-901C` Six strategies combined took production systems from $300+/month to ~$10/month while processing 10x more data. _(2026-03-20)_
- `INS-260320-92CC` Filter aggressively before hitting expensive models — filtering by upvotes/comments removes 80% of inputs, saving ~$5/week. _(2026-03-20)_
- `INS-260320-D972` Let AI rewrite your prompts in the model's own 'language' for 20-30% quality improvement using the meta-prompt technique. _(2026-03-20)_
- `INS-260320-EF3A` Don't default to expensive models — test cheaper ones with YOUR data. DeepSeek V3 vs Claude Sonnet = 21x cost reduction for identical summaries. _(2026-03-20)_
- `INS-260320-0511` Use cheap models (gpt-5-nano) for categorization/relevance scoring before expensive models — removes 70-90% of irrelevant inputs. _(2026-03-20)_
- `INS-260320-2058` Use OpenRouter for a unified dashboard, model switching, spending tracking, and hard budget limits across all LLM providers. _(2026-03-20)_
- `INS-260320-4A82` Commit output specs to git so future agents and engineers see what was done, what failed, and what decisions were made. _(2026-03-20)_
- `INS-260320-EA19` Use consistent folder conventions: project/story/task/ with requirements.md, instructions.md, research.md, plan.md, code.md, review.md, findings.md. _(2026-03-20)_
- `INS-260320-4BA8` Keep spec templates simple — if too heavy, people skip them. Automate file creation and periodically revisit findings for tech debt. _(2026-03-20)_
- `INS-260320-6F8E` SDD cycle: input specs (PRD, tech brief, requirements) and output specs (research logs, code notes, findings) are both first-class artifacts. _(2026-03-20)_
- `INS-260320-D4BD` New engineers hit the ground running with clear specs defining both what to build and what has already been done. _(2026-03-20)_
- `INS-260320-7914` Research logs and findings surface 'already solved' patterns, preventing teams and agents from reinventing solutions. _(2026-03-20)_
- `INS-260320-7682` Run systematic ablation experiments on architecture, data mixtures, and hyperparameters at small scale before committing to a full training run -- this consumes ~37% of total compute but prevents costly mistakes. _(2026-03-20)_
- `INS-260320-5818` Main pretraining consumes 63% of total compute; plan for 37% additional budget for ablation studies, debugging, and restarts due to infrastructure failures. _(2026-03-20)_
- `INS-260320-7B4B` HuggingFace's 200-page training playbook concludes that data quality dominates architectural innovation as the key factor in LLM performance. _(2026-03-20)_
- `INS-260320-C65B` The Smol Training Playbook is a 200+ page open guide covering the full LLM pipeline from strategic planning through post-training, based on training SmolLM3 (3B params, 11T tokens). _(2026-03-20)_
- `INS-260320-922A` Only pretrain your own LLM for three reasons: advancing research with novel questions, meeting specific production requirements, or filling gaps in the open-source ecosystem. _(2026-03-20)_
- `INS-260320-76D2` Use BetterTouchTool for double-tap hotkeys (CMD+CMD = Claude, OPT+OPT = Browser) and relative URL copy from Cursor. _(2026-03-20)_
- `INS-260320-C8CC` PM2 gives you auto-restart on crashes, per-service logs, memory/CPU monitoring, and easy management like `pm2 restart email`. _(2026-03-20)_
- `INS-260320-4773` Run all backend microservices via PM2 so Claude can read individual service logs in real-time without manual copy-pasting. _(2026-03-20)_
- `INS-260320-26B1` Use SuperWhisper for voice-to-text prompting when your hands are tired from typing all day. _(2026-03-20)_
- `INS-260320-CDE4` The Moog DFAM has no MIDI implementation -- sampling its output into a MIDI-capable device is the primary way to integrate it into a broader production setup. _(2026-03-20)_
- `INS-260320-77C2` Sample analog synth sounds (like Moog DFAM) into a digital sampler/sequencer (like Elektron Digitakt) to get warm analog timbre with precise digital sequencing and pattern control. _(2026-03-20)_
- `INS-260320-D58E` An n8n workflow scrapes YouTube, Reddit, Twitter, and the web daily to identify content outliers and trending topics, then generates detailed content ideas with scripts, hooks, and storylines. _(2026-03-20)_
- `INS-260320-41E3` A daily n8n content research automation that scrapes multiple platforms, identifies trends, and delivers a content digest costs under $0.35 per day to operate. _(2026-03-20)_
- `INS-260320-9935` The 0-to-175K growth came from automating content research and ideation, not from automating content creation itself -- the competitive advantage is knowing what to create, not how to create it. _(2026-03-20)_
- `INS-260320-71C1` Full pipeline: search query to scrape 100+ profiles, extract data, pull company info, AI-generate personalized opener, export to Google Sheets. _(2026-03-20)_
- `INS-260320-D3D5` Process items sequentially in n8n batch loops to respect API rate limits -- pull from a queue (e.g., Google Sheets rows), process one at a time, and skip already-completed items. _(2026-03-20)_
- `INS-260320-C9B1` An n8n workflow scrapes any business URL and generates a full analysis report (overview, audience personas, brand analysis, customer journey, E-E-A-T) for approximately $0.20 per run. _(2026-03-20)_
- `INS-260320-6A9D` Safety-first scraping: decouple your personal account from the scraping tool. If the tool gets flagged, your account is unaffected. _(2026-03-20)_
- `INS-260320-336E` Chain specialized AI agents in n8n -- scraper (Firecrawl) feeds analyst (Perplexity) feeds formatter (Gemini) -- each agent does one job well, keeping the pipeline modular and cheap. _(2026-03-20)_
- `INS-260320-CEBE` A single YouTube transcript can feed newsletter drafts, social media posts, blog articles, and email campaigns -- extend the base n8n workflow with parallel output branches. _(2026-03-20)_
- `INS-260320-0063` n8n workflows can be exported as JSON and shared on GitHub with Google Doc templates -- the business analysis workflow repo has 98 stars and is MIT licensed. _(2026-03-20)_
- `INS-260320-B8B0` Use Linkfinder AI as a proxy for LinkedIn scraping — no direct LinkedIn API connection means zero ban risk for your personal account. _(2026-03-20)_
- `INS-260320-6845` An n8n workflow pulls YouTube links from Google Sheets, extracts transcripts via Dumpling AI, transforms them into newsletter drafts with GPT-4o, and logs results back to Sheets. _(2026-03-20)_
- `INS-260320-8B06` Letting dogs make small choices -- which toy to play with, which direction to walk, whether to engage or rest -- builds confidence and reduces anxiety-driven behaviors. _(2026-03-20)_
- `INS-260320-9118` Allow dogs to sniff freely during walks -- scent exploration is their primary way of processing the world and provides more mental stimulation than the physical exercise of the walk itself. _(2026-03-20)_
- `INS-260320-10E8` Always clap once or use a clapboard at the start of each take -- the sharp transient creates a visible spike in both audio waveforms, making manual sync alignment trivial. _(2026-03-20)_
- `INS-260320-232D` Set all audio devices to 48kHz when recording for video -- mismatched sample rates between camera and external recorder cause drift that worsens over longer recordings. _(2026-03-20)_
- `INS-260320-D44B` The foundational rule of video sound design: you should be able to hear everything you see -- nothing on screen is truly silent, and even empty rooms have ambient sound. _(2026-03-20)_
- `INS-260320-105E` The sound design workflow for video follows three steps: lay down temp music/score first, add creative SFX and foley second, then apply final audio treatment and mixing. _(2026-03-20)_
