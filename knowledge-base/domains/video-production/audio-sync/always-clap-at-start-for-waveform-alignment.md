---
id: INS-260320-10E8
domain: video-production
topic: audio-sync
title: Always Clap at Start for Waveform Alignment
actionability: immediate
confidence: high
shelf_life: evergreen
status: active
tags:
  - audio-sync
  - video-editing
  - clapboard
  - waveform
  - alignment
  - recording
sources:
  - type: reddit
    title: '[Tutorial] All there is to know about syncing video and audio'
    author: u/unknown
related:
  - INS-260320-77C2
  - INS-260320-232D
  - INS-260321-E2FC
  - INS-260322-9436
  - INS-260322-A8F2
  - INS-260322-C935
  - INS-260321-A6A6
date_extracted: '2026-03-20'
last_accessed: null
access_count: 0
indexed: true
embedded: true
embedding_model: nomic-embed-text
resolutions:
  one_line: >-
    Always clap once or use a clapboard at the start of each take -- the sharp
    transient creates a visible spike in both audio waveforms, making manual
    sync alignment trivial.
  standard: |
    When recording video and audio separately (external microphone, field
    recorder), always create a sync point at the start of each take by
    clapping hands once or using a clapboard. The sharp transient sound
    creates a distinctive spike visible in both the camera's scratch audio
    waveform and the external recorder's waveform. In your NLE (Premiere,
    DaVinci Resolve, Filmora), align these spikes to achieve frame-accurate
    sync. This is more reliable than automatic sync tools for problematic
    recordings. Always record scratch audio on camera even when using
    external audio -- it serves as the sync reference. For multi-camera
    setups, timecode sync is preferred, but the clap method works as a
    reliable fallback.
---

When recording video and audio separately (external microphone, field
recorder), always create a sync point at the start of each take by
clapping hands once or using a clapboard. The sharp transient sound
creates a distinctive spike visible in both the camera's scratch audio
waveform and the external recorder's waveform. In your NLE (Premiere,
DaVinci Resolve, Filmora), align these spikes to achieve frame-accurate
sync. This is more reliable than automatic sync tools for problematic
recordings. Always record scratch audio on camera even when using
external audio -- it serves as the sync reference. For multi-camera
setups, timecode sync is preferred, but the clap method works as a
reliable fallback.
