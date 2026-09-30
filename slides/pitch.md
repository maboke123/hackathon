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

Every answer says which source it used, who vouches for it and why the others were not used

<!--
Working name. Structure: problem (2 to 4), idea (5 to 7), live demo (8), demo backup (9 to 12), trust and impact (13 to 16).
-->

---

### The brief's own example

# One question. Four documents. No way to tell.

<div class="mock">
<div class="mock-row tint"><span class="grow"><strong>Inge Claes, Havenkaai:</strong> "Youssef just became a father. How much birth leave does he get?"</span><span class="label">09:14</span></div>
<div class="mock-row"><span class="grow">Birth leave quick guide</span><span class="label">Modified last week</span></div>
<div class="mock-row"><span class="grow">Werkinstructie geboorteverlof</span><span class="label">No owner</span></div>
<div class="mock-row"><span class="grow">Geboorteverlof</span><span class="label">Right title</span></div>
<div class="mock-row"><span class="grow">Geboorteverlof BE update 2023 (kopie)</span><span class="label">Emailed by a colleague</span></div>
</div>

<p class="muted caption">Lotte answered 15 days. It is 20.</p>

<!--
call-01, agent-log, mail-01, SR-2026-048213, mail-12.
The quick guide was "modified last week" by a template migration, not by a person. The third one is the Dutch rule. The fourth is a personal copy.
-->

---

### Not a one-off

# The right answer existed. Nobody could tell which one it was.

<div class="cols-3">
<div>
<div class="big-number">15 days</div>
<p class="muted">Birth leave told to Havenkaai. It is 20. The two sources were edited last week by a template migration, not checked.</p>
</div>
<div>
<div class="big-number">EUR 8</div>
<p class="muted">Meal voucher maximum told to a Veldra employee in September, nine months after it went to EUR 10.</p>
</div>
<div>
<div class="big-number">2 months</div>
<p class="muted">The EUR 4,000 indexation cap sat in a Teams chat and in no document. The customer got a callback promise.</p>
</div>
</div>

<!--
All three are in the synthetic corpus: call-01 and mail-12, call-02 and SR-2026-047102, call-03 with chat-03 and SR-2026-047981.
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

# The system does the admin. People only confirm.

<div class="steps">
<div>
<span class="step-number">1</span>
<h2>Label</h2>
<p>Owner, last check and scope are read from every file. A classifier proposes the rest.</p>
</div>
<div>
<span class="step-number">2</span>
<h2>Link</h2>
<p>Replaces, contradicts, copy of, based on. The graph records why sources are related.</p>
</div>
<div>
<span class="step-number">3</span>
<h2>Own</h2>
<p>Every source has an owner. Conflicts and changes land in their queue.</p>
</div>
<div>
<span class="step-number">4</span>
<h2>Answer</h2>
<p>One source, its trust label, and a reason for every source it did not use.</p>
</div>
</div>

<!--
Built on the synthetic corpus: 22 documents, emails, calls, meetings, chats and tickets. Labels are parsed without AI. The classifier only proposes, and a proposal counts once a person confirms it.
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
Switch to the app. Follow the demo script in docs/plan.md, section 6.
If the live demo runs, skip slides 9 to 12 and continue at "AI proposes". They are the backup if the app or the wifi fails.
-->

---

### Demo 1: the answer

# One answer, and why the others were not used

<div class="mock">
<div class="mock-row tint"><span class="grow"><strong>20 days of birth leave.</strong> The employer pays the first 3 days, the health insurance fund the other 17.</span></div>
<div class="mock-row"><span class="grow muted">Geboorteverlof België, owner Pieter De Smedt</span><span class="label ok">Checked 12 June 2026</span><span class="label info">BE</span></div>
<div class="mock-row"><span class="grow">Werkinstructie geboorteverlof</span><span class="label bad">Replaced</span><span class="muted reason">Says 15 days. Replaced by the Belgian version.</span></div>
<div class="mock-row"><span class="grow">Birth leave quick guide</span><span class="label bad">Owner left</span><span class="muted reason">Annick Wouters left in 2024. Content from 2022.</span></div>
<div class="mock-row"><span class="grow">Geboorteverlof</span><span class="label">Other scope</span><span class="muted reason">Applies to the Netherlands. Havenkaai is Belgian.</span></div>
<div class="mock-row"><span class="grow">Geboorteverlof BE update 2023 (kopie)</span><span class="label">Copy</span><span class="muted reason">Personal copy. Use the original.</span></div>
</div>

<!--
Rules pick the document, a language model never does. Each rule leaves the reason you see on the right.
-->

---

### Demo 2: a conflict

