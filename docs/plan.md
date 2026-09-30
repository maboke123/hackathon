# Build plan: trust graph

The idea is described in [ideas.md](ideas.md#trust-graph). This file is how we build and demo it. All demo content comes from the synthetic knowledge corpus in `apps/web/src/lib/data/seed/knowledge`, described in [sample-data.md](sample-data.md).

## The pitch in one line

Your agent is only as trustworthy as its sources. We make the sources trustworthy, and every answer says why.

## What the jury must see

1. One question, one answer, and a list of the documents that were not used with the reason for each.
2. A conflict the system cannot settle goes to a person instead of being guessed. The owner fixes it in one click and the next answer is right.
3. The graph is visible through the answer and the document page, not as a hairball.

## From corpus to graph

The corpus is raw: files only carry what their source system would carry. We turn it into graph nodes and links when seeding.

**Nodes.** Every document, email, call, meeting, chat and ticket becomes a knowledge item. Documents can be the answer. Records (emails, calls, meetings, chats, tickets) cannot, but they support or contradict documents and show who knows a topic. Colleagues come from `people.json`, customers from `customers.json`.

**Labels we parse** (script, no AI):

| Label      | Where it comes from                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Owner      | The "Eigenaar:" or "Owner:" line, or the Owner row in the document header table. Missing on most documents, which is the point. |
| Owner left | The owner's `status` in `people.json` (Annick Wouters and Hilde Maes have left).                                                |
| Last check | The last review row in the version table, or a "Laatst nagekeken" or "Last reviewed" line.                                      |
| Modified   | Front matter. Modifications by `svc-template-migration` are ignored: modified is not verified.                                  |
| Scope      | SharePoint site in the path (`/sites/Legal-BE`, `/sites/CS-Belgium`, `/sites/Legal-NL`), the customer folder, and language.     |
| Source     | Front matter `source` and `path` for documents, headers for emails and calls.                                                   |

**Links.** Tonight we write the links by hand in one seed file, as the output a labeller would produce. The ones scenario 1 needs are seeded as `confirmed` by their owner. The one scenario 2 needs is seeded as `suggested`, so it shows up in the owner's review queue. Stretch for the final: an LLM proposes claims and contradiction links, and every proposal starts as `suggested`.

**Answer key.** `ground-truth.json` is for checking, never shown in the app. A small test compares our parsed labels and links with it. That gives us an honest pitch number (for example "our labels match the answer key on 11 of 13 facts").

## Data model

Follow the schema change steps in `AGENTS.md` (types, schema, seed, repository, `pnpm db:generate`).

| Table             | Fields                                                                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colleagues`      | From `people.json`: id (`p-pieter`), name, email, role, team, country, languages, status (`active`, `left`, `service-account`).                                                                                                                                     |
| `customers`       | From `customers.json`: id (`cus-havenkaai`, `cus-veldra`), name, countries.                                                                                                                                                                                         |
| `knowledge_items` | id (`doc-05`, `mail-05`), kind (`document`, `email`, `call`, `meeting`, `chat`, `ticket`, `answer`), title, body, source, path, language, country, customerId, team, product, ownerId, createdAt, modifiedAt, modifiedBy, verifiedAt, status (`active`, `retired`). |
| `knowledge_links` | id, fromId, toId, type, reason, status (`suggested`, `confirmed`, `rejected`), createdBy (colleague id or `system`), createdAt, resolvedBy, resolvedAt.                                                                                                             |
| `review_items`    | id, kind (`conflict`, `stale`, `suggested_link`, `no_owner`), itemIds, linkId (nullable), assigneeId, status (`open`, `done`), outcome, createdAt, resolvedBy, resolvedAt. This is also the audit trail.                                                            |

Link types. A fixed list makes the ranking rules possible.

| Type            | Meaning                                                           | Corpus example                                                 |
| --------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `supersedes`    | A replaces B.                                                     | doc-05 (20 days) supersedes doc-01 and doc-02 (15 days)        |
| `contradicts`   | A and B disagree and nobody has decided yet.                      | mail-05 (EUR 4,000 cap) contradicts doc-08                     |
| `variant_of`    | Same topic, different scope (country, customer, team or product). | doc-03 (Netherlands) is a variant of doc-05 (Belgium)          |
| `duplicate_of`  | Same content, not the official copy.                              | doc-04 (OneDrive copy) duplicates doc-05                       |
| `supports`      | A record confirms or explains a document.                         | chat-01 (Pieter links doc-05), chat-03 explains the cap        |
| `answered_with` | An answer sent to a customer relied on this document.             | ticket-02 (Havenkaai, 15 days) answered with doc-01 and doc-02 |

Only `confirmed` links decide which document is used. A `suggested` link never decides silently: it is shown as a warning and waits in the owner's queue.

`answered_with` never changes which document is used: an answer says a customer relies on a document, not that the document is right. Counting it as `supports` would make a wrong document more trusted with every wrong answer given from it. It only feeds living answers: when a new document supersedes an old one, the `answered_with` links on the old one are the customers to notify. Answers are items of kind `answer` (logged by the consultant in one click) or resolved tickets. Resolved tickets get their links from `linkedDocuments` in `tickets.json`. Answer fields that do not fit the table (recipient, answered by, sent at, notified at) go in a small `answers` table keyed by item id.

## Answering a question

The service colleague picks the customer on the phone (Havenkaai or Veldra) and types the question. The customer sets the scope: country and customer. Scope is explicit, not guessed by a model.

1. **Find candidates** with Postgres full text search (`simple` configuration, so Dutch, French and English all work) over every site, not only the colleague's own team site. The right birth leave document lives on the legal site, which is why the existing agent never returned it.
2. **Apply the graph rules** below. Each rule that removes or lowers a document attaches the reason shown in the UI.
3. **Pick the answer**: the highest remaining document. Tie-break: customer-specific before country-wide before general, then most recently checked, then search score.
4. **Show** the passage from the chosen document with its owner, scope and last check date, the records that support it ("Pieter answered this in the customer service channel"), and the "not used" list.

| Rule                                        | Effect              | Reason shown (corpus example)                                                                                    |
| ------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Scope does not match                        | Not used            | doc-03: "Applies to the Netherlands. Havenkaai is a Belgian customer."                                           |
| Superseded by a confirmed link              | Not used            | doc-01: "Replaced by _Geboorteverlof België_. Says 15 days, written in 2021, no owner."                          |
| Owner has left                              | Not used or lower   | doc-02: "Owner Annick Wouters left in 2024. Modified 23 September by the template migration, content from 2022." |
| Duplicate of a confirmed link               | Not used            | doc-04: "Personal copy of _Geboorteverlof België_, sent by email. Use the original."                             |
| Suggested contradiction with a newer source | No confident answer | doc-08: "A newer legal update (June 2026) disagrees. Pieter De Smedt owns this topic." Opens review.             |
| No owner                                    | Lower, warning      | "No owner. Nobody vouches for this document."                                                                    |
| Not checked in the last 12 months           | Lower, warning      | "Last checked 14 months ago."                                                                                    |

The choice of document is made by these rules, never by a language model. That is the trust argument in the pitch. Tonight the answer text is the passage itself. Stretch: an LLM summary that may only cite the chosen document.

## Review queue

Each colleague sees the items assigned to them. Every outcome is one click (see `hr-research.md` section 7: correcting must be as cheap as accepting).

| Kind             | Shown                                                      | Actions                                                                                                                                                                                                                                                                                                                               |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `conflict`       | Both passages side by side, the differing part marked      | Document versus newer record: "Document is right", "Newer source is right, add it to the document" (prefilled passage, sets last check to today), "Retire document". Two documents: "A is correct" (`supersedes`), "Both correct, different scope" (`variant_of`), "Same content" (`duplicate_of`). Always: "Assign to someone else". |
| `stale`          | Document and its last check date                           | "Still correct" (sets last check), "Outdated" (retire, optionally pick the replacement)                                                                                                                                                                                                                                               |
| `suggested_link` | Both items and the proposed link type                      | "Confirm", "Reject"                                                                                                                                                                                                                                                                                                                   |
| `no_owner`       | Document, and colleagues who own or answered related items | Pick an owner. Covers owners who left (doc-02, doc-16).                                                                                                                                                                                                                                                                               |

Every action is a Server Action that checks the user is the assignee, validates input with zod, writes `resolvedBy` and `resolvedAt`, and revalidates the ask, review and document pages.

## Pages

| Route             | What                                                                                                                              | Tonight |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `/ask`            | Customer picker, question, answer card, supporting records, "not used" list, "ask this person" when there is no confident answer. | Yes     |
| `/review`         | The current user's queue.                                                                                                         | Yes     |
| `/documents/[id]` | Trust panel (owner, scope, last check, source, modified by) and incoming and outgoing links grouped by type.                      | Yes     |
| `/documents`      | List with a trust summary per team: share with an active owner, share checked in 12 months, open conflicts. Never per person.     | If time |
| Graph view        | Small neighbourhood of one document.                                                                                              | Stretch |

## Demo script

About three minutes. Every step uses corpus items, so the story holds up if the jury asks.

1. **(20 s) Before.** 30 September, 09:14. Inge Claes (HR, Havenkaai) calls Lotte Verhaegen about birth leave for Youssef Benali (call-01). The existing agent returns the brief's three documents: the English quick guide "modified last week", the Dutch document for the Netherlands and the work instruction without an owner (agent-log). Bram emails a fourth, personal copy (mail-01). Lotte answers 15 days (ticket-02). The customer comes back: Youssef read online it is 20 (mail-12).
2. **(60 s) Same question in our tool.** Answer from _Geboorteverlof België_ (doc-05): 20 days, the first 3 paid by the employer, 17 by the mutualiteit at 82% of capped gross, within 4 months. Owner Pieter De Smedt, last checked 12 June 2026. Pieter also answered this in the customer service channel at 12:10 (chat-01), 22 minutes after the customer's complaint. Under it, the four documents Lotte had, each with its reason (see the rules table).
3. **(70 s) A conflict, fixed live.** Inge's second question (call-03): will staff above EUR 4,000 be fully indexed in January 2027? The only owned document (doc-08) is from January and says nothing about a cap. The June legal update (mail-05) says only the first EUR 4,000 is indexed. The tool does not pick one. It shows both passages, names Pieter as owner and links his worked example in the legal channel (chat-03). Switch to Pieter: the conflict is first in his queue. One click: "Newer source is right, add it to the document". Back to Lotte, same question: answered from doc-08, checked today, with the example from mail-05 (EUR 5,000 gross: EUR 150.40 instead of EUR 188.00, simulated at the forecast 3.76%).
4. **(30 s) Document page and trust summary.** The links that made step 2 possible. Per team: documents without an active owner, documents not checked in 12 months, open conflicts.
5. **(10 s) Close.** This sits under the agent SD Worx already has. One slide on what else the same graph does: Elif taking over Veldra (the Nike example), where the 2022 account plan says the cut-off is the 20th, the signed annex says the 18th, and the customer has asked for the 17th.

## Who does what tonight

| Person | Owns                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------ |
| 1      | Data: types, schema, migration, corpus import with the label parser, link seed file, repository. |
| 2      | `/ask`: search, ranking rules with reasons, answer card.                                         |
| 3      | `/review` and `/documents/[id]`: queue, Server Actions, audit fields.                            |
| 4      | Pitch: deck, demo script, figure checks at the source, rehearsal. Writes the answer key test.    |

Person 1 publishes the types and repository interface first, so 2 and 3 can build against them.

Order: data model and corpus import, then ask page and review queue in parallel, then the demo accounts and the trust summary, then polish and two full rehearsals. Freeze features 45 minutes before the end.

## Open decisions

1. **Users.** The existing accounts are Havenkaai employees with roles `employee`, `manager` and `hr`. This tool is used by SD Worx colleagues. Proposal: add a `colleagueId` to the user and two one-click demo accounts from `people.json`: Lotte Verhaegen (payroll consultant) and Pieter De Smedt (legal expert, owner). Hide the leave and payslip pages from colleague accounts.
2. **LLM tonight or not.** Proposal: not tonight. Labels are parsed, links are seeded by hand, and the rules are the product. Add LLM link suggestions and the answer summary for the final on 20 October.
3. **Joint committee.** In call-03 Inge says Havenkaai's bedienden are in PC 200. The app dataset (`sample-data.md`) puts them in PC 226, and doc-08 is PC 200 only. Proposal: scope on country and customer only tonight, and fix the mismatch in the corpus or the dataset afterwards.
4. **Name.** "Trust graph" is a working name.
