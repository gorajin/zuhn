# Action List
Generated on 2026-03-22 | 140 actionable insights

## ai-development/agent-patterns
- [INS-260320-1B10] Have Claude review its own code via a specialized review agent — catches critical errors, missing implementations, and security flaws.
- [INS-260320-9D89] Give agents very specific roles and clear instructions on what to RETURN — prevents 'I fixed it!' without details.
- [INS-260321-D3BE] Stop thinking in lines of code — think in macro actions: 'agent 1 builds feature X, agent 2 researches Y, agent 3 plans Z' — then review their work.
- [INS-260321-18D0] Your bottleneck shifted from typing speed to token throughput — maximize how many agent sessions you can run in parallel, not how fast you code.
- [INS-260321-8414] The biggest barrier to enterprise AI agent adoption isn't model capability but trust UX — too many status updates and users say 'stop telling me crap,' too few and they say 'what is it doing?' — requiring progressive disclosure design patterns that don't yet exist.

## ai-development/ai-automation
- [INS-260320-5A6F] AI-enabled beats AI-replaced — keep the human touch in important parts, automate the repetitive.
- [INS-260320-76E7] Only automate what you deeply understand — automating ignorance creates slot machines, not efficiency.

## ai-development/ai-market-dynamics
- [INS-260321-7C97] Software that makes you similar to everyone else (beta) will be replaced by AI/vibe-coding; software that expresses your competitive advantage (alpha) becomes more valuable.
- [INS-260321-FD14] Vibe coding won't replace enterprise SaaS because of comparative advantage and hidden edge cases — but it dramatically increases platform extensibility by letting non-developers build custom applications on top of existing systems of record.
- [INS-260321-0CCD] A portfolio founder assigned two AI-native engineers with unlimited budgets on Claude Code, Codex, and Cursor and saw 10-20x faster progress — concluding his entire product and engineering organization needs restructuring within 12 months.

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
- [INS-260321-0C99] Create three markdown context files (about-me.md, my-rules.md, my-templates.md) — this is the step most people skip and the one that makes the biggest difference.
- [INS-260321-E9B7] If you're copying the same instructions into multiple projects, that's a signal to create a Skill instead — Skills work across ALL conversations while Projects only work within one.
- [INS-260321-82FE] Effective prompting is no longer about linguistic tricks — it's about providing the right structure: role, background, format, constraints. Description of what the output should BE matters more than instructions for what the model should DO.
- [INS-260321-E2FC] Most prompting failures stem from mode mismatch — you intend augmentation (think together) but signal automation (just execute), or vice versa. Explicitly state which mode you want.
- [INS-260321-703F] Instead of 'write me X', ask 'what makes X work well?' then 'what principles apply here?' then 'now do it for my case' — the model reasons before generating instead of pattern-matching to common outputs.

## ai-development/context-management
- [INS-260320-E6DD] Structure knowledge as a relational database (entities + relationships), not text blobs. Every Claude instance reads/writes the same structured knowledge base.

## ai-development/future-of-work
- [INS-260320-A745] Anthropic's own studies show AI deskilling in coding is real, but depends on HOW you use models — some usage patterns cause skill degradation, some don't.
- [INS-260320-E683] Even if you're only doing 5% of the task and AI does 95%, that 5% gets "super amplified" — you become 20x more productive through comparative advantage.
- [INS-260320-DDD9] In a world where AI can generate anything, "having basic critical thinking skills may be the most important thing to success."
- [INS-260320-F78E] Prompt engineering is like playing piano — you can't just sit down and start; it requires practice and iteration to develop the skill.
- [INS-260321-2F43] The name of the game is to increase your leverage — put in very few tokens once in a while and a huge amount of stuff happens on your behalf.
- [INS-260321-4178] AI doesn't just automate procedures — it automates judgment calls. The person who deeply understands insurance underwriting and can talk an AI into building a tool is now more dangerous than the engineer who can build anything but doesn't know what to build.
- [INS-260321-1A0B] The biggest risk of AI adoption isn't that it fails — it's that it works so well that humans stop learning. Design AI systems where a key priority is the learning and improvement of the humans in the loop.
- [INS-260321-99C0] Share every major decision with AI daily, then monthly ask 'what was my biggest mistake in the past 6 months?' — accumulated context makes AI an increasingly powerful strategic advisor.

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
- [INS-260321-167A] Finance has three jobs: explain what happened (the metric), why it happened (the business decision), and what to do next (the action with timeline). Most teams nail the first and struggle with the second.

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

