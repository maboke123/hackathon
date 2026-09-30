# Game plan: trust graph

The one document for what we build, how it works, how we demo it and who does what. "Trust graph" is a working name.

It brings together Yarne's trust graph (typed links, a "not used" list with reasons, review queues, living answers), Roan's concept of legal knowledge that maintains itself (trust score with reasons, the graph updating after every call, owners in one click) and the features in the slide bank (`slides/ideas.md`). It also replaces Roan's demo script (`demo.md`). What is built tonight and what is a stretch is marked per part.

Background lives elsewhere: the event and past decisions in [context.md](context.md), the brief in [challenge-briefing.md](challenge-briefing.md), the corpus in [sample-data.md](sample-data.md). Other ideas we considered are in [ideas.md](ideas.md).

## 1. Problem

SD Worx knowledge is spread over documents, emails, chats, calls and people's heads. Nothing says who owns a source, which country or customer it applies to, or whether it is still correct. When a rule changes, nobody knows which documents repeat the old version.

The brief's second example: a service colleague has a customer on the phone, asks the internal agent and gets three documents (no owner, "edited last week", another country). A colleague emails a fourth. Nobody can tell which one to trust, and the customer waits.

SD Worx does not want another agent or a SharePoint with search. The agent is not the problem. The sources it reads from are.

## 2. Solution in one line

Your agent is only as trustworthy as its sources. We make the sources trustworthy, and every answer says why.

We start from messy, unlabelled data, label it, build a graph of how sources relate, and put a person in charge of every source. Conflicts and changes go to that person's queue. Answers show a trust score with its reasons.

**Design principle:** colleagues do as little work as possible to keep the graph correct and get as much as possible out of it. The system collects, links, flags and drafts. People only ask a question, confirm or correct a proposal, or pick up an owner task. AI proposes, a person decides anything with a legal or pay impact.

We focus on legal knowledge, because that is where a wrong answer costs the most: labour law, tax, social security and sector agreements in more than 30 countries, all changing every year.

### Why the jury should care

Real cases from the corpus:

- **Birth leave:** a consultant tells a customer 15 days instead of 20, based on two outdated documents that were "modified last week" by a template migration. The employee plans five days too few (call-01, mail-12).
- **Meal vouchers:** a Veldra employee is told EUR 8 in September, nine months after it went to EUR 10 (call-02, SR-2026-047102).
- **Indexation cap:** a customer needs a budget for January 2027. The answer was in a Teams chat for two months but in no document, so the consultant promised a callback (call-03, chat-03, SR-2026-047981).
- **Pay transparency:** a draft FAQ says the Belgian law has been in force since 7 June 2026. It is not (doc-15).

Figures (see [hr-research.md](hr-research.md), check at the source before they go on a slide):

- SD Worx produces 6 million payslips a month (challenge brief). One wrong rule repeats across thousands of them.
- Belgium alone has 98 joint committees and 66 sub-committees, each with its own rules (R26).
- 60% of payroll leaders say they cannot keep up with changing labour laws. Nearly one in three organisations report payroll calculation errors (R28).
- 51% of organisations would switch payroll provider for stronger compliance support (R28).
- 64% of employees say AI systems should explain their decisions (`sd-worx-briefing.md` section 4). Every answer here explains what it used and what it rejected.

## 3. How it works

### 3.1 Label the messy data

Every document, email, call, meeting, chat and ticket in `apps/web/src/lib/data/seed/knowledge` becomes a knowledge item with labels:

| Label             | Baseline: parser (tonight, no AI)                                                                                  | Labeller (AI, proposals only)                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Owner, sub-owners | "Eigenaar:" or "Owner:" line, header table. Missing on most documents, which is the point.                         | Proposes an owner from authors and who answered       |
| Owner left        | `status` in `people.json` (Annick Wouters and Hilde Maes left)                                                     |                                                       |
| Last check        | Last review row in the version table, "Laatst nagekeken" or "Last reviewed"                                        |                                                       |
| Next review       | "Volgende review" or "Next review" line (doc-05: June 2027). Default: 12 months after the last check.              |                                                       |
| Modified          | Front matter. Edits by `svc-template-migration` are ignored: modified is not verified.                             |                                                       |
| Scope             | SharePoint site in the path (`/sites/Legal-BE`, `/sites/CS-Belgium`, `/sites/Legal-NL`), customer folder, language | Country, customer, product when the path says nothing |
| Topic, facts      |                                                                                                                    | Topic plus key values ("birth leave BE: 20 days")     |
| Links             | Seeded by hand in one file for the demo                                                                            | Proposes links between items (see 3.2)                |

