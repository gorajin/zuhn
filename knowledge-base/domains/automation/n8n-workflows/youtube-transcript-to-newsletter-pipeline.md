---
id: INS-260320-6845
domain: automation
topic: n8n-workflows
title: YouTube Transcript to Newsletter Pipeline with n8n
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - n8n
  - youtube
  - newsletter
  - content-repurposing
  - transcripts
  - gpt-4o
sources:
  - type: reddit
    title: >-
      I built a workflow that turns YouTube transcripts into newsletter style
      summaries
    author: u/unknown
related:
  - INS-260320-4773
  - INS-260320-D58E
  - INS-260320-41E3
  - INS-260320-71C1
  - INS-260320-D3D5
  - INS-260320-C9B1
  - INS-260320-336E
  - INS-260320-CEBE
  - INS-260320-0063
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    An n8n workflow pulls YouTube links from Google Sheets, extracts transcripts
    via Dumpling AI, transforms them into newsletter drafts with GPT-4o, and
    logs results back to Sheets.
  standard: |
    A 7-step n8n automation pipeline converts YouTube videos into polished
    newsletter content. Google Sheets serves as both input (video URLs) and
    output (finished drafts). The workflow processes only rows with empty
    "blog post" fields, extracts transcripts via Dumpling AI, then uses
    GPT-4o to generate structured newsletters with summaries, introductions,
    readable paragraphs, and CTAs. An alternative version uses LangChain
    with Gemini and Apify. Compatible with Notion, Airtable, Mailchimp,
    Beehiiv, and ConvertKit as downstream targets.
---

A 7-step n8n automation pipeline converts YouTube videos into polished
newsletter content. Google Sheets serves as both input (video URLs) and
output (finished drafts). The workflow processes only rows with empty
"blog post" fields, extracts transcripts via Dumpling AI, then uses
GPT-4o to generate structured newsletters with summaries, introductions,
readable paragraphs, and CTAs. An alternative version uses LangChain
with Gemini and Apify. Compatible with Notion, Airtable, Mailchimp,
Beehiiv, and ConvertKit as downstream targets.
