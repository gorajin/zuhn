# Topic: llm-training

> 10 insights

- `INS-260320-7682` [high] Run systematic ablation experiments on architecture, data mixtures, and hyperparameters at small scale before committing to a full training run -- this consumes ~37% of total compute but prevents costly mistakes.
- `INS-260321-53E2` [high] All AI computation is matrix multiplication (word relationships scored as points in matrices) — Hinton discovered GPUs excelled at this by accident in 2012, winning ImageNet overwhelmingly.
- `INS-260320-5818` [high] Main pretraining consumes 63% of total compute; plan for 37% additional budget for ablation studies, debugging, and restarts due to infrastructure failures.
- `INS-260320-7B4B` [high] HuggingFace's 200-page training playbook concludes that data quality dominates architectural innovation as the key factor in LLM performance.
- `INS-260320-C65B` [high] The Smol Training Playbook is a 200+ page open guide covering the full LLM pipeline from strategic planning through post-training, based on training SmolLM3 (3B params, 11T tokens).
- `INS-260321-1F9F` [high] Scary stories about LLMs trying to deceive or resist shutdown are reflections of training data patterns, not emergent architectural properties — the objective function is purely next-token prediction.
- `INS-260321-8567` [high] LLMs learn and navigate the manifold created by human-written training data but cannot create new manifolds — the representation breakthroughs that define scientific revolutions.
- `INS-260321-B014` [high] Bayesian wind tunnel experiments prove transformers perform exact Bayesian posterior updating to 10^-3 bits accuracy, but this mechanism is purely correlational — not causal.
- `INS-260321-8C35` [high] AGI requires weight plasticity (continual learning without catastrophic forgetting) and causal modeling (simulation over correlation) — neither solvable by making models bigger.
- `INS-260320-922A` [high] Only pretrain your own LLM for three reasons: advancing research with novel questions, meeting specific production requirements, or filling gaps in the open-source ecosystem.
