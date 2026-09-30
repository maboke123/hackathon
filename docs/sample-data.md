# Sample data

The app runs on a synthetic knowledge corpus: internal SD Worx documents, emails, calls, meetings, chats and tickets, plus the colleagues and customers they mention. All people, customers and email domains are fictional. "Today" in the dataset is `REFERENCE_DATE` (2026-09-30).

Havenkaai Logistics NV, the fictional Belgian company of the first version of the app, is now a customer in `customers.json`. Its HR dataset (employees, leave, payslips) was removed on 30 September 2026.

## Database

| Table             | From                                 | What                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `teams`           | `people.json`                        | SD Worx teams. Review items without an owner are routed to a team.                                                                                                                                                                                                                                                              |
| `colleagues`      | `people.json`                        | Name, email, job title, team, status (`active`, `left`, `service_account`) and `successorId` for people who left.                                                                                                                                                                                                               |
| `customers`       | `customers.json`                     | Havenkaai, Veldra and two small customers from the tickets. Contacts and entities per country as JSON.                                                                                                                                                                                                                          |
| `knowledge_items` | All corpus files                     | One row per document, email, call, meeting, chat thread or ticket. File path in the corpus, source system and location, scope (country, customer, team, product, PC), owner, author, dates, status.                                                                                                                             |
| `knowledge_links` | Parsed from tickets, `seed/links.ts` | Typed links between items: `supersedes`, `contradicts`, `variant_of`, `duplicate_of`, `supports`, `cites`, `based_on`. `evidence` quotes the passage in `fromId`, `toEvidence` the passage in `toId` (set for the seeded conflicts). Status `suggested`, `confirmed` or `rejected`, origin `parsed`, `seed`, `jev` or `person`. |
| `review_items`    | Computed in `seed/corpus.ts`         | The review queue and its audit trail: conflicts and suggested links, documents without an active owner, documents not checked in 12 months. Each task has a `source` (`schedule`, `usage`, `request`, `conflict_check`, `parent_change`), a `dueAt` date and an optional `requestedById`.                                       |
| `karma_events`    | Check dates in the corpus            | One row per decision in the review queue: colleague, task kind, document, points, on time or not. Seeded with one on-time check per `lastCheckedAt` of a document with an active owner.                                                                                                                                         |
| `agent_queries`   | `agent-log.json`                     | What the existing internal assistant returned, for the "before" part of the demo.                                                                                                                                                                                                                                               |

`knowledge_items.search` is a generated full text column (`simple` configuration, title weighted above body). `repository.searchItems(query)` uses it.

## From corpus to database

1. `pnpm --filter web knowledge:build` runs `apps/web/scripts/build-knowledge-corpus.mts`. It parses the raw files into `src/lib/data/seed/corpus.generated.json`. It reads only what the source systems carry: front matter, email and call headers, owner lines ("Eigenaar:", "Owner:", "Responsable :"), version tables and "Last reviewed" lines, and the SharePoint site in the path for scope. Commit the JSON after running it.
2. `seed/links.ts` holds the hand-written links for the demo scenarios.
3. `seed/reviews.ts` holds review tasks the corpus alone does not produce, so every kind is in the demo: a rule change (doc-06 based on doc-07, still says EUR 8), a check Lotte requested during a call (doc-10, to Bram) and three suggested labels (owner Elif for doc-21, country BE for doc-04, owner Pieter for doc-15 at 58% confidence).
4. `seed/corpus.ts` validates the JSON with zod, adds the links and computes the review items. `repository.reset()` loads it on startup when the database is empty.

Parsed labels are deliberately incomplete: most documents in the corpus carry no owner or check date, and that is what the demo is about.

## Usage

```ts
import { getRepository } from "@/lib/data";

const repository = getRepository();
const results = await repository.searchItems("geboorteverlof vader", {
  kind: "document",
});
const links = await repository.listLinks({ itemId: "doc-05" });
const queue = await repository.listReviewItems({
  assigneeId: "p-pieter",
  status: "open",
});
```

To put a task in someone's queue, do not call `createReviewItem` directly. Use `enqueueReview` from `@/lib/review` (see `plan.md` 3.5): it checks the document has an owner, routes it and avoids duplicates.

