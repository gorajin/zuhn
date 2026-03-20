# Topic: llm-costs

> 8 insights

- `INS-260320-9FD5` [high] Batch inputs to amortize system prompt costs — 100 separate calls with a 500-token system prompt = 50,000 wasted tokens. 1 batched call = 500 tokens.
- `INS-260320-901C` [high] Six strategies combined took production systems from $300+/month to ~$10/month while processing 10x more data.
- `INS-260320-92CC` [high] Filter aggressively before hitting expensive models — filtering by upvotes/comments removes 80% of inputs, saving ~$5/week.
- `INS-260320-EF3A` [high] Don't default to expensive models — test cheaper ones with YOUR data. DeepSeek V3 vs Claude Sonnet = 21x cost reduction for identical summaries.
- `INS-260320-0511` [high] Use cheap models (gpt-5-nano) for categorization/relevance scoring before expensive models — removes 70-90% of irrelevant inputs.
- `INS-260320-2058` [high] Use OpenRouter for a unified dashboard, model switching, spending tracking, and hard budget limits across all LLM providers.
- `INS-260320-9937` [medium] OpenRouter offers 50-1000 free requests/day on certain models — not trial credits, actually free forever.
- `INS-260320-D972` [medium] Let AI rewrite your prompts in the model's own 'language' for 20-30% quality improvement using the meta-prompt technique.
