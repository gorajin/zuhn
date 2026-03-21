---
id: PRI-260320-3032
domain: ai-development
title: "Data quality dominates architecture in ML systems"
summary: "HuggingFace's 200-page playbook and SmolLM3 training confirm: obsessive data curation matters more than architectural innovation. Budget 37% beyond base training for ablations and debugging."
confidence: high
supporting_insights:
  - INS-260320-7B4B
  - INS-260320-5818
  - INS-260320-7682
  - INS-260320-922A
  - INS-260320-C65B
supporting_count: 5
tags:
  - llm-training
  - data-quality
  - ablations
  - huggingface
date_created: "2026-03-20"
last_reviewed: "2026-03-20"
resolutions:
  one_line: "Data curation matters more than architecture — budget 37% beyond base training for ablations that prove it."
  standard: |
    Five insights from HuggingFace's SmolLM3 training experience (3B params,
    11T tokens) and their 200-page open training playbook converge on a single
    conclusion: data quality dominates architectural innovation as the
    determinant of LLM performance (INS-260320-7B4B, INS-260320-C65B).

    The evidence comes from systematic ablation methodology (INS-260320-7682):
    run experiments on architecture, data mixtures, and hyperparameters at
    small scale before committing to full training runs. These ablations
    consume approximately 37% of total compute (INS-260320-5818) but prevent
    costly mistakes. Main pretraining takes 63%; the remaining 37% goes to
    ablation studies, debugging, and restarts from infrastructure failures.

    The practical implication for anyone considering pretraining
    (INS-260320-922A): only do it for three reasons — advancing research with
    novel questions, meeting specific production requirements, or filling gaps
    in the open-source ecosystem. For everything else, fine-tune existing
    models. But regardless of whether you pretrain or fine-tune, data quality
    is the variable that matters most.

    The principle: in ML systems, invest proportionally in data quality over
    architectural novelty. The ratio is roughly 2:1 in favor of data work
    (curation, filtering, decontamination, mixture tuning) over architecture
    experiments.
embedded: true
embedding_model: "nomic-embed-text"
---

Five insights from HuggingFace's SmolLM3 training experience (3B params,
11T tokens) and their 200-page open training playbook converge on a single
conclusion: data quality dominates architectural innovation as the
determinant of LLM performance.

The evidence comes from systematic ablation methodology: run experiments on
architecture, data mixtures, and hyperparameters at small scale before
committing to full training runs. These ablations consume approximately 37%
of total compute but prevent costly mistakes. Main pretraining takes 63%;
the remaining 37% goes to ablation studies, debugging, and restarts from
infrastructure failures.

The practical implication for anyone considering pretraining: only do it
for three reasons — advancing research with novel questions, meeting
specific production requirements, or filling gaps in the open-source
ecosystem. For everything else, fine-tune existing models. But regardless
of whether you pretrain or fine-tune, data quality is the variable that
matters most.

The principle: in ML systems, invest proportionally in data quality over
architectural novelty. The ratio is roughly 2:1 in favor of data work
(curation, filtering, decontamination, mixture tuning) over architecture
experiments.
