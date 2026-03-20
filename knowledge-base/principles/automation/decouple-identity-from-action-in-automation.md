---
id: PRI-260320-097F
domain: automation
title: "Decouple identity from action in automation"
summary: "Never connect your personal account directly to scraping/automation tools. Use proxies and intermediaries so if the tool gets flagged, your identity is unaffected."
confidence: high
supporting_insights:
  - INS-260320-B8B0
  - INS-260320-6A9D
  - INS-260320-71C1
supporting_count: 3
tags:
  - safety
  - automation
  - identity
  - scraping
date_created: "2026-03-20"
last_reviewed: "2026-03-20"
resolutions:
  one_line: "Never connect your personal account to automation — use proxies and intermediaries so flagging hits the tool, not you."
  standard: |
    Three insights from LinkedIn scraping and automation workflows converge
    on a safety principle: your identity and your automation actions must be
    decoupled through an intermediary layer.

    The concrete example is LinkedIn scraping (INS-260320-B8B0): Linkfinder AI
    acts as a proxy with no direct LinkedIn API connection, meaning zero ban
    risk for your personal account. The general rule (INS-260320-6A9D) is
    explicit: decouple your personal account from the scraping tool so that
    if the tool gets flagged, your account is unaffected.

    The full pipeline (INS-260320-71C1) — search query to 100+ profiles,
    extract data, pull company info, AI-generate personalized openers, export
    to Google Sheets — runs entirely through intermediaries. No step touches
    a personal account directly.

    The principle extends beyond scraping: any automation that interacts with
    external services should use intermediary accounts, API keys, or proxy
    services. The automation layer is disposable; your identity is not. This
    is the same pattern as using environment variables for credentials — the
    interface is decoupled from the identity.
---

Three insights from LinkedIn scraping and automation workflows converge
on a safety principle: your identity and your automation actions must be
decoupled through an intermediary layer.

The concrete example is LinkedIn scraping: Linkfinder AI acts as a proxy
with no direct LinkedIn API connection, meaning zero ban risk for your
personal account. The general rule is explicit: decouple your personal
account from the scraping tool so that if the tool gets flagged, your
account is unaffected.

The full pipeline — search query to 100+ profiles, extract data, pull
company info, AI-generate personalized openers, export to Google Sheets —
runs entirely through intermediaries. No step touches a personal account
directly.

The principle extends beyond scraping: any automation that interacts with
external services should use intermediary accounts, API keys, or proxy
services. The automation layer is disposable; your identity is not. This
is the same pattern as using environment variables for credentials — the
interface is decoupled from the identity.