## investing/geopolitics
- [INS-260321-D183] If US wins the cold war: S&P returns 8-10% annually. If China wins: China gives the US a soft landing (they need US consumption market), S&P returns ~5% annually. Either way, S&P has the highest expected value.

## music-production/music-marketing
- [INS-260321-13EA] Release on Friday (international release day) with minimum 4 weeks from master delivery — things go wrong with aggregators, you need time to pitch DSPs, and thinking 'I'll release on Tuesday to fox them' is thinking small.
- [INS-260321-E529] Your content feed must feel episodic like a TV show — if each post is a different genre (live, mimed, behind-scenes, different clothes), viewers get the Game of Thrones problem where every episode is a different show.
- [INS-260321-F0DF] TikTok Live has massive viewer supply but low creator supply — musicians going live regularly earn $10K+/month from TikTok payments while building thousands of followers per week.
- [INS-260321-3312] Music is now attached to YOU, not to a format — your job is not to promote a song (temporary) but to build a content machine (permanent) where your music is the superpower that gets you attention.

## music-production/songwriting
- [INS-260321-6D01] Puth's best work follows a two-phase pattern: solo marination where the song develops in his head, then collaboration where others refine and constrain his tendencies.
- [INS-260321-9C2E] Charlie Puth's vast musical index becomes a liability without collaborators to constrain him — 'if you only know one sound, you'll use it, but too many options means you need someone to tell you to sit down.'

## music-production/synthesis
- [INS-260320-77C2] Sample analog synth sounds (like Moog DFAM) into a digital sampler/sequencer (like Elektron Digitakt) to get warm analog timbre with precise digital sequencing and pattern control.

## pets/dog-care
- [INS-260320-8B06] Letting dogs make small choices -- which toy to play with, which direction to walk, whether to engage or rest -- builds confidence and reduces anxiety-driven behaviors.
- [INS-260320-9118] Allow dogs to sniff freely during walks -- scent exploration is their primary way of processing the world and provides more mental stimulation than the physical exercise of the walk itself.

## startups/ai-business-models
- [INS-260322-E20E] AI application companies should price by business value delivered or productivity uplift, not by token consumption — cost-based pricing systematically undercharges as AI costs deflate.

## startups/bootstrapping
- [INS-260320-B7DA] Charge $99/year from day one even when conventional wisdom says students won't pay — premium pricing signals reliability, and raising from $99 to $129 actually increased both users and revenue.
- [INS-260320-39A3] Shelter your team and family from acquisition signal-to-noise until the wire hits — deals fall apart in the last week, and premature sharing creates damaging anxiety.
- [INS-260320-00C2] When users try to cancel, ask "Do you just need more time?" — trial extensions retained the most users, outperforming discounts and 3-month pause options, while keeping users on auto-renew.
- [INS-260321-E8CB] One-size-fits-all SaaS benchmarks are misleading — a pre-seed company should target burn multiple <2.5x while Series B+ targets <1.0x. Stage-specific targets: NRR >100%/>110%/>120%, LTV:CAC >2.0x/>3.0x/>3.5x.
- [INS-260321-7D76] A common mistake is automating wherever it's easiest rather than wherever the constraint actually is. The single biggest bottleneck in your process probably accounts for most of the available gains. Find that one thing. Automate that.
- [INS-260321-2D72] Code's real advantage isn't zero marginal cost of serving users — it's zero-cost experimentation. A/B test, deploy, roll back, iterate at near-zero cost per cycle. Your competitive advantage is learning speed, not serving speed.
- [INS-260321-31B3] Ship product updates 6 days per week because AI model improvements reset the entire industry every month.
- [INS-260321-FE91] Opus Clip validated by manually engineering final video outputs and emailing them to potential customers, getting 60% positive feedback before writing a single line of product code.
- [INS-260321-1992] Focus on first dollar by day 30, $1M ARR ($80K/month) by day 90, and only consider VC if you actually need it.
- [INS-260321-E5C5] The ideal AI startup founding team is one builder who ships in 24 hours and one go-to-market person with audience empathy.

