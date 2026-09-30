---
theme: none
title: Trust graph, slide bank
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
Slide bank. Every idea we have is one slide, so the team can pick what goes into pitch.md.
Working name. Name options are at the end of the deck.
-->

---
layout: section
---

### Part 1

# The problem

---
layout: statement
---

### 30 September, 09:14

# Havenkaai calls about birth leave. The customer *waits* while Lotte reads four documents.

<!--
Corpus: call-01. Inge Claes (HR, Havenkaai) calls Lotte Verhaegen (payroll consultant, customer service Belgium) about birth leave for Youssef Benali.
This is the brief's second example, told with our corpus.
-->

---

### What the agent returned

# Four documents, no way to choose

| Document                              | What Lotte sees                        | What is really going on                           |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| Werkinstructie geboorteverlof         | No owner                               | Written in 2021, says 15 days                     |
| Birth leave quick guide               | Modified last week                     | Only a template migration. Content from 2022      |
| Geboorteverlof                        | Right title                            | Applies to the Netherlands                        |
| Geboorteverlof BE update 2023 (kopie) | Emailed by a colleague                 | Personal OneDrive copy                            |

<p class="muted small">The correct document (20 days) sits on the legal site. The agent never returned it. Lotte answered 15 days.</p>

<!--
Corpus: agent-log, doc-01, doc-02, doc-03, doc-04 (mail-01), ticket-02, mail-12 (the customer comes back: Youssef read online it is 20).
-->

---
layout: statement
---

# Modified is *not* verified.

<!--
A brand template migration (svc-template-migration) touched every file on three Belgian SharePoint sites between 22 and 26 September 2026. The "modified last week" date says nothing about the content.
-->

---

### The four signals from the brief

# What Lotte needed was never in the document

- **Owner.** Who vouches for this, and are they still here?
- **Freshness.** When was it last checked, not last edited?
- **Scope.** Which country, customer, joint committee or product?
- **People.** Who else has answered this before?

<!--
These four come straight from David Smets' two examples (challenge-briefing.md).
-->

---

### Why it matters at SD Worx scale

# The maze grows with every country and product

<div class="cols-3">
<div>
<div class="big-number">10,000</div>
<p class="muted">colleagues serving 100,000 customers</p>
</div>
<div>
<div class="big-number">100+</div>
<p class="muted">payroll services in more than 30 countries</p>
</div>
<div>
<div class="big-number">164</div>
<p class="muted">Belgian joint committees and sub-committees, each with its own rules</p>
</div>
</div>

<!--
10,000, 100,000, 100+, 30+: David Smets' talk (challenge-briefing.md).
164 = 98 joint committees + 66 sub-committees on 1 January 2026 (hr-research.md, R26). Consider showing "98 + 66" instead of the sum.
-->

---

### Keeping up with the law

# 60% of payroll leaders struggle to keep up with changing labour laws

<p class="muted">Forvis Mazars, 2025, 1,000+ payroll, HR and finance leaders in 13 European markets</p>

<!--
hr-research.md, R28. Check at the source before it goes into the final pitch.
-->

---
layout: statement
---

# Your agent is only as trustworthy as its *sources*.

<!--
The pitch line from plan.md. SD Worx does not want another agent and already has search. We fix what the agent retrieves from.
-->

---
layout: section
---

### Part 2

# The trust graph

---

### Every item carries its trust signals

# Owner, last check, scope and who knows it

<div class="mock">
<div class="mock-row"><span class="grow"><strong>Geboorteverlof België</strong><br><span class="muted">Legal-BE / Kennisbank verloven</span></span><span class="label ok">Checked 12 June 2026</span></div>
<div class="mock-row"><span class="muted" style="width:9rem">Owner</span><span class="grow">Pieter De Smedt, legal knowledge centre Belgium</span></div>
<div class="mock-row"><span class="muted" style="width:9rem">Scope</span><span class="grow"><span class="label info">BE</span> <span class="label info">All customers</span> <span class="label info">All joint committees</span></span></div>
<div class="mock-row"><span class="muted" style="width:9rem">Also answered by</span><span class="grow">Pieter in the customer service channel, 30 September 12:10</span></div>
<div class="mock-row"><span class="muted" style="width:9rem">Last modified</span><span class="grow">24 September 2026 by the template migration <span class="label">Ignored</span></span></div>
</div>

