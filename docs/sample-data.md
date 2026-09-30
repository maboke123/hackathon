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
