# Game plan: trust graph

The one document for what we build, how it works, how we demo it and who does what. "Trust graph" is a working name.

Background lives elsewhere: the event and past decisions in [context.md](context.md), the brief in [challenge-briefing.md](challenge-briefing.md), the corpus in [sample-data.md](sample-data.md). Other ideas we considered are in [ideas.md](ideas.md).

## 1. Problem

SD Worx knowledge is spread over documents, emails, chats, calls and people's heads. Nothing says who owns a source, which country or customer it applies to, or whether it is still correct. When a rule changes, nobody knows which documents repeat the old version.

The brief's second example: a service colleague has a customer on the phone, asks the internal agent and gets three documents (no owner, "edited last week", another country). A colleague emails a fourth. Nobody can tell which one to trust, and the customer waits.

SD Worx does not want another agent or a SharePoint with search. The agent is not the problem. The sources it reads from are.

## 2. Solution in one line

Your agent is only as trustworthy as its sources. We make the sources trustworthy, and every answer says why.

We start from messy, unlabelled data, label it, build a graph of how sources relate, and put a person in charge of every source. Conflicts and changes go to that person's queue. Answers show a trust score with its reasons.

## 3. How it works

### 3.1 Label the messy data

Every document, email, call, meeting, chat and ticket in `apps/web/src/lib/data/seed/knowledge` becomes a knowledge item with labels:

| Label             | Baseline: parser (tonight, no AI)                                                                                  | Labeller (AI, proposals only)                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Owner, sub-owners | "Eigenaar:" or "Owner:" line, header table. Missing on most documents, which is the point.                         | Proposes an owner from authors and who answered       |
| Owner left        | `status` in `people.json` (Annick Wouters and Hilde Maes left)                                                     |                                                       |
| Last check        | Last review row in the version table, "Laatst nagekeken" or "Last reviewed"                                        |                                                       |
| Modified          | Front matter. Edits by `svc-template-migration` are ignored: modified is not verified.                             |                                                       |
| Scope             | SharePoint site in the path (`/sites/Legal-BE`, `/sites/CS-Belgium`, `/sites/Legal-NL`), customer folder, language | Country, customer, product when the path says nothing |
| Topic, facts      |                                                                                                                    | Topic plus key values ("birth leave BE: 20 days")     |
| Links             | Seeded by hand in one file for the demo                                                                            | Proposes links between items (see 3.2)                |

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
| Duplicate of a confirmed link               | Not used            | doc-04: "Personal copy of _Geboorteverlof België_, sent by email. Use the original."                 |
| Suggested contradiction with a newer source | No confident answer | doc-08: "A newer legal update (June 2026) disagrees. Pieter De Smedt owns this topic." Opens review. |
| Parent source changed, not checked yet      | Lower, warning      | doc-06: "The rule it is based on changed on 1 January 2026. Not checked since."                      |
| Owner has left                              | Lower, warning      | doc-02: "Owner Annick Wouters left in 2024."                                                         |
| No owner                                    | Lower, warning      | "No owner. Nobody vouches for this document."                                                        |
| Not checked in the last 12 months           | Lower, warning      | "Last checked 14 months ago."                                                                        |
| Supported by confirmed records              | Higher              | doc-05: "Pieter confirmed this in the customer service channel."                                     |

The score is shown as a label with its reasons ("owner Pieter De Smedt, checked 12 June 2026, Belgium, supported by 1 record"), never as a bare number. Tie-break: customer-specific before country-wide before general, then most recently checked, then search score.

### 3.4 Answer on a live call

The colleague picks the customer on the phone, which sets the scope (country and customer), and types the question.

1. Postgres full text search (`simple` configuration, so Dutch, French and English work) over every site, not only the colleague's team site. The right birth leave document lives on the legal site, which is why the existing agent never found it.
2. Apply the rules in 3.3.
3. Show the passage from the best source with owner, scope and last check, the records that support it, and a "not used" list with a reason per source.
4. If a conflict is still open, do not guess: show who to call and put the conflict in the owner's queue.

Tonight the answer text is the passage itself. Stretch: an LLM summary that may only cite the chosen source.

### 3.5 Review queues (human in the loop)

Every colleague sees the items assigned to them. Every outcome is one click: correcting must be as cheap as accepting (`hr-research.md` section 7).