Email attachments become items of their own, linked to the email they came from, so a document emailed around (the brief's fourth document, doc-04) gets a place, an owner and a trust label.

The labeller is a classifier (Jev, see "Labelling with Jev" in `slides/ideas.md`) that answers typed questions per item: which country, which customer, reference document or record, does it mention an amount or date that expires, who owns the topic. It writes no text. Its confidence decides the route: a sure label is shown as a suggestion that takes one click to confirm, an unsure one or "cannot tell" goes to a person.

Everything the labeller produces starts as `suggested` and goes to a review queue. Only confirmed labels and links count. `ground-truth.json` is never loaded as data: a test compares our labels with it, which gives an honest pitch number ("our labels match the answer key on 11 of 13 facts").

### 3.2 Build the graph

Items are linked to colleagues (`people.json`), customers (`customers.json`), teams and countries, and to each other with a fixed list of link types:

| Type            | Meaning                                                           | Corpus example                                                 |
| --------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `supersedes`    | A replaces B.                                                     | doc-05 (20 days) supersedes doc-01 and doc-02 (15 days)        |
| `contradicts`   | A and B disagree and nobody has decided yet.                      | mail-05 (EUR 4,000 cap) contradicts doc-08                     |
| `variant_of`    | Same topic, different scope (country, customer, team or product). | doc-03 (Netherlands) is a variant of doc-05 (Belgium)          |
| `duplicate_of`  | Same content, not the official copy.                              | doc-04 (OneDrive copy) duplicates doc-05                       |
| `supports`      | A record confirms or explains a document.                         | chat-01 (Pieter links doc-05), chat-03 explains the cap        |
| `based_on`      | A applies the rules of a parent source.                           | doc-06 (CS work instruction, meal vouchers) is based on doc-07 |
| `answered_with` | An answer sent to a customer relied on this document.             | ticket-02 (Havenkaai, 15 days) answered with doc-01 and doc-02 |

Only `confirmed` links change which document is used. `answered_with` never makes a document more trusted: an answer shows a customer relies on it, not that it is right.

### 3.3 Trust score

Hard rules first, then a score for what remains. The choice is made by these rules, never by a language model.

| Rule                                        | Effect              | Reason shown (corpus example)                                                                        |
| ------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| Scope does not match                        | Not used            | doc-03: "Applies to the Netherlands. Havenkaai is a Belgian customer."                               |
| Superseded by a confirmed link              | Not used            | doc-01: "Replaced by _Geboorteverlof België_. Says 15 days, written in 2021, no owner."              |
| States an old value of a confirmed fact     | Not used            | doc-02: "Says 15 days. The current rule is 20 days, valid since 1 January 2023."                     |
| Duplicate of a confirmed link               | Not used            | doc-04: "Personal copy of _Geboorteverlof België_, sent by email. Use the original."                 |
| Suggested contradiction with a newer source | No confident answer | doc-08: "A newer legal update (June 2026) disagrees. Pieter De Smedt owns this topic." Opens review. |
| Parent source changed, not checked yet      | Lower, warning      | doc-06: "The rule it is based on changed on 1 January 2026. Not checked since."                      |
| Owner has left                              | Lower, warning      | doc-02: "Owner Annick Wouters left in 2024."                                                         |
| No owner                                    | Lower, warning      | "No owner. Nobody vouches for this document."                                                        |
| Next review date passed                     | Lower, warning      | "Last checked 14 months ago. Review was due in June."                                                |
| Personal copy or email attachment           | Lower, warning      | "Found in a OneDrive folder, not on a team or legal site."                                           |
| Supported by confirmed records              | Higher              | doc-05: "Pieter confirmed this in the customer service channel."                                     |

The score is shown as a label with its reasons ("owner Pieter De Smedt, checked 12 June 2026, Belgium, supported by 1 record"), never as a bare number. Tie-break: customer-specific before country-wide before general, then most recently checked, then usefulness, then search score.

- **Old is not wrong.** The holiday pay, ecocheques and Flex Income Plan documents are old but were reviewed, so they keep a green label. A tool that flags everything old gets ignored in a week (control items in `sample-data.md`).
- **Facts and versions.** A fact ("birth leave Belgium") has versions: 10 days until 2020, 15 days in 2021 and 2022, 20 days since 2023. A document that states an old version is marked with the version it states, so the colleague sees why it is out of date. Tonight the confirmed facts are seeded for birth leave, meal vouchers and the indexation cap.
- **Usefulness orders work, it never picks the answer.** Usefulness comes from agent log questions, tickets that relied on a document and supporting records. A useful document that is not checked goes first in its owner's queue. A useless one that is not checked is proposed for retirement, and the owner decides. Scores are for documents, never for people.

### 3.4 Answer on a live call

The colleague picks the customer on the phone, which sets the scope (country and customer), and types the question.

1. Postgres full text search (`simple` configuration, so Dutch, French and English work) over every site, not only the colleague's team site. The right birth leave document lives on the legal site, which is why the existing agent never found it.
2. Apply the rules in 3.3.
3. Show the passage from the best source with owner, scope and last check, the records that support it, and a "not used" list with a reason per source. The passage is highlighted, and one click opens the document at that passage.
4. Next to the answer: **who knows this**. The owner and colleagues who answered the topic before, built from authorship, chats and resolved tickets, with a one-click "contact" (Teams or email). Shown per topic, never as a score per person, and colleagues can opt out.
5. If a conflict is still open, do not guess: show who to call and put the conflict in the owner's queue.
6. If a source that was just shown is not checked, the call itself becomes the reason for a review, so the owner knows it is urgent (doc-16 during a Veldra call).

Tonight the answer text is the passage itself. Stretch: an LLM summary that may only cite the chosen source.

The search bar is only the way in. We pitch the trust label, the owner on every answer and the graph maintaining itself, not search.

### 3.5 Review queues (human in the loop)

Every colleague sees the items assigned to them. Every outcome is one click: correcting must be as cheap as accepting (`hr-research.md` section 7).

| Kind             | Shown                                                                | Actions                                                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `conflict`       | Both passages side by side, the differing part marked                | Document versus record: "Document is right", "Newer source is right, add it to the document", "Retire document". Two documents: "A is correct", "Both correct, different scope", "Same content". |
| `parent_changed` | The change in the parent next to the passages that use the old value | "Still correct", "Accept suggested edit", "Retire"                                                                                                                                               |
| `stale`          | Document and its last check date                                     | "Still correct" (sets last check), "Outdated" (retire, pick a replacement)                                                                                                                       |
| `suggested_link` | Both items and the proposed link or label                            | "Confirm", "Reject"                                                                                                                                                                              |
| `no_owner`       | Document, and colleagues who own or answered related items           | Pick an owner. Covers owners who left (doc-02, doc-16).                                                                                                                                          |
| `knowledge_gap`  | The question nobody could answer, and a draft built from records     | "Approve" (the approver becomes owner), "Edit and approve", "Not our topic"                                                                                                                      |

Routing, in this order: the owner, their successor if they left (from `successorId`: Annick Wouters to Claire Lambotte, Hilde Maes to Jonas Peeters), the team's inbox, and when nothing is known, Ellen Goossens (knowledge manager). Nothing is orphaned silently: when an HR event says someone leaves, every document they own gets their successor as proposed owner.

Always available: "Assign to someone else". Every action is a Server Action that checks the user is the assignee, validates with zod, writes `resolvedBy` and `resolvedAt` (the audit trail) and revalidates the ask, review and document pages.

**Built (30 September).** `/review` shows the user's queue sorted by deadline, their team inbox (tasks for a document whose owner left without a successor, "Pick up" moves one to your queue) and their karma history. Every task shows why it is there, who asked, the deadline, the karma on offer, one button per outcome and a side panel with the document (both sources for a conflict, the disagreeing passage marked). "Request a review" sends any owned document to its owner with a two-day deadline.

**Conflict view (compare and decide).** Conflicts and suggested links open a wide panel instead of one button per outcome: the reason in one sentence, "Your document says" next to "The newer source says" (words that differ are marked when the sentences overlap enough), the options as plain choices with what each one does, a before and after preview for "Update the document", and both full sources below. "Update the document" swaps the disputed sentence (`toEvidence` on the link) for the newer one (`evidence`), or adds it at the end when the sentence is not found. After that the indexation question on `/ask` is answered from doc-08, checked today (demo step 4).

**One document viewer.** `/ask` and `/review` share `src/app/(app)/document-sheet.tsx` (sheet and panel), `src/app/(app)/person-menu.tsx` (email, Teams, "ask to check") and `src/components/document-body.tsx` (renders Markdown, emails and transcripts, highlights the passage). Build what the sheet shows with `toSheetDocument` from `src/lib/document-view.ts`. Every owner, author and requester name opens the person menu.

**Queue API for other modules** (`src/lib/review.ts`, server only):

- `enqueueReview({ kind, itemId, relatedItemIds, linkId, source, trigger, requestedById, dueAt })` puts a task in the owner's queue. **Precondition: the document is fully known.** It exists, is a document, is not retired and has an owner (`ownerId`). Finding the owner is the labelling module's job (track A, the `no_owner` kind): the queue never guesses one and returns `{ status: "rejected", reason: "no_owner" }`. An owner who left is replaced by their successor, without a successor the task goes to the team inbox. One open task per document and kind: a second request returns `already_queued` and pulls the deadline forward.
- `reportDocumentUsed(itemId, { description, usedById })` for the ask page and the after-call panel: a document used in an answer and not checked in 90 days gets a `stale` task with source `usage` and a 7-day deadline.
- `runPeriodicCheck()` is the nightly check (a button for knowledge managers on `/review`, no background job): review date within two weeks (next review date, or 12 months after the last check), used in a customer answer since the last check, and suggested conflicts nobody has picked up.
- `resolveReview(reviewId, outcome, colleague)` applies the outcome (for example "Still correct" sets the last check to today and the next review a year out, "Newer source is right, add it" appends the passage and adds a `supports` link) and records karma.

Deadlines by source: request 2 days, conflict check 5, parent change 7, usage 7, schedule 14 (or the review date itself).

### 3.6 Conflict check on new documents

When a document is added or edited, rule based checks compare it with items on the same topic and scope: same fact, different value (15 versus 20 days, EUR 8 versus EUR 10). A hit creates a `contradicts` link as `suggested` and a `conflict` item in the owner's queue. Semantic matching is a stretch.

**Built: upload a document (30 September).** "Add a document" on `/documents` runs three steps:

1. `/documents/new`: drop a `.md` or `.txt` file, paste text or use the sample (`public/samples/werkinstructie-geboorteverlof-2026.md`). It is stored as a draft (next `doc-NN` id) with labels from `labelItem`: owner and team from the uploader, country, topic, type, customer, language.
2. `/documents/[id]/publish`: the uploader checks the labels, then decides every conflict and says how each related document relates (same topic, or search relevance of 0.6 and up). Conflicts come from `src/lib/facts.ts`: two similar sentences with a different amount (days, weeks, months, EUR, %), or for the same topic the value each document puts in bold, and only when the other document never states our value. Other scope is suggested as `variant_of`, a legal source with the same values as `based_on`, a conflict as `supersedes`. For a conflict the choices are "Mine is right, it replaces this one", "Both right, different scope" or "Not sure, ask the owner" (a suggested `contradicts` link and a `conflict` task for the owner or successor). Publishing makes the document active, checked today.
3. `/documents/[id]/notify` (only after a `supersedes`): living answers below.

The sample upload as Lotte finds exactly two conflicts, doc-01 (15 dagen) and doc-02 (15 days), and suggests `based_on` doc-05. doc-02 is seeded as `based_on` doc-01 (the quick guide points to the work instruction), so replacing doc-01 also shows a dependent document.

### 3.7 Changes flow downstream

When a parent source changes, everything based on it is checked.

1. An owner updates a rule document, for example the meal voucher maximum in doc-07.
2. The graph follows `based_on` links down, all levels, but only within the scope of the change. A Belgian change does not touch Dutch documents.
3. Every downstream source gets "needs check", drops in trust and lands in its owner's queue as `parent_changed`.
4. The review screen shows the change next to the passages that still use the old value, found by matching that value ("EUR 8").
5. The owner confirms, accepts a suggested edit or retires. We never change a document without its owner.

A coverage line on the parent ("3 of 4 checked") tells its owner when the change has landed everywhere.

The same flow starts from a **legal change**. A legal update (mail-04, mail-05) is a parent source: the June 2026 update caps indexation at EUR 4,000, so every document about indexation in its scope goes to its owner with the old passage next to the new rule. This builds on SD Worx Legal Watch (from a legal change to every affected document), it does not replace it.

**Living answers** (Yarne). A fixed document does not fix the answers already sent from it. When a consultant answers a customer, they confirm in one click which document the answer came from (`answered_with`, suggested by the tool). When a new document supersedes that one, the tool lists every customer who got an answer from the old one. The author chooses to notify all, a selection or nobody, and checks a message drafted from the new document. It goes out in the name of the consultant who answered. Built: after an upload replaces a document, `/documents/[id]/notify` lists every answer that relied on it (what the customer was told, the old value marked, who answered) with a correction drafted from the new document in the ticket's language, and every document `based_on` it with its owner. The author picks all, some or none of each. A sent correction is stored as an `answer` item (`fix-<ticket>-<doc>`) with an `answered_with` link to the new document. Nothing is emailed. Each selected owner gets a `parent_changed` task with the old and new value.

### 3.8 After the call, the graph updates itself

When a call ends, the system does the admin and people only confirm. This is where calls, chats and meetings become evidence: records never answer on their own, they support or contradict a document or point to a person.

1. The transcript and metadata come in (queue, colleague, customer, ticket).
2. Topics are detected and matched to facts within the customer's scope. (AI)
3. The call is linked to the ticket and to the document and fact version that were used.
4. Sources shown during the call that state an old value, or are out of scope, are flagged and routed to their owner (routing in 3.5). Until the owner decides, they rank below the answer for everyone.
5. Earlier tickets that relied on the same outdated source are listed (living answers in 3.7).
6. A callback promise or "I don't know" with no confident answer creates a **knowledge gap**. The graph searches chats, emails and meeting notes on that topic, drafts a passage from them and sends it to the most likely owner as a `knowledge_gap` item. (AI drafts, a person approves.) The approved passage is added to a document, which is checked today, and the colleague gets a callback task with the answer ready.
7. A confirmation to the customer is drafted from the answer with its source. The colleague reads it and clicks send. Stretch.

AI only does steps 2 and 6. Everything else is plain logic on the graph. Tonight steps 2 and 6 use stored output for call-01 and call-03, so the demo never depends on a live model or the venue wifi. If there is time, run the real step and fall back to the stored result.

### 3.9 Periodic checks and meeting prep

- Every document has a next review date. The owner picks the rhythm (6, 12 or 24 months). Legal documents follow the legal calendar (indexation in January). One click "still correct" resets the date. Overdue documents drop in ranking and show a warning.
- **Before a customer meeting** (stretch): three days before the Veldra quarterly review, Elif Aydin gets a short list of the Veldra documents that are not checked this year. Each goes to its owner with the meeting date as deadline. What is not confirmed in time shows a warning in the meeting. The Nike example: the 2022 account plan says the cut-off is the 20th, the signed annex says the 18th, and the customer asked for the 17th (doc-16, doc-18).

### 3.10 Recurring questions and trust summary

- **Trust summary per team:** share of documents with an active owner, share checked in 12 months, open conflicts. Never per person.
- **Recurring questions:** topics that are asked often, from `agent-log.json` and `tickets.json`, next to how many of their documents have an active owner ("birth leave Belgium: 9 questions, 1 of 4 documents owned"). Framed as "where to write the next document", not as a performance metric. Stretch.

### 3.11 Recognition for owners: karma (built)

Owning knowledge is invisible work: nobody thanks you for checking a rule that was already right. Owners get recognition for work that keeps knowledge trustworthy: closing a knowledge gap, verifying on time, updating after a law change, claiming an orphaned document or retiring an outdated one.

Guardrails, because scoring individuals is a red flag in [ideas.md](ideas.md): only actions a person confirmed in the queue count, only contributions and never penalties, reward quality over volume, no ranking of people and no link to performance reviews. Teams are compared on coverage, and a colleague sees their own contributions only on their own page.

**Built as karma (30 September)** in `src/lib/karma.ts`, shown on `/review`. Every decision in the queue earns points by task kind (conflict 25, parent changed 20, no owner 15, not checked 10, suggestions 5), plus 50% for deciding before the deadline and 5 extra for a colleague's request decided on time. Late still counts, it just earns no bonus. Levels: New owner, Contributor (50), Reliable owner (150), Trusted owner (300), Knowledge steward (600). The panel shows karma, the level and progress, the on-time rate over 12 months, the on-time streak and open or overdue tasks. It follows the guardrails above: only the colleague sees their own karma, it never goes down and there is no leaderboard. `summarizeKarma(...).onTimeRate` is meant as an input for owner trust in 3.3 later ("owner decides on time"), which needs a team decision first because it puts a person's behaviour into a document's score.

## 4. Data model

Follow the schema steps in `AGENTS.md` (types, schema, seed, repository, `pnpm db:generate`).

Built on 30 September. Details and usage in [sample-data.md](sample-data.md#database). Types are in `src/lib/data/types.ts`, the interface in `src/lib/data/repository.ts`.

| Table             | Fields                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `teams`           | id (`team-legal-knowledge-centre-belgium`), name. Review items without an owner go to a team.                                                                                                                                                                                                                                                                                                                                         |
| `colleagues`      | From `people.json`: id (`p-pieter`), name, email, jobTitle, teamId, country, languages, status (`active`, `left`, `service_account`), successorId.                                                                                                                                                                                                                                                                                    |
| `customers`       | From `customers.json`: id (`cus-havenkaai`, `cus-veldra`), name, segment, countries, contacts, entities.                                                                                                                                                                                                                                                                                                                              |
| `knowledge_items` | id (`doc-05`, `mail-05`, `SR-2026-048213`), kind (`document`, `email`, `call`, `meeting`, `chat`, `ticket`, `answer`), title, body, filePath, pdfPath, sourceSystem, location, language, country, customerId, teamId, product, jointCommittee, keywords, ownerId, authorId, createdAt, modifiedAt, modifiedById, lastCheckedAt, nextReviewAt, status (`active`, `draft`, `retired`), usefulness. Generated full text column `search`. |
| `knowledge_links` | id, fromId, toId, type, reason, evidence (the passage in `fromId`), toEvidence (the passage in `toId` it is about), status (`suggested`, `confirmed`, `rejected`), origin (`parsed`, `seed`, `jev`, `person`), confidence, createdBy (colleague id or `system`), createdAt, resolvedBy, resolvedAt.                                                                                                                                                                                                             |
| `review_items`    | id, kind (`conflict`, `parent_changed`, `stale`, `no_owner`, `suggested_link`, `suggested_label`), itemIds, linkId, assigneeId or assigneeTeamId, trigger (why it is in the queue), payload (suggested label and confidence), source (`schedule`, `usage`, `request`, `conflict_check`, `parent_change`), requestedById, dueAt, status (`open`, `done`), outcome, createdAt, resolvedBy, resolvedAt.                                                                                                                                    |
| `karma_events`    | id, colleagueId, reviewId, kind, itemId, points, onTime, reason, createdAt. One row per decision in the queue (3.11).                                                                                                                                                                                                                                                                                                                  |
| `agent_queries`   | From `agent-log.json`: what the existing assistant returned, for demo step 1.                                                                                                                                                                                                                                                                                                                                                         |

Corrections to customers are `answer` items, not a separate table (3.7). Resolved tickets already get `answered_with` links from `linkedDocuments` in `tickets.json`. Tickets use their service desk number as id: the answer key's "ticket-02" is `SR-2026-048213`.

Also not built yet, for track A to add when B or C need them: the `knowledge_gap` review kind (3.8), confirmed facts with versions for birth leave, meal vouchers and the indexation cap (3.3), and the stored AI output for call-01 and call-03 (3.8).

## 5. Pages

| Route             | What                                                                                                                         | Tonight |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- |
| `/ask`            | Customer picker, question, answer card with trust label, supporting records, "not used" list, who knows this, "ask this person" on conflict. | Yes     |
| After-call panel  | On `/ask` when the call ends: the steps of 3.8 lighting up one by one, the flagged sources, earlier answers to correct, the knowledge gap.   | Yes     |
| `/review`         | The current user's queue, team inbox and karma (3.5, 3.11). Built.                                                                           | Yes     |
| `/documents/new`  | Upload a document: labels, conflicts, links to related documents, then who to tell (3.6, 3.7). Built.                                       | Yes     |
| `/documents/[id]` | Trust panel (owner, scope, last check, next review, source, modified by), links grouped by type, downstream coverage.                       | Yes     |
| `/documents`      | Trust summary per team: share with an active owner, share checked in 12 months, open conflicts. Recurring questions. Never per person.      | If time |
| Graph view        | Small neighbourhood of one document or fact, with the versions each document states.                                                        | Stretch |
| Meeting prep      | Documents to check before a customer meeting (3.9).                                                                                          | Stretch |
| My contributions  | Built as the karma panel and history tab on `/review` (3.11). Visible only to the colleague.                                                 | Yes     |

## 6. Demo script

About three and a half minutes. Every step uses corpus items, so the story holds up if the jury asks. Steps 1 to 4 are the core. Cut step 5 if time is short.

Cast: Lotte Verhaegen (payroll consultant, customer service Belgium, takes the calls), Inge Claes (HR manager at Havenkaai, the caller), Youssef Benali (warehouse worker at Havenkaai, just became a father), Pieter De Smedt (legal knowledge centre Belgium, owns birth leave and indexation), Bram Claessens (team lead customer service Belgium), Claire Lambotte (Annick Wouters' successor).

1. **(20 s) Before.** 30 September, 09:14. Inge Claes (HR, Havenkaai) calls Lotte Verhaegen about birth leave for Youssef Benali (call-01). The existing agent returns the quick guide "modified last week", the Dutch document and the work instruction without an owner (agent-log). Bram emails a fourth, personal copy (mail-01). Lotte answers 15 days (SR-2026-048213). The customer comes back: it is 20 (mail-12). Show the "modified by svc-template-migration" line: "Edited is not verified."
2. **(40 s) Same question in our tool.** Answer from _Geboorteverlof België_ (doc-05), passage highlighted: 20 days, the first 3 paid by the employer, 17 by the health insurance fund. Owner Pieter De Smedt, checked 12 June 2026, supported by Pieter's message in the customer service channel (chat-01). Below it, the four documents Lotte had, each with its reason. Pieter is shown under "who knows this", one click to contact.
3. **(30 s) The call ends.** The after-call panel lights up step by step. The call is linked to the ticket and to doc-05. doc-01 (no owner) goes to the customer service Belgium inbox, doc-02 (Annick Wouters left) to her successor Claire Lambotte, and both now rank below doc-05 for everyone. The earlier answer to Havenkaai relied on doc-01 and doc-02 (living answers): Lotte checks a correction drafted from doc-05 and clicks send. "Nobody had to remember to fix anything. People only confirm."
4. **(50 s) A question nobody wrote down.** Inge asks about indexation above EUR 4,000 in January 2027 (call-03). doc-08 says nothing about a cap, the June legal update (mail-05) does. The tool does not pick one and names Pieter. Lotte promises a callback (SR-2026-047981). After the call, a knowledge gap and the conflict land in Pieter's queue with a draft from mail-05 and his own example in the legal channel (chat-03). One click: "Newer source is right, add it to the document". Lotte gets a callback task with the answer ready. Same question again: answered from doc-08, checked today. "The answer was in a Teams chat for two months. Now it has an owner."
5. **(40 s) A change flows down.** Replay the January meal voucher change on doc-07 (EUR 8 to EUR 10). doc-06, the customer service work instruction based on it, lands in its owner's queue with "EUR 8" marked. This is why a Veldra employee was still told EUR 8 in September (call-02, SR-2026-047102, which relied on doc-06). One click, coverage goes to complete, and the Veldra answer is listed to correct.
6. **(20 s) Trust summary and close.** Per team: no active owner, not checked in 12 months, open conflicts. "We did not build another agent or another search box. We built the layer underneath, so the agent you already have gives answers people can trust." One slide on the same graph for Elif taking over Veldra (the Nike example). Optional scale slide: the graph stores facts, owners and links, not files. Files stay in SharePoint and Teams, so millions of documents need only a few kilobytes of links each.

**Fallbacks.** A screen recording of the full run. The step 1 story on a slide in case the replay is not ready. A reset button that puts the demo back in its starting state between rehearsals.

**Never show:** emotion or sentiment analysis of calls (we only use transcripts for topics and facts), a message to a customer sent without a person clicking send, a document or fact changed without its owner, or a ranking of people.

## 7. Team split

Four tracks with separate files, so we do not block or overwrite each other. Put your name in the first column.

| Who     | Track                  | Owns                                                                                                                                                                          | Files                                                                        |
| ------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
|         | A. Data and labelling  | Types, schema, migration, repository. Corpus import and label parser. Hand-seeded links and facts. Stored AI output for call-01 and call-03. AI labeller that writes `suggested` labels and links. Answer key test and its score. | `src/lib/data/**`, `src/lib/db/**`, `apps/web/drizzle`, `apps/web/scripts`   |
| Yendric | B. Ask and trust score | Search, the rules in 3.3 with reasons, answer card, "not used" list, who knows this, after-call panel (3.8), demo accounts for Lotte and Pieter.                                 | `src/app/(app)/ask/**`, `src/lib/trust.ts`                                   |
| Yarne   | C. Review and changes  | Review queue and its Server Actions (including `knowledge_gap`), routing to owner, successor or team, conflict check on new documents (3.6), downstream flow and living answers (3.7), document page. | `src/app/(app)/review/**`, `src/app/(app)/documents/**`, `src/lib/review.ts` |
|         | D. Pitch               | Slides, demo script, figure checks at the source, promo video if time, rehearsals. Keeps this plan up to date.                                                                | `slides/**`, `videos/**`, `docs/**`                                          |

How we work together:

- A publishes the types and the repository interface first (target: within the first hour). B and C build against those and the seed, not against each other.
- Only A changes `schema.ts` and generates migrations. Others ask A, so we never get two migrations with the same number.
- Pull with rebase before you start, commit small and push often. Shared files (`AGENTS.md`, this plan, the nav) get short, separate commits.
- D needs screenshots from B and C by 22:00 and runs the demo script against the real app, not mockups.

Timeline (the round ends at 23:00):

| Until | What                                                                                        |
| ----- | ------------------------------------------------------------------------------------------- |
| 19:30 | A: types and repository interface. B, C: page skeletons. D: deck outline, figure list.      |
| 21:00 | A: corpus imported, links seeded. B: answers with reasons. C: queue with one-click actions. |
| 21:45 | Demo steps 1 to 5 work end to end. A: labeller if the baseline is solid.                    |
| 22:15 | Feature freeze. Fix bugs, `pnpm lint`, `pnpm typecheck`, Aikido findings.                   |
| 23:00 | Two full rehearsals with the live app.                                                      |

## 8. Open decisions

1. **Users.** Decided: users have a `colleagueId` and the role `colleague` or `knowledge_manager`. One-click accounts: Lotte Verhaegen, Pieter De Smedt, Elif Aydin and Ellen Goossens. The Havenkaai HR app (leave, payslips, employees) is removed.
2. **AI labeller tonight.** Proposal: the parser and hand-seeded links are the baseline, so the demo never depends on a model. The labeller is the second step for track A, and its output only enters through the review queue. Calling a model needs an API key in `.env.local` and a new dependency, which we mention before adding.
3. **Joint committee.** In call-03 Inge says Havenkaai's bedienden are in PC 200, the app dataset says PC 226. Proposal: scope on country and customer only tonight, fix the mismatch afterwards.
4. **Name.** "Trust graph" is a working name.
5. **Rule cards or documents.** Roan's concept answered with a rule card per fact, Yarne's with a document passage. Proposal: tonight the answer is the passage from the best document, and facts with versions are labels on documents (3.3), so a document stating an old version is explained. A rule card per fact, with the documents that cite each version, is the graph view stretch.
6. **Recognition for owners.** Proposal: build it last and only with the guardrails in 3.11. Leave it out of the demo if anyone on the team thinks it reads as monitoring individuals.
