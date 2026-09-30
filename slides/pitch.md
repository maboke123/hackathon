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

One answer, the source behind it and who vouches for it

<!--
Working name. Structure: problem (2 to 3), idea (4 to 6), live demo (7), demo backup (8 to 10), trust and impact (11 to 13).
-->

---

### The brief's own example

# One question. Four documents. No way to tell.

<div class="mock">
<div class="mock-row tint"><span class="grow"><strong>Havenkaai:</strong> "How much birth leave does a father get?"</span></div>
<div class="mock-row"><span class="grow">Birth leave quick guide</span><span class="label">Modified last week</span></div>
<div class="mock-row"><span class="grow">Werkinstructie geboorteverlof</span><span class="label">No owner</span></div>
<div class="mock-row"><span class="grow">Geboorteverlof</span><span class="label">Right title</span></div>
<div class="mock-row"><span class="grow">Geboorteverlof BE update 2023 (kopie)</span><span class="label">Emailed by a colleague</span></div>
</div>

<!--
call-01, agent-log, mail-01, SR-2026-048213.
The quick guide was "modified last week" by a template migration, not by a person. The third one is the Dutch rule. The fourth is a personal copy.
It happens more often: the meal voucher maximum was told as EUR 8 nine months after it went to EUR 10 (call-02), and the EUR 4,000 indexation cap sat in a Teams chat for two months (chat-03).
-->

---
layout: statement
---

# Your agent is only as trustworthy as its *sources*.

<!--
SD Worx already has search and an agent, and still has the problem. We do not replace either. We fix what they read from.
-->

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

### How it works

# The system does the admin. People confirm.

<div class="steps">
<div>
<span class="step-number">1</span>
<h2>Label</h2>
<p>Owner, last check, scope</p>
</div>
<div>
<span class="step-number">2</span>
<h2>Link</h2>
<p>Replaces, contradicts, copy of</p>
</div>
<div>
<span class="step-number">3</span>
<h2>Own</h2>
<p>Every source has an owner</p>
</div>
<div>
<span class="step-number">4</span>
<h2>Answer</h2>
<p>One source, with its reasons</p>
</div>
</div>

<!--
Label: owner, last check and scope are read from every file. A classifier proposes the rest, and a proposal counts once a person confirms it.
Link: the graph records why sources are related (replaces, contradicts, copy of, based on).
Own: conflicts and changes land in the owner's queue.
Built on the synthetic corpus: 22 documents, emails, calls, meetings, chats and tickets.
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

---
layout: section
---

### Live demo

# Lotte takes the same call again

<!--
Switch to the app. It opens on Ask. Follow the demo script in docs/plan.md, section 6.
If the live demo runs, skip slides 8 to 10 and continue at "AI proposes". They are the backup if the app or the wifi fails.
-->

---

### Demo 1: the answer

# One answer. The rest is set aside.

<div class="mock ask">
<div class="mock-row tint answer"><span class="grow"><span class="eyebrow">Answer</span>20 days of birth leave. The employer pays the first 3 days, the health insurance fund the other 17.</span></div>
<div class="mock-row"><span class="field"><span class="muted">Source</span><span class="link">Geboorteverlof België</span></span><span class="field grow"><span class="muted">Owner</span><span class="link">Pieter De Smedt</span></span><span class="info-dot">i</span></div>
</div>

<p class="section-label">Found, but set aside</p>

<div class="mock ask">
<div class="mock-row"><span class="grow"><span class="link">Werkinstructie geboorteverlof</span> <span class="label bad">Replaced</span></span><span class="info-dot">i</span></div>
<div class="mock-row"><span class="grow"><span class="link">Birth leave quick guide</span> <span class="label bad">Replaced</span></span><span class="info-dot">i</span></div>
<div class="mock-row"><span class="grow"><span class="link">Geboorteverlof</span> <span class="label bad">Other country</span></span><span class="info-dot">i</span></div>
</div>

<!--
Rules pick the document, a language model never does. Only source and owner are shown. The info button holds the reasons: checked 12 June 2026, scope Belgium, confirmed in the customer service channel. Every title opens the document at the passage.
-->

---

### Demo 2: a conflict

# No guess. The owner decides.

<div class="mock">
<div class="mock-row tint"><span class="grow"><strong>Two sources disagree.</strong> Ask Pieter De Smedt.</span><span class="label warn">In Pieter's queue</span></div>
<div class="mock-row"><span class="grow">Indexering PC 200, januari 2026</span><span class="muted">Whole salary indexed</span></div>
<div class="mock-row"><span class="grow">Legal update, June 2026</span><span class="muted">Only the first EUR 4,000</span></div>
<div class="mock-row"><span class="btn primary">Update the document</span><span class="btn">Keep the document as it is</span></div>
</div>

<!--
call-03, doc-08, mail-05, chat-03. Ask shows no answer and names Pieter. The conflict lands in his queue with a draft built from the legal update. After one click, the same question is answered from doc-08, checked today.
-->

---

### Demo 3: a rule changes

# One change. Everything based on it is checked.

<div class="mock">
<div class="mock-row tint"><span class="grow"><strong>Maaltijdcheques vanaf 1 januari 2026</strong></span><span class="label ok">EUR 8 to EUR 10</span></div>
<div class="mock-row child"><span class="grow">Werkinstructie maaltijdcheques</span><span class="label warn">Needs check</span></div>
<div class="mock-row child"><span class="grow">Veldra answer, September 2026</span><span class="label warn">Correct the answer</span></div>
</div>

<!--
doc-07 is the parent, doc-06 is based on it, SR-2026-047102 answered from doc-06. Only the Belgian scope is flagged, Dutch documents are not touched. The same flow starts from a legal update: it builds on SD Worx Legal Watch, it does not replace it.
After a call the graph also updates itself: the call is linked to its ticket, outdated sources go to their owner, and a question nobody could answer becomes a draft. A person confirms each step (plan section 3.8).
-->

---
layout: two-cols
---

### Human in the loop

# AI proposes. A person decides.

::left::

## The system

- Proposes labels and links
- Drafts from chats and emails

::right::

## A person

- Confirms in one click
- Owns every source

<!--
The answer itself is picked by rules on confirmed data, never by a language model. That is the trust argument. 64% of employees say AI systems should explain their decisions (sd-worx-briefing.md, S36).
What it never does: change a document without its owner, send a customer anything without a person clicking send, rank colleagues, or analyse emotion in calls. That keeps us clear of the AI Act (emotion recognition at work) and GDPR article 22.
-->

---

### Why it matters

# One wrong rule repeats across thousands of payslips

<div class="cols-3">
<div>
<div class="big-number">6 million</div>
<p class="muted">payslips a month</p>
</div>
<div>
<div class="big-number">98 + 66</div>
<p class="muted">Belgian joint committees</p>
</div>
<div>
<div class="big-number">60%</div>
<p class="muted">of payroll leaders struggle to keep up</p>
</div>
</div>

<!--
6 million payslips a month in more than 30 countries: David Smets' talk (challenge-briefing.md).
98 joint committees + 66 sub-committees on 1 January 2026: FPS Employment (hr-research.md, R26).
60% struggle to keep up with changing labour laws: Forvis Mazars European payroll study 2025, 1,000+ leaders in 13 markets (hr-research.md, R28). Check both at the source before the final.
-->

---
layout: section
---

# We did not build another agent. We built the layer underneath it.

<!--
Close. The same graph also answers the brief's first example: Elif taking over Veldra (the Nike example) sees per country who owns what and which documents are outdated.
-->
