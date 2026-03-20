# Tag: build-checker

- `INS-260320-4DE2` A Stop hook reads the file edit logs, runs builds on affected repos, and catches TypeScript errors — showing small errors to Claude or recommending an auto-resolver agent for larger ones.
- `INS-260320-4ED6` The full hook pipeline runs in sequence: Claude responds, Prettier formats code, build checker catches errors, error reminder does a self-check — zero errors left behind.
