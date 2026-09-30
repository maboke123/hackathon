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

Use the repository in Server Components, Route Handlers and Server Actions. Dutch display labels for enum values are in `@/lib/data` (`leaveTypeLabels`, `contractTypeLabels` and so on). Every entity has a zod schema in `types.ts`.

## Storage

The data lives in memory. Writes (creating or deciding a leave request) work during a session and are lost on restart or redeploy, which resets the demo to a clean state. `repository.reset()` does the same on demand.

The app only talks to the `DataRepository` interface in `repository.ts`. If an idea needs persistence, add a SQLite implementation of that interface and return it from `getRepository()`. Nothing else has to change.

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
