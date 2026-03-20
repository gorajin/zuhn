# Tag: token-optimization

- `INS-260320-949A` A 5-line pre-execution bash hook checks commands against BLOCKED patterns (node_modules, .env, __pycache__, .git/, dist/, build/) and blocks 99% of token waste.
- `INS-260320-9FD5` Batch inputs to amortize system prompt costs — 100 separate calls with a 500-token system prompt = 50,000 wasted tokens. 1 batched call = 500 tokens.
