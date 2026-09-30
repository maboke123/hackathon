# Sample data

The demo app ships with a synthetic dataset for a fictional Belgian company, Havenkaai Logistics NV in Antwerp. All people and figures are made up. The enterprise number and the `.example` email domain are deliberately invalid.

## Contents

| Entity         | Count | Notes                                                                   |
| -------------- | ----- | ----------------------------------------------------------------------- |
| Company        | 1     | 38 hour week                                                            |
| Departments    | 8     | Directie, Magazijn, Transport, Customer service, Sales, Finance, HR, IT |
| Employees      | 54    | 28 bedienden (PC 226), 26 arbeiders (PC 140.03), 4 have left            |
| Contracts      |       | 40 onbepaalde duur, 9 bepaalde duur, 3 students, 2 flexi-jobs           |
| Leave requests | 185   | Calendar year 2026, past and planned, with pending requests to approve  |
| Leave balances | 80    | Wettelijke vakantie and ADV per employee                                |
| Payslips       | 469   | January to September 2026                                               |

The data is generated from a fixed seed, so it is identical on every machine and after every restart. "Today" in the dataset is `REFERENCE_DATE` (2026-09-30).

## Usage

```ts
import { getRepository } from "@/lib/data";

const repository = getRepository();
const employees = await repository.listEmployees({ departmentId: "dep-hr" });
const payslips = await repository.listPayslips({ period: "2026-09" });
```

Use the repository in Server Components, Route Handlers and Server Actions. `@/lib/data` is server only. Client components import labels from `@/lib/data/labels` and types from `@/lib/data/types`. Dutch display labels for enum values are in `labels.ts` (`leaveTypeLabels`, `contractTypeLabels`, `employmentStatusLabels` and so on). Every entity has a zod schema in `types.ts`.

## Storage

The data lives in Postgres, accessed through Drizzle. The tables are defined in `src/lib/db/schema.ts` and mirror the zod types. `db-repository.ts` implements the `DataRepository` interface, so pages and actions never touch SQL directly.

- On startup the app runs the migrations and loads this dataset when the database is empty.
- Without `DATABASE_URL` the app uses an in-memory database (PGlite) that starts from this dataset on every restart.
- With `DATABASE_URL` the data persists across restarts and deploys. HR can restore the original dataset with "Reset demo data" on the overview page, which calls `repository.reset()`. Accounts are kept.

To add a field or table: change the zod type in `types.ts`, the table in `schema.ts` and the seed, run `pnpm db:generate` and commit the new file in `apps/web/drizzle` with your change.

## Demo accounts

The app creates one account for three employees in the dataset. The password for all three is `havenkaai-demo`.

| Role     | Name           | Email                            |
| -------- | -------------- | -------------------------------- |
| HR       | Inge Claes     | inge.claes@havenkaai.example     |
| Manager  | Julien Lambert | julien.lambert@havenkaai.example |
| Employee | Youssef Benali | youssef.benali@havenkaai.example |

The accounts are chosen in `src/lib/auth/demo-accounts.ts`: the HR manager, the warehouse manager and a full-time member of the warehouse team. Add an employee id to `employeeIds` there to get another one-click account. Signing up with any other employee email links the new account to that employee.

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

## Payroll figures are simplified

Payslips are calculated in `payroll.ts` with a simplified model. They look realistic but are not legally correct, so present them as simulated.

| Element             | Value used                     | Simplification                                                        |
| ------------------- | ------------------------------ | --------------------------------------------------------------------- |
| RSZ employee        | 13.07%                         | On 108% of gross for arbeiders                                        |
| RSZ employer        | 25%                            | Sector and special contributions ignored                              |
| Students            | 2.71% employee, 5.42% employer | Solidarity contribution, no withholding tax                           |
| Flexi-jobs          | 0% employee, 28% employer      | Net equals gross                                                      |
| Bedrijfsvoorheffing | Brackets 25, 40, 45, 50%       | Single person without children, approximate thresholds, no work bonus |
| Maaltijdcheques     | EUR 10 per worked day          | Employee share EUR 1.09                                               |
| Thuiswerkvergoeding | EUR 84 per month               | Office roles only                                                     |
| Ecocheques          | EUR 250 per year               |                                                                       |

Not modelled: 13th month, holiday pay, indexation, benefit in kind on company cars, public holidays and absences in worked days.

Sources for these values are in `docs/sd-worx-briefing.md`, section 6.