<!--
Corpus: doc-05, chat-01. Labels are parsed from the documents themselves tonight (owner line, version table, SharePoint site in the path).
-->

---

### Typed links

# The graph records why two documents are related

| Link           | Meaning                              | Corpus example                                   |
| -------------- | ------------------------------------ | ------------------------------------------------ |
| `supersedes`   | A replaces B                         | 20 day document replaces the 15 day instruction  |
| `contradicts`  | A and B disagree, nobody decided yet | June legal update versus the January indexation  |
| `variant_of`   | Same topic, other scope              | Netherlands version of birth leave               |
| `duplicate_of` | Same content, not the official copy  | OneDrive copy that was emailed around            |
| `supports`     | A chat, call or email confirms it    | Pieter's answer in the service channel           |

<!--
Only confirmed links decide which document is used. Suggested links wait in the owner's queue.
-->

---

### Same question, our tool

# One answer, and why the others were not used

<div class="mock">
<div class="mock-row tint"><span class="grow"><strong>20 days of birth leave.</strong> The employer pays the first 3 days. The mutualiteit pays the other 17 at 82% of capped gross. Take it within 4 months of the birth.</span></div>
<div class="mock-row"><span class="grow muted">Geboorteverlof België, owner Pieter De Smedt</span><span class="label ok">Checked 12 June 2026</span><span class="label info">BE</span></div>
<div class="mock-row"><span class="grow">Werkinstructie geboorteverlof</span><span class="label bad">Replaced</span><span class="muted" style="width:22rem">Says 15 days. Replaced by Geboorteverlof België.</span></div>
<div class="mock-row"><span class="grow">Birth leave quick guide</span><span class="label bad">Owner left</span><span class="muted" style="width:22rem">Annick Wouters left in 2024. Content from 2022.</span></div>
<div class="mock-row"><span class="grow">Geboorteverlof</span><span class="label">Other scope</span><span class="muted" style="width:22rem">Applies to the Netherlands. Havenkaai is Belgian.</span></div>
<div class="mock-row"><span class="grow">Geboorteverlof BE update 2023 (kopie)</span><span class="label">Copy</span><span class="muted" style="width:22rem">Personal copy. Use the original.</span></div>
</div>

<!--
The core demo moment. Figures from doc-05 and ground-truth f-birth-leave-be.
-->

---
layout: statement
---

# Rules pick the document. A language model *never* does.

<!--
The trust argument. Every rule attaches a reason a person can read and check. 64% of employees say AI systems should explain their decisions (SD Worx research, sd-worx-briefing.md section 4, S36).
-->

---

### The ranking rules

# Every rule leaves a reason on screen

| Rule                            | Effect           |
| ------------------------------- | ---------------- |
| Scope does not match the caller | Not used         |
| Replaced or duplicate           | Not used         |
| Owner has left                  | Lower, warning   |
| No owner                        | Lower, warning   |
| Not checked in 12 months        | Lower, warning   |
| Disagrees with a newer source   | No answer, owner is asked |

<!--
Full table with corpus examples in plan.md.
-->

---

### When the graph cannot tell

# No guess. It names the person to ask.

<div class="mock">
<div class="mock-row tint"><span class="grow"><strong>Two sources disagree.</strong> Will staff above EUR 4,000 be fully indexed in January 2027?</span><span class="label warn">Needs owner</span></div>
<div class="mock-row"><span class="grow">Indexering PC 200, januari 2026<br><span class="muted">Full indexation of the whole salary</span></span><span class="muted">Owned, January 2026</span></div>
<div class="mock-row"><span class="grow">Legal update, June 2026<br><span class="muted">Only the first EUR 4,000 gross is indexed</span></span><span class="muted">Newer, email</span></div>
<div class="mock-row"><span class="grow">Ask <strong>Pieter De Smedt</strong>, owner of indexation. He explained this in the legal channel.</span><span class="btn primary">Call Pieter</span><span class="btn">Send to his queue</span></div>
</div>

