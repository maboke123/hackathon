---
theme: none
title: Trust graph
layout: cover
fonts:
  provider: none
colorSchema: light
aspectRatio: 16/9
canvasWidth: 1120
transition: fade
---

# Trust graph

A trust layer between SD Worx's knowledge and the agent it already has

---
clicks: 1
---

### What we build

# Not another agent. The layer it stands on.

<TrustLayer :step="$clicks" />

<!--
Click 0: today, the agent reads straight from SharePoint, OneDrive and mail. It gets four documents and the colleague has to guess.
Click 1: the trust graph slides in between. Same agent, same sources, but every document now carries owner, last check, scope and links.
-->

---
clicks: 2
class: graph-slide
---

<TrustGraph :step="$clicks" />

<!--
Click 0: every item from the synthetic corpus. On disk they all look the same.
Click 1: the links and statuses appear. Blue is current and owned, red is outdated, yellow is a draft.
Click 2: zoom in on birth leave, the brief's own example. doc-05 is the answer, owned by Pieter, checked 12 June 2026.
-->