| Kind             | Shown                                                                | Actions                                                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `conflict`       | Both passages side by side, the differing part marked                | Document versus record: "Document is right", "Newer source is right, add it to the document", "Retire document". Two documents: "A is correct", "Both correct, different scope", "Same content". |
| `parent_changed` | The change in the parent next to the passages that use the old value | "Still correct", "Accept suggested edit", "Retire"                                                                                                                                               |
| `stale`          | Document and its last check date                                     | "Still correct" (sets last check), "Outdated" (retire, pick a replacement)                                                                                                                       |
| `suggested_link` | Both items and the proposed link or label                            | "Confirm", "Reject"                                                                                                                                                                              |
| `no_owner`       | Document, and colleagues who own or answered related items           | Pick an owner. Covers owners who left (doc-02, doc-16).                                                                                                                                          |

Always available: "Assign to someone else". Every action is a Server Action that checks the user is the assignee, validates with zod, writes `resolvedBy` and `resolvedAt` (the audit trail) and revalidates the ask, review and document pages.

### 3.6 Conflict check on new documents

When a document is added or edited, rule based checks compare it with items on the same topic and scope: same fact, different value (15 versus 20 days, EUR 8 versus EUR 10). A hit creates a `contradicts` link as `suggested` and a `conflict` item in the owner's queue. Semantic matching is a stretch.

### 3.7 Changes flow downstream

When a parent source changes, everything based on it is checked.

1. An owner updates a rule document, for example the meal voucher maximum in doc-07.
2. The graph follows `based_on` links down, all levels, but only within the scope of the change. A Belgian change does not touch Dutch documents.
3. Every downstream source gets "needs check", drops in trust and lands in its owner's queue as `parent_changed`.
4. The review screen shows the change next to the passages that still use the old value, found by matching that value ("EUR 8").
5. The owner confirms, accepts a suggested edit or retires. We never change a document without its owner.

A coverage line on the parent ("3 of 4 checked") tells its owner when the change has landed everywhere. Stretch, "living answers": the `answered_with` links on a replaced document are the customers who got the old answer. The author can notify them with a message drafted from the new document.

## 4. Data model

Follow the schema steps in `AGENTS.md` (types, schema, seed, repository, `pnpm db:generate`).