<!--
Corpus: call-03, doc-08, mail-05, chat-03. The model does not pick a side. This is scenario 2 in plan.md.
-->

---

### Review queue

# The owner settles it in one click

<div class="mock">
<div class="mock-row"><span class="grow"><strong>Conflict</strong> Indexering PC 200 versus legal update June 2026</span><span class="label warn">Asked during a call, 09:31</span></div>
<div class="mock-row"><span class="grow muted">Document: "Het percentage wordt op het volledige brutoloon toegepast."</span></div>
<div class="mock-row"><span class="grow muted">Newer source: "Alleen het deel van het brutoloon tot EUR 4.000 wordt geïndexeerd."</span></div>
<div class="mock-row"><span class="btn primary">Newer source is right, update the document</span><span class="btn">Document is right</span><span class="btn">Retire document</span><span class="btn">Assign to someone else</span></div>
</div>

<p class="muted small">Correcting costs the same one click as accepting. When fixing an AI error took extra typing, people accepted more wrong suggestions (Beck et al., 2025).</p>

<!--
hr-research.md section 7, R19. Quotes from doc-08 and mail-05.
-->

---

### The loop closes

# The next colleague gets the right answer

- Pieter's click creates a link and sets the last check to today.
- Lotte asks again: answered from the updated document.
- Worked example: EUR 5,000 gross gets EUR 150.40 instead of EUR 188.00.
- Nobody wrote a new document. The conflict came from a normal call.

<!--
Example from mail-05 (simulated, forecast 3.76%). Label as simulated on the slide if we keep it.
-->

---
layout: section
---

### Part 3

# Features to pick from

---

### Human in the loop

# AI proposes. A person decides what matters.

| Decided by rules or AI alone          | Always a person                          |
| ------------------------------------- | ---------------------------------------- |
| Scope filter, parsed labels           | Settling a conflict                      |
| Suggested labels and links (not used yet) | Confirming a link before it counts   |
| Usefulness score as a tie-break       | Anything with a legal or pay impact      |
| Ordering the review queue             | Retiring a document, changing an owner   |

<p class="muted small">Every decision is logged with who and when. The overseer can always override (AI Act, article 14).</p>

<!--
hr-research.md R18 (AI Act article 14(4): the person must be able to disregard, override or reverse the output). Our system is not high risk, but we follow the same rule.
-->

---

### Labelling with Jev

# A classifier answers typed questions about every item

| Question                                      | Answer type |
| --------------------------------------------- | ----------- |
| Which country does this apply to?             | Choice: BE, NL, FR, DE, ES, all |
| Which customer is it about?                   | Choice: Havenkaai, Veldra, none |
| Is this a reference document or a record?     | Choice      |
| Does it mention a date, rate or amount that expires? | Yes or no |
| Who in this list owns the topic?              | Choice from colleagues |

<!--
Jev by TypeSafe AI, released September 2026. It returns choices and scores with a calibrated confidence, and writes no text. Check the API and the claims at the source before the pitch.
-->

---

### Confidence decides the route

# Sure labels are suggested. Unsure ones go to a person.

<div class="mock">
<div class="mock-row"><span class="grow">Birth leave quick guide: country <strong>BE</strong></span><span class="label ok">0.97</span><span class="muted" style="width:16rem">Suggested, shown with the label</span></div>
<div class="mock-row"><span class="grow">Veldra handover notes: customer <strong>Veldra</strong></span><span class="label ok">0.94</span><span class="muted" style="width:16rem">Suggested, shown with the label</span></div>
<div class="mock-row"><span class="grow">Pay transparency FAQ: status <strong>draft</strong></span><span class="label warn">0.58</span><span class="muted" style="width:16rem">To the owner's queue</span></div>
<div class="mock-row"><span class="grow">Ecocheques FAQ: owner</span><span class="label bad">No answer</span><span class="muted" style="width:16rem">To the team's queue</span></div>
</div>