## startups/business-models
- [INS-260322-FCFC] Companies where AI reinforces the business model by driving revenue — not just cutting costs — see dramatically stronger market pull and adoption.

## startups/competitive-advantage
- [INS-260322-7282] Owning the full workflow from intake to outcome generates proprietary data that public models can't replicate — creating a compounding competitive advantage.

## startups/founder-mindset
- [INS-260320-F751] Build something exceptional and they will come — fundraising, hiring, and network emerge from the product itself.
- [INS-260320-3798] Chase proving yourself wrong — the faster you disprove ideas, the faster you find the real one.
- [INS-260320-07A2] Hire people who were already customers — they have conviction you can't interview for.
- [INS-260321-C513] Avoid building features that incumbents can bundle (like meeting notetakers for Zoom), and avoid pure prompt wrappers that next model releases will obsolete.
- [INS-260321-2F09] Many AI founders fail because they build impressive demos that don't solve real painful jobs — if nobody asks about pricing, you don't have product-market fit.
- [INS-260321-C0A4] Your probability of success directly correlates with whether your closest friends care about and push you toward what you want to achieve.
- [INS-260321-C14C] The biggest failure mode in Silicon Valley is assuming that being smart at building products means you're smart at negotiating contracts, managing politics, or understanding war — 'if you don't know who the mark is, you're the mark.'

## startups/growth-marketing
- [INS-260320-A1D3] Keep your content creator team to 5-10 people max, meet with each 1:1, and share what converts vs what doesn't — a small elite team compounds while a large team dilutes quality.
- [INS-260320-630D] Frame your product as a solution to a problem, not a toy — a video framing Coconote as a fun toy got 41M views but terrible conversion, while solution-framed videos converted far better.
- [INS-260320-446F] Hire content creators directly (Gmail in bio, 5-10K followers) — if their email is at an agency, the arbitrage is already gone.
- [INS-260320-70FA] Target the person who pays, not just the person who uses — students used Coconote but moms often bought it, and "my mom just changed my life" content drove viral parent-to-parent purchasing.
- [INS-260320-080B] Ask customers how they describe your product, then use their exact words as marketing copy — Coconote asked and the majority said "never miss a key detail," which became their App Store headline.
- [INS-260320-DADA] You cannot pour fuel on organic fire — viral UGC repurposed as paid ads underperformed, while a separate clip agency creating performance-specific creatives outperformed significantly.
- [INS-260321-099E] Don't find a blue ocean — create one by taking a format proven in Market A and applying it to Market B where nobody has used it yet.
- [INS-260321-141B] Write a proven format at the top of a grid, list all markets down the side, mark where the combination exists — empty cells are your blue ocean.
- [INS-260321-ADB4] Allocate 80% of content to evergreen material (guides, frameworks, reference) and 20% to timely pieces. Every piece should exist in at least five formats: audio, video, short clips, newsletter, social thread.
- [INS-260321-C4CD] A podcast episode is both a distribution mechanism AND a credibility-building mechanism — it operates on two axes at once. Most tools do one thing. Media does both, which is why its returns feel disproportionate.
- [INS-260321-021B] Higgsfield interviewed 8 creatives — all 8 gave identical feedback about camera controls, which became their breakout feature.
- [INS-260321-5C24] Apply three filters to find viable AI businesses: ruthlessly niche (cannot be segmented further), boring (non-competitive), and existing services to replace (agencies/freelancers/hacky solutions).
- [INS-260321-8D2B] Price AI products using three factors: value creation vs human cost, unit economics including hidden storage costs, and representative customer surveys.
- [INS-260321-4E98] Horizontal consumer AI agents like Manus grow explosively but face acquisition by big tech because once agentic capabilities become commoditized, distribution and existing enterprise contracts become the deciding moat.
- [INS-260321-AA91] Enterprise customers resist AI credit-based pricing because credits are opaque (unlike transferable units like gigabytes), vendors can silently increase consumption by adding features, and outcome-based pricing creates a dynamic baseline problem where savings erode year over year.
- [INS-260321-69E1] A16z hired an 18-year-old for Instagram (up 35% MoM) because each platform has its own vibe, taste, and spirit — crossposting one idea everywhere fails to appreciate what each platform rewards.
- [INS-260321-FB3F] Every time a public figure gets destroyed, it's because of something too short to contain context — say everything you think, but say it on a podcast or in an essay.
- [INS-260321-2564] In old media you could never correct a misinterpretation; in new media you can drown it out by going on 30 podcasts to talk about something more interesting.
- [INS-260321-5598] Professional CEOs trained to say nothing on stage now lose to founder CEOs interesting enough to fill 3 hours on Joe Rogan — the 80-year reign of synthetic corporate communication is over.
- [INS-260321-822B] The fastest AI companies reach $100M revenue significantly faster than SaaS predecessors, with top performers growing 693% YoY — driven by product demand, not sales spend — and running at $500K-1M ARR per FTE versus the old SaaS benchmark of $400K.