Built on 30 September. Details and usage in [sample-data.md](sample-data.md#database). Types are in `src/lib/data/types.ts`, the interface in `src/lib/data/repository.ts`.

| Table             | Fields                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `teams`           | id (`team-legal-knowledge-centre-belgium`), name. Review items without an owner go to a team.                                                                                                                                                                                                                                                                                                                                         |
| `colleagues`      | From `people.json`: id (`p-pieter`), name, email, jobTitle, teamId, country, languages, status (`active`, `left`, `service_account`), successorId.                                                                                                                                                                                                                                                                                    |
| `customers`       | From `customers.json`: id (`cus-havenkaai`, `cus-veldra`), name, segment, countries, contacts, entities.                                                                                                                                                                                                                                                                                                                              |
| `knowledge_items` | id (`doc-05`, `mail-05`, `SR-2026-048213`), kind (`document`, `email`, `call`, `meeting`, `chat`, `ticket`, `answer`), title, body, filePath, pdfPath, sourceSystem, location, language, country, customerId, teamId, product, jointCommittee, keywords, ownerId, authorId, createdAt, modifiedAt, modifiedById, lastCheckedAt, nextReviewAt, status (`active`, `draft`, `retired`), usefulness. Generated full text column `search`. |
| `knowledge_links` | id, fromId, toId, type, reason, evidence, status (`suggested`, `confirmed`, `rejected`), origin (`parsed`, `seed`, `jev`, `person`), confidence, createdBy (colleague id or `system`), createdAt, resolvedBy, resolvedAt.                                                                                                                                                                                                             |
| `review_items`    | id, kind (`conflict`, `parent_changed`, `stale`, `no_owner`, `suggested_link`, `suggested_label`), itemIds, linkId, assigneeId or assigneeTeamId, trigger (why it is in the queue), payload (suggested label and confidence), status (`open`, `done`), outcome, createdAt, resolvedBy, resolvedAt.                                                                                                                                    |
| `agent_queries`   | From `agent-log.json`: what the existing assistant returned, for demo step 1.                                                                                                                                                                                                                                                                                                                                                         |

Not built yet: the `answers` table (recipient, answered by, sent at, notified at) for living answers. Resolved tickets already get `answered_with` links from `linkedDocuments` in `tickets.json`. Tickets use their service desk number as id: the answer key's "ticket-02" is `SR-2026-048213`.

## 5. Pages

| Route             | What                                                                                                                         | Tonight |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- |
| `/ask`            | Customer picker, question, answer card with trust label, supporting records, "not used" list, "ask this person" on conflict. | Yes     |
| `/review`         | The current user's queue.                                                                                                    | Yes     |
| `/documents/[id]` | Trust panel (owner, scope, last check, source, modified by), links grouped by type, downstream coverage.                     | Yes     |
| `/documents`      | Trust summary per team: share with an active owner, share checked in 12 months, open conflicts. Never per person.            | If time |
| Graph view        | Small neighbourhood of one document.                                                                                         | Stretch |

## 6. Demo script

About three minutes. Every step uses corpus items, so the story holds up if the jury asks.

1. **(20 s) Before.** 30 September, 09:14. Inge Claes (HR, Havenkaai) calls Lotte Verhaegen about birth leave for Youssef Benali (call-01). The existing agent returns the quick guide "modified last week", the Dutch document and the work instruction without an owner (agent-log). Bram emails a fourth, personal copy (mail-01). Lotte answers 15 days (ticket-02). The customer comes back: it is 20 (mail-12).
2. **(50 s) Same question in our tool.** Answer from _Geboorteverlof België_ (doc-05): 20 days, owner Pieter De Smedt, checked 12 June 2026, supported by Pieter's message in the customer service channel (chat-01). Below it, the four documents Lotte had, each with its reason.
3. **(50 s) A conflict, fixed live.** Inge asks about indexation above EUR 4,000 in January 2027 (call-03). doc-08 says nothing about a cap, the June legal update (mail-05) does. The tool does not pick one, names Pieter and links his example (chat-03). Pieter's queue: one click, "Newer source is right, add it to the document". Same question again: answered from doc-08, checked today.
4. **(40 s) A change flows down.** Replay the January meal voucher change on doc-07 (EUR 8 to EUR 10). doc-06, the customer service work instruction based on it, lands in its owner's queue with "EUR 8" marked. This is why a Veldra employee was still told EUR 8 in September (call-02). One click, coverage goes to complete.
5. **(20 s) Trust summary and close.** Per team: no active owner, not checked in 12 months, open conflicts. This sits under the agent SD Worx already has. One slide on the same graph for Elif taking over Veldra (the Nike example).

## 7. Team split

Four tracks with separate files, so we do not block or overwrite each other. Put your name in the first column.

| Who | Track                  | Owns                                                                                                                                                                          | Files                                                                        |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
|     | A. Data and labelling  | Types, schema, migration, repository. Corpus import and label parser. Hand-seeded links. AI labeller that writes `suggested` labels and links. Answer key test and its score. | `src/lib/data/**`, `src/lib/db/**`, `apps/web/drizzle`, `apps/web/scripts`   |
|     | B. Ask and trust score | Search, the rules in 3.3 with reasons, answer card, "not used" list, demo accounts for Lotte and Pieter.                                                                      | `src/app/(app)/ask/**`, `src/lib/trust.ts`                                   |
|     | C. Review and changes  | Review queue and its Server Actions, conflict check on new documents (3.6), downstream flow (3.7), document page.                                                             | `src/app/(app)/review/**`, `src/app/(app)/documents/**`, `src/lib/review.ts` |
|     | D. Pitch               | Slides, demo script, figure checks at the source, promo video if time, rehearsals. Keeps this plan up to date.                                                                | `slides/**`, `videos/**`, `docs/**`                                          |

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
| 21:45 | Demo steps 1 to 4 work end to end. A: labeller if the baseline is solid.                    |
| 22:15 | Feature freeze. Fix bugs, `pnpm lint`, `pnpm typecheck`, Aikido findings.                   |
| 23:00 | Two full rehearsals with the live app.                                                      |

## 8. Open decisions

1. **Users.** Decided: users have a `colleagueId` and the role `colleague` or `knowledge_manager`. One-click accounts: Lotte Verhaegen, Pieter De Smedt, Elif Aydin and Ellen Goossens. The Havenkaai HR app (leave, payslips, employees) is removed.
2. **AI labeller tonight.** Proposal: the parser and hand-seeded links are the baseline, so the demo never depends on a model. The labeller is the second step for track A, and its output only enters through the review queue. Calling a model needs an API key in `.env.local` and a new dependency, which we mention before adding.
3. **Joint committee.** In call-03 Inge says Havenkaai's bedienden are in PC 200, the app dataset says PC 226. Proposal: scope on country and customer only tonight, fix the mismatch afterwards.
4. **Name.** "Trust graph" is a working name.
