# Build plan: trust graph

The idea is described in [ideas.md](ideas.md#trust-graph). This file is how we build and demo it.

## The pitch in one line

Your agent is only as trustworthy as its sources. We make the sources trustworthy, and every answer says why.

## What the jury must see

1. One question, one answer, and a list of the documents that were not used with the reason for each.
2. A conflict the system cannot resolve goes to a person instead of being guessed. The owner fixes it in one click and the next answer is right.
3. The graph is visible through the answer and the document page, not as a hairball.

## Data model

New tables next to the existing dataset. Follow the schema change steps in `AGENTS.md` (types, schema, seed, repository, `pnpm db:generate`).

| Table            | Fields                                                                                                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colleagues`     | SD Worx colleagues who own or know documents: id, name, team, country, email (`.example` domain).                                                                                                                                                                                  |
| `documents`      | id, title, body (short Markdown), source (`sharepoint`, `teams`, `email`, `wiki`), country (null means all), customerId (null means all customers), jointCommittee (null means all), keywords, ownerId (nullable), updatedAt, verifiedAt (nullable), status (`active`, `retired`). |
| `document_links` | id, fromId, toId, type, reason, status (`suggested`, `confirmed`, `rejected`), createdBy (colleague id or `system`), createdAt, resolvedBy, resolvedAt.                                                                                                                            |
| `review_items`   | id, kind (`conflict`, `stale`, `suggested_link`, `no_owner`), documentIds, linkId (nullable), assigneeId, status (`open`, `done`), outcome, createdAt, resolvedBy, resolvedAt. This is also the audit trail.                                                                       |

Link types. Keep it to these four, a fixed list makes the ranking rules possible.

| Type          | Meaning                                                          | Effect on answers                                 |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| `supersedes`  | A replaces B.                                                    | B is not used.                                    |
| `contradicts` | A and B disagree and nobody has decided yet.                     | See the conflict rule below.                      |
| `variant_of`  | Same topic, different scope (country, customer, PC or language). | The variant that matches the caller's scope wins. |
| `based_on`    | A applies a rule or source B (a law, a cao, a Legal Watch item). | Stretch: a change in B flags every A for review.  |

Only `confirmed` links affect answers. `suggested` links wait in the review queue.

## Answering a question

The service colleague picks the caller (a Havenkaai employee) and types the question. The caller's record sets the scope: country BE, customer Havenkaai, PC 140.03 or PC 226. The scope is explicit, not guessed by a model.

1. **Find candidates** with Postgres full text search (`simple` configuration, so Dutch, French and English all work) on title, body and keywords.
2. **Apply the graph rules** below. Each rule that removes or lowers a document attaches the reason shown in the UI.
3. **Pick the answer**: the highest remaining document. Tie-break: customer-specific before country-wide before general, then most recently checked, then search score.
4. **Show** the passage from the chosen document with its owner, scope and last check date, and under it the "not used" list.

| Rule                                   | Effect         | Reason shown (example)                                            |
| -------------------------------------- | -------------- | ----------------------------------------------------------------- |
| Scope does not match the caller        | Not used       | "Applies to France. The caller works in Belgium."                 |
| Superseded by a confirmed link         | Not used       | "Replaced by _Maaltijdcheques 2026_ on 5 January 2026."           |
| Retired                                | Not used       | "Retired by Sarah Peeters on 12 March 2026."                      |
| Contradicts a stronger document        | Not used       | "Contradicts _Maaltijdcheques 2026_. Sent to review."             |
| Contradicts an equally strong document | No answer      | "Two checked sources disagree. Call Nadia Wouters." Opens review. |
| No owner                               | Lower, warning | "No owner. Nobody vouches for this document."                     |
| Not checked in the last 12 months      | Lower, warning | "Last checked 14 months ago."                                     |

"Stronger" means it has an owner and was checked in the last 12 months while the other does not. A conflict only blocks the answer when the graph cannot tell which side to trust.

The choice of document is made by these rules, never by a language model. That is the trust argument in the pitch. Tonight the answer text is the passage itself. Stretch: an LLM summary that may only cite the chosen document.

## Review queue

Each colleague sees the items assigned to them. Every outcome is one click (see `hr-research.md` section 7: correcting must be as cheap as accepting).

| Kind             | Shown                                                 | Actions                                                                                                                   |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `conflict`       | Both documents side by side, differing passage marked | "A is correct" (A supersedes B), "B is correct", "Both correct, different scope" (`variant_of`), "Assign to someone else" |
| `stale`          | Document and its last check date                      | "Still correct" (sets `verifiedAt`), "Outdated" (retire, optionally pick the replacement)                                 |
| `suggested_link` | Both documents and the proposed link type             | "Confirm", "Reject"                                                                                                       |
| `no_owner`       | Document and colleagues who own related documents     | Pick an owner                                                                                                             |

Every action is a Server Action that checks the user is the assignee, validates input with zod, writes `resolvedBy` and `resolvedAt`, and revalidates the ask, review and document pages.

## Pages

| Route             | What                                                                                                                           | Tonight |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `/ask`            | Caller picker, question, answer card, "not used" list, "call this person" when blocked.                                        | Yes     |
| `/review`         | The current user's queue.                                                                                                      | Yes     |
| `/documents/[id]` | Trust panel (owner, scope, last check, source) and incoming and outgoing links grouped by type.                                | Yes     |
| `/documents`      | List with trust summary: share with an owner, share checked in 12 months, open conflicts. Per topic or team, never per person. | If time |
| Graph view        | Small neighbourhood of one document.                                                                                           | Stretch |
| Change impact     | A `based_on` source changes and every dependent document goes to review.                                                       | Stretch |

## Seed content

About 25 to 30 documents and 6 to 8 colleagues. Figures come from `sd-worx-briefing.md` section 6 so they match what the jury may know. Label payroll figures as simulated.

Scenario 1, meal vouchers (the brief's four documents):

| Document                        | Scope | Owner and check          | Link                                              |
| ------------------------------- | ----- | ------------------------ | ------------------------------------------------- |
| Maaltijdcheques 2026            | BE    | Sarah Peeters, Sept 2026 | Answer: max EUR 10, employee share EUR 1.09       |
| Maaltijdcheques 2025            | BE    | Sarah Peeters, 2025      | Superseded by the 2026 document (max EUR 8)       |
| Titres-restaurant, guide client | FR    | French colleague         | `variant_of`, other country                       |
| Meal voucher FAQ (Teams export) | BE    | No owner, 2024           | `contradicts` the 2026 document, still says EUR 8 |

Scenario 2, the live conflict. Two Havenkaai documents, both owned and recently checked, disagree on the cut-off date for payroll changes (for example the 20th versus the 25th of the month). Question from the caller: "I moved last week. Will my new address be on this month's payslip?" The answer is blocked, Nadia Wouters (customer owner for Havenkaai) resolves it, the question is asked again. These dates are fictional customer arrangements, so they need no legal source.

Filler topics so search has something to filter: ecocheques, Dimona, dubbel vakantiegeld, indexation PC 200 in 2026, mobility budget 2026 limits, plus a few NL and FR variants and one PC 200 document that is out of scope for a PC 140.03 caller.

## Demo script

About three minutes.

1. (20 s) The problem in David's words: four documents, the customer waits.
2. (60 s) Tom Jacobs from the service desk takes a call from Youssef Benali (Havenkaai, warehouse). Question about meal vouchers. One answer, owner and last check visible. Under it, the three documents that were not used and why.
3. (60 s) Second question about the payroll cut-off. No answer: two checked sources disagree, call Nadia. Switch to Nadia's account, the conflict is at the top of her queue, one click. Back to Tom, same question, now answered, and the old document shows "replaced by".
4. (30 s) Document page: the links that made this possible, and the trust summary per topic.
5. (10 s) Close: this sits under the agent SD Worx already has.

## Who does what tonight

| Person | Owns                                                                                    |
| ------ | --------------------------------------------------------------------------------------- |
| 1      | Data: types, schema, migration, seed documents and links, repository methods.           |
| 2      | `/ask`: search, ranking rules with reasons, answer card.                                |
| 3      | `/review` and `/documents/[id]`: queue, Server Actions, audit fields.                   |
| 4      | Pitch: deck, demo script, figure checks at the source, rehearsal. Helps with seed text. |

Person 1 publishes the types and repository interface first, so 2 and 3 can build against them with the seed data.

Order: data model and seed, then ask page and review queue in parallel, then the demo accounts and the trust summary, then polish and two full rehearsals. Freeze features 45 minutes before the end.

## Open decisions

1. **Users.** The existing accounts are Havenkaai employees with roles `employee`, `manager` and `hr`. This tool is used by SD Worx colleagues. Proposal: add a `colleagueId` to the user, two new one-click demo accounts (Tom, service desk, and Nadia, customer owner), and hide the leave and payslip pages from colleague accounts. The Havenkaai data stays as the customer on the phone.
2. **LLM tonight or not.** Proposal: not tonight. The rules and reasons are the product. Add a summary and link suggestions for the final on 20 October.
3. **Name.** "Trust graph" is a working name.