<!--
Scores in this mock are illustrative. Replace them with real Jev output if we run it on the corpus.
A null answer is useful: it means "I cannot tell", which is exactly when a person should look.
-->

---

### Usefulness score

# Which documents earn their place?

- Jev scores each document on usefulness for the questions colleagues ask.
- Inputs: agent log questions, tickets that relied on it, supporting chats and calls.
- Low score and not checked: proposed for retirement, the owner confirms.
- High score and not checked: first in the owner's queue.
- A score orders work and breaks ties. It never picks the answer.

<!--
Scores documents, never people. Retiring or keeping is always the owner's click.
Corpus: tickets.json (the document each resolution relied on) and agent-log.json.
-->

---

### Control items

# Old is not the same as wrong

- Holiday pay, ecocheques and Flex Income Plan documents are old but correct.
- They were reviewed, so they keep a green label.
- A tool that flags everything old gets ignored in a week.

<!--
From sample-data.md "Traps worth knowing". Good answer to a jury question on false alarms.
-->

---

### Hit during a call, not checked

# A stale document shows the colleague what to do next

<div class="mock">
<div class="mock-row tint"><span class="grow"><strong>Veldra account plan 2022</strong><br><span class="muted">Last checked November 2022. Owner Hilde Maes left in 2023.</span></span><span class="label bad">Not checked in 46 months</span></div>
<div class="mock-row"><span class="grow">Topic owner now: <strong>Jonas Peeters</strong>, global account owner</span><span class="btn primary">Ask Jonas</span></div>
<div class="mock-row"><span class="grow">Newer source for the cut-off: <strong>service agreement annex 2025</strong></span><span class="btn">Open annex</span></div>
<div class="mock-row"><span class="grow muted">This question was flagged for review, with the call as context</span><span class="label info">Sent to queue</span></div>
</div>

<!--
Corpus: doc-16 (2022 account plan, Hilde left), doc-18 (annex 2025, cut-off on the 18th).
The call itself becomes the reason for the review, so the owner knows it is urgent.
-->

---

### Routing when nobody owns it

# Owner, successor, team, in that order

