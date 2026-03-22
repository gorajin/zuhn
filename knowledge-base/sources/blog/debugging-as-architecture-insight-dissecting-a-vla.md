---
id: SRC-260321-BF7C
type: blog
title: 'Debugging as architecture insight: dissecting a VLA'
author:
  - '@type': Person
    name: Avik De
    url: 'https://substack.com/@avikde'
    description: 'Safe, efficient robotics & AI -- Robotics Ph.D. and founder'
    identifier: 'user:356074997'
    image:
      '@type': ImageObject
      contentUrl: >-
        https://substackcdn.com/image/fetch/$s_!E5et!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F30589b07-e0a0-4de5-8997-78db1ed3f65b_1290x1290.png
      thumbnailUrl: >-
        https://substackcdn.com/image/fetch/$s_!E5et!,w_128,h_128,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F30589b07-e0a0-4de5-8997-78db1ed3f65b_1290x1290.png
url: 'https://substack.com/home/post/p-188827303'
date_ingested: '2026-03-22'
insight_count: 4
site_name:
  '@type': Organization
  name: 'min{power}'
  url: 'https://www.avikde.me'
  description: >-
    Explorations in computing and robotics focused on power-efficiency and
    safety -- personal posts by Avik De, robotics Ph.D. and founder
  interactionStatistic:
    '@type': InteractionCounter
    name: Subscribers
    interactionType: 'https://schema.org/SubscribeAction'
    userInteractionCount: 100
  identifier: 'pub:7287367'
  logo:
    '@type': ImageObject
    url: >-
      https://substackcdn.com/image/fetch/$s_!Z7FY!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5ea21ccc-90aa-4750-861d-eb48a6144608_176x176.png
    contentUrl: >-
      https://substackcdn.com/image/fetch/$s_!Z7FY!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5ea21ccc-90aa-4750-861d-eb48a6144608_176x176.png
    thumbnailUrl: >-
      https://substackcdn.com/image/fetch/$s_!Z7FY!,w_128,h_128,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5ea21ccc-90aa-4750-861d-eb48a6144608_176x176.png
  image:
    '@type': ImageObject
    url: >-
      https://substackcdn.com/image/fetch/$s_!Z7FY!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5ea21ccc-90aa-4750-861d-eb48a6144608_176x176.png
    contentUrl: >-
      https://substackcdn.com/image/fetch/$s_!Z7FY!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5ea21ccc-90aa-4750-861d-eb48a6144608_176x176.png
    thumbnailUrl: >-
      https://substackcdn.com/image/fetch/$s_!Z7FY!,w_128,h_128,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5ea21ccc-90aa-4750-861d-eb48a6144608_176x176.png
publish_date: '2026-02-26T15:46:18+00:00'
word_count: 2977
---
Technical deep-dive on debugging Vision-Language-Action (VLA) robotics models from first principles. The author systematically probes X-VLA through camera ablations, counterfactual prompting, and attention visualization, uncovering three structural findings: spatial understanding is tied to training camera geometry, the action manifold is object-centric not spatially general, and compositional generalization breaks down at sub-1B scale.
