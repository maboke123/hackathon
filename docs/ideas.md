# Ideas

Candidate ideas for the SD Worx challenge. Add every idea here, even rough ones, and score them once the challenge is announced. The idea we pick moves to "Our idea" in [context.md](context.md).

For inspiration, see the idea directions in [sd-worx-briefing.md](sd-worx-briefing.md#8-idea-directions-suggestions-not-facts).

## Requirement for every idea: fast human review

Whatever we build, a person must be able to check the work quickly and easily. If AI pulls information out of messy data (emails, scanned documents, spreadsheets, free text), the result is not trusted until a human has reviewed it.

So every idea includes a review tool that:

- Shows what was extracted next to the source it came from, so the reviewer can check it at a glance.
- Lets the reviewer approve, correct or reject each item in as few clicks as possible.
- Is built for speed, so a reviewer can work through many items in a few minutes.

We do not know the challenge yet, so how this tool works is still open. It is a requirement, not a design.

## Red flags

Check every idea against this list before scoring it. Background is in [sd-worx-briefing.md](sd-worx-briefing.md) (sections 3 and 5).

**Hard stops.** Rework the idea until none of these apply.

- It infers employees' emotions (from voice, face, text or behaviour). Emotion recognition at work is banned under the AI Act since February 2025.
- The AI makes a final decision with a significant effect on a person (hiring, dismissal, promotion, a pay change, a performance rating) without a person confirming it. GDPR article 22 limits fully automated decisions, and SD Worx always has humans validate what matters. AI that prepares, flags or proposes such a decision is fine. Rule-based payroll calculation (applying the law and the sector agreement) is not what this is about.
- The demo depends on real personal data. Use the synthetic dataset.

**Watch-outs.** Not a reason to drop an idea, but design and pitch for them.

- It touches recruitment, promotion, termination, task allocation or performance monitoring. That is high-risk under the AI Act (applies from 2 December 2027): allowed, but show human review, logging and an explanation for each result.
- It scores or monitors individual behaviour or productivity. That clashes with the trust theme. Checking an individual's payroll or time data for errors is not this: it is SD Worx's core work.
- It handles health or well-being. Health data is sensitive under GDPR. Supporting HR processes (reintegration steps, reminders, aggregated absence figures) is fine. Replacing conversations with people or predicting who will get sick is not.
- It gives answers without showing why. Show the source, rule or data behind each output. 64% of employees want AI to explain how it reaches its answers.
- It overlaps an SD Worx product or past winner (Legal Watch, legal documents to validation rules, emails to system actions). A plain copy scores low. Building on them, for example Legal Watch changes turned into per-employee impact (briefing idea 4), is their line of work and may score well.

**Pitch note.** Frame the benefit as freeing people for advice and customer contact, not as cutting jobs. This is about how we present an idea, not a reason to reject it.

## How to add an idea

Copy the template below into the "Ideas" section, give the idea a short name and fill in what you know. Leave a field empty rather than guessing.

```md
### Idea name

- Proposed by:
- Problem: who struggles with what today. Add a number if you have one (see hr-research.md).
- Target user: employee, manager, HR or payroll admin, SD Worx consultant.
- Solution: what we build, in two or three sentences.
- Demo scenario: the steps the jury sees, in about three minutes.
- Data: which parts of the sample data we use and what we need to add.
- Human review: how a person checks and corrects the output quickly.
- Fit with SD Worx: the product, strategy or research theme it connects to.
- Feasibility tonight: what we can build in five hours and what is a stretch.
- Risks and open questions:
```

## Scoring

Score each idea from 1 to 5 per criterion. Replace the criteria with the jury criteria once they are announced.

Trust and oversight: a person confirms anything that significantly affects someone, and each output shows its source or reasoning. Proactive ideas (catching a problem before it happens) count under value for SD Worx.

| Idea                                        | Fits the challenge | Value for SD Worx | Trust and oversight | Demo impact | Buildable tonight | Total |
| ------------------------------------------- | ------------------ | ----------------- | ------------------- | ----------- | ----------------- | ----- |
| Legal rulebook with an owner for every rule | 5                  | 5                 | 5                   | 4           | 4                 | 23    |
| Trust label on every answer                 | 5                  | 4                 | 5                   | 5           | 4                 | 23    |
| Trust graph                                 | 5                  | 4                 | 5                   | 4           | 4                 | 22    |
| Change-triggered re-verification            | 4                  | 5                 | 5                   | 4           | 3                 | 21    |
| Customer knowledge map                      | 4                  | 4                 | 4                   | 4           | 3                 | 19    |
| Knowledge handover on role change           | 4                  | 4                 | 4                   | 3           | 4                 | 19    |
| Answer cards from resolved questions        | 3                  | 4                 | 4                   | 3           | 4                 | 18    |

Scores above are a first pass by Roan on 30 September. Trust graph scores are a first proposal. Change them as a team.

## Ideas

All six start from the challenge (see [challenge-briefing.md](challenge-briefing.md)). None is a search engine or a chat agent. Each adds the trust signals from the brief (owner, freshness, scope, people) to knowledge SD Worx already has.

**Team direction (Roan, 30 September):** a large part of SD Worx's work is keeping up with legal rules: labour law, tax, social security and sector agreements in more than 30 countries. Customers and their employees only get the right pay and the right answers if that legal knowledge is current. So legal knowledge is our preferred focus: it must be stored in one place, split into small parts, and every part must have a named person responsible for keeping it up to date. The first idea below works this out. Ideas two and three fit inside it.

### Legal rulebook with an owner for every rule

- Proposed by: Roan
- Problem: legal knowledge (rates, thresholds, deadlines, procedures per country and sector) is spread over documents, emails and people's heads. A document can be half right: one paragraph is current, another is outdated. Ownership per document is too coarse, because nobody feels responsible for a single number inside a 20 page manual. Belgium alone has 98 joint committees and 66 sub-committees with their own rules (hr-research.md, R26), and 60% of payroll leaders say they cannot keep up with changing labour laws (R28).
- Target user: SD Worx legal and payroll experts (owners), service colleagues and consultants (readers). Indirectly customers and employees in My SD Worx, who get answers based on it.
- Solution: split legal knowledge into small rule cards, one per rule (for example "meal vouchers, Belgium: maximum face value EUR 10, employer share at most EUR 8.91, since 1 January 2026"). Every card has one named owner, a scope (country, sector or joint committee, product), a valid from date, the legal source and a "last verified" date. Documents and answers link to cards instead of copying the numbers, so a change is made once and shows up everywhere. When a card is not verified in time, or a law changes, the owner gets it in a review queue. Cards without an owner are shown as a red flag.
- Demo scenario: the service colleague from the brief gets the meal voucher question. The answer shows the rule card: EUR 10, owner Sofie Peeters (legal expert, Belgium), verified 12 days ago, source Royal Decree. Then a change comes in (for example the January 2027 indexation). The affected cards and every document that uses them are flagged, the owner confirms the new value in one click, and the answer is up to date everywhere. An overview shows coverage: how many rules per country have an owner and are verified.
- Data: 30 to 50 synthetic rule cards for Belgium from sd-worx-briefing.md section 6 (meal vouchers, eco vouchers, RSZ 13.07%, holiday pay, indexation, flexi-jobs, mobility budget), a few for the Netherlands to show scope, a small seed of SD Worx experts as owners (the existing sample data is a customer company, not SD Worx staff) and a handful of documents that reference the cards.
- Human review: the owner sees the old value, the proposed new value and the legal source side by side, and confirms, corrects or rejects in one click. Nothing changes without the owner.
- Fit with SD Worx: legal compliance is their core promise and where errors cost the most. Builds on Legal Watch and their 2025 internal winner (legal documents to validation rules). Answers the brief's owner, freshness and scope signals at the level of each rule.
- Feasibility tonight: rule cards, owners, scope, the review queue and the coverage overview are buildable with seeded data. Linking documents to cards is buildable if we write the documents ourselves. Extracting cards from existing documents automatically is a stretch.
- Risks and open questions: must not look like a legal database. Lead with ownership and freshness, not with search. How small is a "rule"? Start with one number or one procedure step per card.

### Trust label on every answer

- Proposed by: Roan
- Problem: a service colleague on the phone gets three or four documents for one question and cannot tell which is right: no owner, "edited last week", wrong country (example 2 in the brief).
- Target user: SD Worx service colleague answering customer and employee questions.
- Solution: every document or answer gets a trust label with four fields: owner, last verified (not last edited), scope (country, product, customer) and who else knows this. Results that do not match the caller's scope or have not been verified in a set period are pushed down and marked. We show it as a layer on top of what already exists (their search or internal agent), not as a replacement.
- Demo scenario: a Belgian employer calls about the new meal voucher maximum. Before: four documents, no way to choose. After: the same four with labels. One is verified by its owner 12 days ago for Belgium, one is for the Netherlands, one has no owner and was last verified in 2023, one still says EUR 8. The colleague answers in seconds and can see who to ask.
- Data: a synthetic set of 30 to 50 internal knowledge documents (policies, how-tos, checklists) across countries and products, with a small seed of SD Worx experts as owners (the existing sample data is a customer company). To add: document seed with scope, owner, verified date and content.
- Human review: owners confirm or correct the proposed label (owner, scope) in one click, with the document next to it.
- Fit with SD Worx: fixes example 2 directly. Makes their existing agent and search more useful instead of competing with them.
- Feasibility tonight: document list with labels, scope filter and the before and after view are buildable. Automatic scope detection from content is a stretch (can be seeded).
- Risks and open questions: needs a clear rule for "verified". Must not look like a search engine: lead with the label and the phone scenario, not with a search box.

### Change-triggered re-verification

- Proposed by: Roan
- Problem: documents go out of date silently when a law, rate or product changes. Nobody knows which documents a change affects. 60% of payroll leaders say they cannot keep up with changing labour laws (hr-research.md, R28).
- Target user: document owners and knowledge managers at SD Worx.
- Solution: when a change comes in (for example from Legal Watch: meal voucher maximum from EUR 8 to EUR 10 on 1 January 2026), the tool finds every document that mentions the old rule, marks it "needs check" and puts it in the owner's review queue. The owner sees the change and the affected passage side by side and confirms, updates or retires the document.
- Demo scenario: publish one change. Seven documents in three countries light up, only the four Belgian ones are flagged. The owner clears the queue in a minute. The trust label (idea above) turns from "needs check" to "verified today".
- Data: the same document set, plus a short list of real Belgian changes from the briefing (meal voucher EUR 10, indexation 2.21%, centenindex, 2026 absence reform).
- Human review: the core of the idea. AI proposes which passages are affected; the owner decides.
- Fit with SD Worx: builds on Legal Watch and on their past winning idea (legal documents to validation rules), which the briefing marks as their line of work. Proactive, which counts under value.
- Feasibility tonight: matching on known values (EUR 8, 6.91) is easy and reliable for a demo. Semantic matching is a stretch.
- Risks and open questions: works best combined with the trust label. Could be the "freshness" half of one product.

### Customer knowledge map

- Proposed by: Roan
- Problem: a new account owner for a large customer in several countries does not know who to call or which document to trust (example 1 in the brief, Nike).
- Target user: new account owner or customer success manager.
- Solution: one page per customer with a grid of countries and products. Each cell shows the responsible team and contact person, the key documents with their trust label and open issues. From it we generate an onboarding pack: who to meet in week one and what to read.
- Demo scenario: a fictional multi-country customer is handed to a new account owner. They open the map, see eight countries and five products, click Belgium and Pay, see the owner and two verified documents, and download the week one plan.
- Data: a fictional customer with contracts per country and product, a team roster (from sample data) and documents.
- Human review: the outgoing owner or team leads confirm each cell before the pack is shared.
- Fit with SD Worx: example 1, multi-country growth, My SD Worx as the front door.
- Feasibility tonight: the grid and detail views are straightforward with seeded data. The generated pack is a stretch.
- Risks and open questions: can look like a CRM dashboard. Needs the trust signals to stand out.

### Knowledge handover on role change

- Proposed by: Roan
- Problem: when someone leaves or changes role, the documents they own lose their owner and what is in their head is lost. The presenter changed roles six times in 16 years.
- Target user: the person leaving, their manager and the person taking over.
- Solution: an HR event (leaver or role change in the HR system) starts a handover. The tool lists everything the person owns or is the go-to person for, proposes a new owner for each item and asks the leaver five short questions per topic to capture what is not written down. The successor confirms.
- Demo scenario: an account manager moves to another team. The handover shows 14 documents and 3 customers they own, reassigns them in a few clicks and turns a short recorded answer into a draft note the successor approves.
- Data: employee sample data (roles, managers) plus the document set.
- Human review: the successor and manager approve each reassignment and each captured note.
- Fit with SD Worx: uses HR data, which is their core business. Also a product they could sell to customers.
- Feasibility tonight: the reassignment flow is easy. Capturing tacit knowledge well is harder.
- Risks and open questions: solves a cause, but the jury may find the link to find, trust and share less direct than the first two ideas.

### Answer cards from resolved questions

- Proposed by: Roan
- Problem: the answer to a tricky question often lives in one email thread or one person's head. The next colleague with the same question starts again.
- Target user: service colleagues and their team leads.
- Solution: when a question is resolved, the tool drafts a short answer card from the thread (question, answer, source, scope). A named expert approves it. Cards carry the same trust label and expire unless re-verified.
- Demo scenario: a resolved email thread becomes a draft card; the expert approves it with one edit; a colleague later gets the approved card first, with owner and date.
- Data: synthetic support threads plus the document set.
- Human review: the draft card next to the source thread, approve or edit in one click.
- Fit with SD Worx: fits the service example. Close to their 2025 runner-up (emails to system actions).
- Feasibility tonight: buildable with an LLM call and a review screen.
- Risks and open questions: closest to "another AI agent" and to a past winner. Keep it as a feature of the first idea rather than the main idea.

### Conflict detector

- Proposed by: Yendric (not scored yet)
- Problem: two documents on the same topic say different things.
- Solution: detect contradictions, show them side by side, send them to the owners to settle one canonical version.

### Save the colleague's answer

- Problem: the best answers are in Teams chats, calls and emails, not in documents.
- Solution: one click turns a reply into a checked snippet with owner and scope, reviewed by the owner.

### Who knows this

- Proposed by: Yendric (not scored yet)
- Problem: people know who to call only through their network.
- Solution: an opt-in expertise map per product and country from authorship and answered questions. No ranking of individuals.

### Scope tagging

- Proposed by: Yendric (not scored yet)
- Problem: "right title, wrong country".
- Solution: AI proposes country, customer and product tags on existing documents, a person confirms them in a fast review screen.

### Trust graph

Working name. Game plan: [plan.md](plan.md). It combines the trust label, the conflict detector and change-triggered re-verification above, with typed links between documents as the data structure.

- Proposed by: team, 30 September 2026.
- Problem: the second example from the brief. A service colleague has a customer on the phone, asks the internal agent and gets three documents: one without an owner, one edited last week, one from another country. A colleague emails a fourth. Nobody can tell which one to trust, and the customer waits. The agent is not the problem. The sources it retrieves from carry no owner, freshness or scope, and nothing records that one document replaced or contradicts another.
- Target user: SD Worx service colleague (asks) and document owner (reviews).
- Solution: a knowledge graph under search and RAG. Documents carry owner, scope (country, customer, team), keywords and the date they were last checked. Typed links between documents record why they are related: `supersedes`, `contradicts`, `variant_of`, `duplicate_of`, `supports` and `answered_with`. A question returns one answer plus every document that was not used and the reason. When the graph cannot tell which of two sources is right, it does not guess: it names the person to call and puts the conflict in the owner's review queue. Resolving it creates a link, so the next answer is right.
- Demo scenario: see [plan.md](plan.md#6-demo-script). In short, using the knowledge corpus: (1) the birth leave call from the brief (Havenkaai, Lotte Verhaegen) resolves to _Geboorteverlof België_ (20 days, owner Pieter De Smedt) with a reason for each of the four documents she had, (2) the EUR 4,000 indexation cap in a June legal update contradicts the January indexation document, the tool does not guess, Pieter resolves it in one click and the same question now gets an answer, (3) the trust summary shows open conflicts and documents without an active owner per team.
- Data: the synthetic knowledge corpus in `apps/web/src/lib/data/seed/knowledge` (22 documents plus emails, calls, meetings, chats and tickets, see `sample-data.md`). Owner, last check and scope are parsed from the files; links are seeded by hand tonight. `ground-truth.json` is only used to test our labels. New tables: colleagues, customers, knowledge items, links and review items.
- Human review: the review queue. Conflicts shown side by side with the differing passage highlighted, one click per outcome ("A is correct", "B is correct", "both correct, different scope"). Suggested links are never used until confirmed. Every resolution is logged with who and when.
- Fit with SD Worx: answers "find, trust and share" directly and uses the brief's own example. It is not another agent: it is the trust layer their existing agent lacks. 64% of employees say AI systems should explain their decisions (SD Worx research, `sd-worx-briefing.md` section 4), and every answer here explains what it used and what it rejected.
- Feasibility tonight: data model, seed, ask page with rule-based ranking and the review queue are buildable. The answer text can be the passage from the chosen document, so no LLM is needed tonight. Stretch: LLM summary of the chosen document, LLM-suggested links on upload, graph view.
- Risks and open questions:
  - Pitched as a "global knowledge graph" it sounds like a platform, not a focus problem. Pitch the call scenario, show the graph through the answer.
  - Links maintained by hand go stale. Answer: the system proposes links, owners confirm them, and conflicts come out of normal use.
  - The trust summary must be per topic or team, not a ranking of individual owners (red flag: monitoring individuals).
  - The existing app is a Havenkaai HR app. This idea is an internal SD Worx tool. See the open decisions in [plan.md](plan.md#8-open-decisions).

### Living answers

- Proposed by: team, 30 September 2026 (not scored yet). Slides: "Living answers" in `slides/ideas.md`.
- Problem: a fixed document does not fix the answers already sent from it. In September 2026 a Veldra employee was still told the meal voucher maximum is EUR 8 (call-02, ticket SR-2026-047102), nine months after it went to EUR 10.
- Solution: when a consultant answers a customer, they confirm which document the answer came from (suggested, one click). When someone later publishes a document that supersedes that one, the tool lists every customer who got an answer from the old document. The author chooses to notify all, a selection or nobody, and checks a message drafted from the new document. It goes out in the name of the consultant who answered.
- Fit: an answer links to its source with `answered_with`, not `supports`, because an answer does not prove a document is right. A new `supersedes` link is the trigger: the `answered_with` links on the replaced document are the customers to notify. Covers "share" and could land in My SD Worx as an answer card that updates.
- Human review: nothing is sent unless the author chooses to. Only customers who actually received an answer from the old document are listed.