Use the repository in Server Components and Server Actions. `@/lib/data` is server only. Client components import labels from `@/lib/data/labels` and types from `@/lib/data/types`. Every entity has a zod schema in `types.ts`.

## Storage

- On startup the app runs the migrations and loads the corpus when the database is empty.
- Without `DATABASE_URL` the app uses an in-memory database (PGlite) that starts from the corpus on every restart.
- With `DATABASE_URL` the data persists. Any signed-in user can restore the starting state with "Reset demo data" in the user menu (top right), rate limited to 10 resets per 10 minutes. Accounts are kept.

To add a field or table: change the zod type in `types.ts`, the table in `schema.ts`, the converter or seed, run `pnpm db:generate` and commit the new file in `apps/web/drizzle`.

## Demo accounts

The password for all four is `havenkaai-demo`. They are listed in `src/lib/auth/demo-accounts.ts`.

| Colleague       | Why                                                                                  |
| --------------- | ------------------------------------------------------------------------------------ |
| Lotte Verhaegen | Payroll consultant, customer service Belgium. Takes the Havenkaai calls.             |
| Pieter De Smedt | Legal expert. Owns the birth leave and indexation documents, gets the conflict.      |
| Elif Aydin      | Incoming account owner for Veldra (the Nike example).                                |
| Ellen Goossens  | Knowledge manager. Receives items that no team can take and can reset the demo data. |

## Knowledge corpus

For the SD Worx challenge (find, trust and share knowledge) there is a second dataset: synthetic internal SD Worx knowledge, in `apps/web/src/lib/data/seed/knowledge`. It is raw and unlabelled, so we can build and demo labelling on it. All people, customers and email domains are fictional.

| Path                | What                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `documents/`        | 22 documents. Markdown source with source-system front matter (path, created, modified, modified by), rendered to PDF. One CSV export. |
| `emails/`           | 12 emails as `.eml`                                                                                                                    |
| `calls/`            | 5 phone call transcripts from speech recognition                                                                                       |
| `meetings/`         | 4 Teams meeting transcripts as WebVTT                                                                                                  |
| `chats/`            | 5 Teams channel and direct message exports as JSON                                                                                     |
| `tickets.json`      | Service desk tickets, with the document each resolution relied on                                                                      |
| `agent-log.json`    | What the existing internal assistant returned for real questions                                                                       |
| `people.json`       | SD Worx colleagues, including people who left and a service account                                                                    |
| `customers.json`    | Havenkaai Logistics (same company as the app dataset) and Veldra Sportswear, a fictional stand-in for Nike in six countries            |
| `ground-truth.json` | Answer key: owner, scope, status and planted contradictions per item, plus the 13 facts they agree or disagree on                      |

The corpus follows the two examples from the brief:

- **Urgent call.** Havenkaai asks about birth leave for an employee. The assistant returns three documents: a work instruction without owner, an English quick guide "modified last week" and a Dutch document that applies to the Netherlands. A colleague emails a fourth, personal copy. The correct document (20 days) sits on the legal site and is never returned. The consultant answers 15 days and the customer follows up.
- **Customer onboarding.** Elif takes over the Veldra account from Jonas. The 2022 account plan and the contact list are outdated (cut-off date, escalation contact, HR director, Dutch payroll engine), the German status page still shows the old go-live date, and the Spanish pay rule exists only in a chat.

Traps worth knowing:

- **Modified is not verified.** A brand template migration touched every file on three Belgian SharePoint sites between 22 and 26 September 2026, so their modified date says nothing about their content.
- **Knowledge outside documents.** The EUR 4,000 indexation cap and the Spanish prorrateo rule are only explained in chats, meetings and a newsletter.
- **Control items.** Some documents are old but correct and reviewed (holiday pay, ecocheques, Flex Income Plan). Do not flag everything old as outdated.

The answer key lists the planned contradictions only. The items were written in parallel and never cross-checked on purpose, so expect more small inconsistencies, as in real data.

`ground-truth.json` is for building and testing. Do not show it in the app as source data. After editing a Markdown document, regenerate its PDF from `apps/web`:

```sh
pnpm knowledge:pdf            # all documents
pnpm knowledge:pdf doc-05     # one document
```
