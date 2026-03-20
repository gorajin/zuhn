---
id: INS-260320-C65B
domain: ai-development
topic: llm-training
title: HuggingFace Smol Training Playbook Reference
actionability: reference
confidence: high
shelf_life: evergreen
status: active
tags:
  - llm
  - huggingface
  - playbook
  - reference
  - smollm3
  - pretraining
  - post-training
sources:
  - type: reddit
    title: 200+ pages of Hugging Face secrets on how to train an LLM
    author: u/unknown
related:
  - INS-260320-8DBD
  - INS-260320-B210
  - INS-260320-2058
  - INS-260320-7B4B
  - INS-260320-71C1
  - INS-260320-47FA
  - INS-260320-922A
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    The Smol Training Playbook is a 200+ page open guide covering the full LLM
    pipeline from strategic planning through post-training, based on training
    SmolLM3 (3B params, 11T tokens).
  standard: >
    The Smol Training Playbook by HuggingFaceTB is the most comprehensive

    open resource for end-to-end LLM training. It covers 7 parts:

    (1) Training Compass (strategic planning and decision framework),

    (2) Pretraining Foundation (ablation setup, framework evaluation),

    (3) Core Technical Decisions (architecture, tokenizer, optimizer,

    scaling laws), (4) Data Strategy (curation, mixtures, curriculum),

    (5) Training Execution (pre-flight checks, debugging, throughput),

    (6) Post-Training (SFT, DPO, GRPO, model merging), and

    (7) Infrastructure (GPU architecture, parallelism, checkpointing).

    Unlike polished papers, it documents real failures: loss spikes,

    dataloader bugs, tensor parallelism bugs after 1T tokens. Available

    as web app, PDF, and full markdown. Training used 384 H100 GPUs for

    ~30 days.


    Links:

    - Web: https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook

    - PDF:
    https://huggingfacetb-smol-training-playbook.hf.space/the-smol-training-playbook-the-secrets-to-building-world-class-llms.pdf

    - TOC: https://huggingface.co/spaces/HuggingFaceTB/smol-playbook-toc
---

The Smol Training Playbook by HuggingFaceTB is the most comprehensive
open resource for end-to-end LLM training. It covers 7 parts:
(1) Training Compass (strategic planning and decision framework),
(2) Pretraining Foundation (ablation setup, framework evaluation),
(3) Core Technical Decisions (architecture, tokenizer, optimizer,
scaling laws), (4) Data Strategy (curation, mixtures, curriculum),
(5) Training Execution (pre-flight checks, debugging, throughput),
(6) Post-Training (SFT, DPO, GRPO, model merging), and
(7) Infrastructure (GPU architecture, parallelism, checkpointing).
Unlike polished papers, it documents real failures: loss spikes,
dataloader bugs, tensor parallelism bugs after 1T tokens. Available
as web app, PDF, and full markdown. Training used 384 H100 GPUs for
~30 days.

Links:
- Web: https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook
- PDF: https://huggingfacetb-smol-training-playbook.hf.space/the-smol-training-playbook-the-secrets-to-building-world-class-llms.pdf
- TOC: https://huggingface.co/spaces/HuggingFaceTB/smol-playbook-toc