| Situation                     | Goes to                                                 |
| ----------------------------- | ------------------------------------------------------- |
| Owner known and active        | The owner                                               |
| Owner has left                | Their successor, proposed from the HR record            |
| No owner, known site or team  | The team's knowledge inbox, a lead assigns it           |
| Nothing known                 | Knowledge and content operations (Ellen Goossens' team) |

<!--
The existing HR data is SD Worx's core business: leavers and role changes come from the HR system.
Corpus: Annick Wouters and Hilde Maes have left. Ellen Goossens is the knowledge manager in people.json.
-->

---

### Leavers and role changes

# Knowledge follows the successor

- An HR event starts it: Annick Wouters leaves the legal knowledge centre.
- Every document she owns gets a proposed new owner.
- Her successor confirms each one in the queue.
- Nothing is orphaned silently.

<!--
Idea "Knowledge handover on role change" in ideas.md. David Smets changed roles six times in 16 years.
-->

---

### The Nike example

# Elif takes over Veldra

| Fact           | What the documents say | Today                               |
| -------------- | ----------------- | ---------------------------------------- |
| Payroll cut-off BE | 20th          | 18th (annex 2025), 17th requested        |
| Escalation     | Wim Van den Broeck | Sofie Hermans since March 2025          |
| HR director    | Paul Verbeke      | Charlotte Dubois since June 2024         |
| Germany go-live | 1 April 2026     | Live since 1 July 2026                   |

<p class="muted small">The graph shows Elif which facts changed, who owns each one and which rule only lives in a chat.</p>

<!--
Corpus: doc-16, doc-17, doc-18, doc-19, ground-truth f-veldra-*. Old values: doc-16 and doc-17 (cut-off, escalation, HR director), doc-19 (Germany go-live).
The Spanish prorrateo rule is only in a chat (chat-02).
-->

---

### Before the customer meeting

# Check what you will need, before you need it

- Three days before the Veldra quarterly review, Elif gets a short list.
- Five documents about Veldra are not checked this year.
- Each goes to its owner with the meeting date as the deadline.
- Owners confirm in one click, or the document shows a warning in the meeting.

<!--
From idea.md: "voor de call met de customer dus periodisch aan de owner". Corpus: meet-01 (quarterly service review Q3).
-->

---

### Periodic check

# Every document has a next review date

- The owner picks the rhythm: 6, 12 or 24 months.
- Legal documents follow the legal calendar (indexation in January).
- Overdue documents drop in ranking and show a warning.
- One click confirms "still correct" and resets the date.

<!--
doc-05 already has "Volgende review: juni 2027" in its header. We parse that.
-->

---

### Legal changes

# A new law flags every document that depends on it

- The June 2026 legal update caps indexation at EUR 4,000.
- Documents linked to indexation go to their owners at once.
- Each owner sees the old passage and the new rule side by side.
- Builds on Legal Watch: from a legal change to every affected document.

<!--
Corpus: mail-04 and mail-05 (legal update newsletters). Link type based_on is the stretch in plan.md.
Legal Watch is an SD Worx product (sd-worx-briefing.md). Present as building on it, not replacing it.
-->

---

### Knowledge outside documents

# Calls, chats and meetings count as evidence

- The EUR 4,000 cap was explained in a chat before any document had it.
- The Spanish prorrateo rule exists only in a chat.
- Transcripts become records linked to the documents they support or contradict.
- One click turns a good answer into a draft the owner approves.

<!--
Corpus: chat-03 (cap), chat-02 (prorrateo), calls/ and meetings/. Idea "Save the colleague's answer" in ideas.md.
Records never answer on their own. They support a document or point to a person.
-->

---

### Who knows this

# People appear next to the answer, not in a ranking

- Owners and colleagues who answered the topic before.
- Built from authorship, chats and resolved tickets.
- Shown per topic, never as a score per person.
- Colleagues can opt out of being suggested.

<!--
Red flag in ideas.md: no scoring or monitoring of individuals.
-->

---

### Recurring questions

# Where the documentation is missing

| Topic                         | Questions this quarter | Documents with an active owner |
| ----------------------------- | ---------------------- | ------------------------------ |
| Birth leave, Belgium          | 9                      | 1 of 4                         |
| Indexation cap                | 6                      | 0 of 1 up to date              |
| Veldra Spain extra payments   | 3                      | 0, chat only                   |

<p class="muted small">Illustrative figures. Jev tags each agent question and ticket by topic.</p>

<!--
Numbers are placeholders. Compute them from agent-log.json and tickets.json before showing.
Frame as "where to write the next document", not as a performance metric.
-->

---

### Trust summary per team

# Is our knowledge in good shape?

| Team                           | Active owner | Checked in 12 months | Open conflicts |
| ------------------------------ | ------------ | -------------------- | -------------- |
| Legal knowledge centre Belgium | 90%          | 80%                  | 1              |
| Customer service Belgium (SME) | 40%          | 20%                  | 2              |
| Enterprise accounts            | 50%          | 30%                  | 3              |

<p class="muted small">Illustrative figures. Per team or topic, never per person.</p>

<!--
Compute from the seeded graph before using.
-->

---

### The graph, one document at a time

# No hairball. One document and its direct links.

<svg viewBox="0 0 900 300" width="900" height="300" style="font-family: var(--ds-font-body); font-size: 14px">
  <g stroke="var(--ds-neutral-400)" stroke-width="1.5">
    <line x1="210" y1="150" x2="560" y2="45" />
    <line x1="210" y1="150" x2="560" y2="115" />
    <line x1="210" y1="150" x2="560" y2="185" />
    <line x1="210" y1="150" x2="560" y2="255" />
  </g>
  <rect x="20" y="118" width="190" height="64" rx="8" fill="var(--ds-blue-50)" stroke="var(--primary)" />
  <text x="36" y="145" fill="var(--heading)" font-weight="600">Geboorteverlof België</text>
  <text x="36" y="166" fill="var(--muted-foreground)">Owner Pieter De Smedt</text>
  <g fill="var(--background)" stroke="var(--border)">
    <rect x="560" y="25" width="320" height="40" rx="8" />
    <rect x="560" y="95" width="320" height="40" rx="8" />
    <rect x="560" y="165" width="320" height="40" rx="8" />
    <rect x="560" y="235" width="320" height="40" rx="8" />
  </g>
  <g fill="var(--foreground)">
    <text x="576" y="50">Werkinstructie geboorteverlof</text>
    <text x="576" y="120">Geboorteverlof (Nederland)</text>
    <text x="576" y="190">Geboorteverlof BE 2023 (kopie)</text>
    <text x="576" y="260">Customer service channel, 12:10</text>
  </g>
  <g fill="var(--primary)" font-size="13">
    <text x="360" y="84">supersedes</text>
    <text x="370" y="128">variant_of</text>
    <text x="360" y="175">duplicate_of</text>
    <text x="370" y="218">supports</text>
  </g>
</svg>

<!--
Stretch in plan.md. The graph is shown per document, so it explains the answer instead of impressing with volume.
-->

---

### Where it sits

# A trust layer under the agent SD Worx already has

| Layer          | What                                                          |
| -------------- | ------------------------------------------------------------- |
| Sources        | SharePoint, OneDrive, Teams, email, calls, tickets            |
| Labelling      | Parser for what is written down, Jev for what is not          |
| Graph          | Items, typed links, owners, review items (Postgres)           |
| Rules          | Scope, links and freshness decide, each with a reason         |
| Consumers      | The internal agent, service colleagues, later My SD Worx      |

<!--
"Not another agent, not a SharePoint with search": the brief. This slide answers that head on.
-->

---

### Open to other agents

# Any agent can ask the graph what to trust

- The internal agent sends its candidates, gets them back ranked with reasons.
- Exposed over an API or MCP, so partner tools can use it too.
- A Spott recruiter's assistant could check a PC rule before a placement.

<!--
Spott is the prize partner and talks about MCP (spott-briefing.md). Keep it to one line in the pitch.
The Spott line is a possibility, not something Spott has asked for.
-->

---

### Customers see it too

# The same label in My SD Worx

- An employee asks about birth leave in the portal.
- The answer shows the owner team and the last check date.
- Fewer "is this still right?" calls to the service desk.

<!--
David Smets is the product owner of My SD Worx. This is the future vision slide, not tonight's build.
-->

---

### How we know it works

# Checked against an answer key

- The corpus has 13 facts with a known correct source.
- Our labels and rules pick the right source for __ of 13.
- Every miss is shown, not hidden.

<!--
Fill in the number from the answer key test (plan.md, person 4). Do not show the slide without a real number.
-->

---

### Guardrails

# What it does not do

- It does not rate people. Scores are for documents and topics.
- It does not decide on pay, contracts or legal content. Owners do.
- It does not read emotions from calls. Transcripts are used for facts only.
- It runs on synthetic data. No real personal data in the demo.

<!--
Red flags in ideas.md: emotion recognition is banned under the AI Act, GDPR article 22, no monitoring of individuals.
-->

---

### Tonight and on 20 October

# What we built and what comes next

<div class="cols-3">
<div>
<h2>Tonight</h2>
<p>Labels parsed from the corpus, typed links, answers with reasons, review queue with one click actions.</p>
</div>
<div>
<h2>Final, 20 October</h2>
<p>Jev labels and usefulness scores, legal change impact, handover on leaving, recurring questions.</p>
</div>
<div>
<h2>After</h2>
<p>Connect to the internal agent and My SD Worx. Pilot with one team, measure answers settled per week.</p>
</div>
</div>

<!--
Move items between columns depending on what we actually finish.
-->

---
layout: statement
---

# Four documents became one answer, *and a name to call* when it cannot be one.

<!--
Closing line, option A.
-->

---
layout: statement
---

# We did not build another agent. We made the agent's sources *trustworthy*.

<!--
Closing line, option B.
-->

---
layout: section
---

### For the team

# Name options

<!--
Candidates: Trust graph, Vouch, Checked, Provenance, Owned, Source of truth.
Criteria: short, says what it does, not "AI". Pick one before the deck is final.
-->

---
layout: section
---

### Thank you

# Questions