# No guess. The owner settles it in one click.

<div class="mock">
<div class="mock-row tint"><span class="grow"><strong>Two sources disagree.</strong> Will staff above EUR 4,000 be fully indexed in January 2027?</span><span class="label warn">Sent to Pieter</span></div>
<div class="mock-row"><span class="grow">Indexering PC 200, januari 2026<br><span class="muted">The whole salary is indexed</span></span><span class="muted">Owned, January 2026</span></div>
<div class="mock-row"><span class="grow">Legal update, June 2026<br><span class="muted">Only the first EUR 4,000 gross is indexed</span></span><span class="muted">Newer, email</span></div>
<div class="mock-row"><span class="btn primary">Newer source is right, update the document</span><span class="btn">Document is right</span><span class="btn">Retire document</span></div>
</div>

<!--
call-03, doc-08, mail-05, chat-03. The tool names Pieter and puts the conflict in his queue with a draft built from the legal update and his own example in the legal channel. After one click, the same question gets an answer from doc-08, checked today.
-->

---

### Demo 3: a rule changes

# A rule changes once. Everything based on it is checked.

<div class="mock">
<div class="mock-row tint"><span class="grow"><strong>Maaltijdcheques vanaf 1 januari 2026</strong><br><span class="muted">Maximum face value EUR 8 to EUR 10</span></span><span class="label info">Legal-BE</span><span class="label ok">Updated</span></div>
<div class="mock-row child"><span class="grow">Werkinstructie maaltijdcheques<br><span class="muted">Customer service Belgium, still says <strong>EUR 8</strong></span></span><span class="label warn">Needs check</span></div>
<div class="mock-row child"><span class="grow">Veldra answer, September 2026<br><span class="muted">Relied on the work instruction</span></span><span class="label warn">Correct the answer</span></div>
<div class="mock-row"><span class="grow muted">Downstream coverage</span><span class="label">3 of 4 checked</span></div>
</div>

<!--
doc-07 is the parent, doc-06 is based on it, SR-2026-047102 answered from doc-06. Only the Belgian scope is flagged, Dutch documents are not touched. The same flow starts from a legal update: it builds on SD Worx Legal Watch, it does not replace it.
-->

---

### Demo 4: after the call

# The graph updates itself after every call

- The call is linked to its ticket and to the document it used.
- Outdated sources shown in the call go to their owner.
- Earlier answers from those sources are listed to correct.
- A question nobody could answer becomes a draft for the owner.
- A person confirms each step. Nothing is sent or changed without a click.

<!--
Plan section 3.8. AI only detects the topics and drafts the knowledge gap. Everything else is plain logic on the graph.
-->

---
layout: two-cols
---

### Human in the loop

# AI proposes. A person decides.

::left::

## The system

- Reads owner, dates and scope from every file
- Proposes labels and links, with its confidence
- Drafts a passage from chats and emails

::right::

## A person

- Confirms or corrects a proposal in one click
- Owns every source and settles conflicts
- Clicks send before anything reaches a customer

<!--
The answer itself is picked by rules on confirmed data, never by a language model. That is the trust argument. 64% of employees say AI systems should explain their decisions (sd-worx-briefing.md, S36).
-->

---

### Why it matters

# One wrong rule repeats across thousands of payslips

<div class="cols-3">
<div>
<div class="big-number">6 million</div>
<p class="muted">payslips a month at SD Worx, in more than 30 countries</p>
</div>
<div>
<div class="big-number">98 + 66</div>
<p class="muted">Belgian joint committees and sub-committees, each with its own rules</p>
</div>
<div>
<div class="big-number">60%</div>
<p class="muted">of payroll leaders struggle to keep up with changing labour laws</p>
</div>
</div>

<!--
6 million and 30+: David Smets' talk (challenge-briefing.md).
98 + 66 on 1 January 2026: FPS Employment (hr-research.md, R26).
60%: Forvis Mazars European payroll study 2025, 1,000+ leaders in 13 markets (hr-research.md, R28). Check both at the source before the final.
-->

---

### Built to be trusted

# What it never does

- Let a language model pick the answer
- Change a document without its owner
- Send a customer a message without a person clicking send
- Rank or score colleagues
- Analyse emotion or sentiment in calls

<!--
These keep us clear of the AI Act (emotion recognition at work, high-risk decisions) and GDPR article 22. Scores are for documents, never for people.
-->

---
layout: section
---

# We did not build another agent. We built the layer underneath it.

<!--
Close. The same graph also answers the brief's first example: Elif taking over Veldra (the Nike example) sees per country who owns what and which documents are outdated.
-->