## startups/hiring
- [INS-260322-AC23] ElevenLabs hired from non-traditional backgrounds by looking for proof of excellence — open-source projects, side projects, or standout achievements — rather than conventional credentials.

## startups/ideation
- [INS-260321-6BA7] Find ideas that have been discarded by others rather than trying to discover something no one has ever thought of.
- [INS-260321-E471] Most founders filter out ideas requiring more than two years to work, so simply imagining ideas with longer timelines dramatically reduces competition.
- [INS-260321-CCD9] Basic image generation is being absorbed by foundation models, but creative tools that are aesthetically opinionated (Midjourney) or own non-commoditized modalities (Suno for music, 11 Labs for voice) maintain defensible positions.
- [INS-260321-7109] SaaS companies where seats are tied to work output (Zendesk) face existential risk from AI, those where seats are just a pricing trick unrelated to output (Workday) are safe, and those in between (Adobe) face moderate pressure.
- [INS-260321-4B38] Current health tech can read biology (wearables, CGMs, blood tests) but cannot write to it — the massive startup opportunity is in interventions like palm/sole body-cooling devices for sleep, eye-movement sleep masks, and real-time cortisol modulation.

## startups/market-strategy
- [INS-260322-F868] Truemed built infrastructure that lets people use existing tax-free HSA/FSA dollars on lifestyle interventions, redirecting billions toward prevention without requiring new legislation or payer buy-in.

## video-production/audio-sync
- [INS-260320-10E8] Always clap once or use a clapboard at the start of each take -- the sharp transient creates a visible spike in both audio waveforms, making manual sync alignment trivial.
- [INS-260320-232D] Set all audio devices to 48kHz when recording for video -- mismatched sample rates between camera and external recorder cause drift that worsens over longer recordings.

## video-production/sound-design
- [INS-260320-D44B] The foundational rule of video sound design: you should be able to hear everything you see -- nothing on screen is truly silent, and even empty rooms have ambient sound.
- [INS-260320-105E] The sound design workflow for video follows three steps: lay down temp music/score first, add creative SFX and foley second, then apply final audio treatment and mixing.
