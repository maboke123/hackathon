---
title: Veldra Deutschland, Innovapay implementation status
source: wiki
path: /implementation-de/customers/veldra-deutschland/status
created: 2025-10-01
modified: 2026-02-11
modifiedBy: katrin.weber@sdworx.example
---

# Veldra Deutschland GmbH: Innovapay implementation status

Implementation lead: Katrin Weber (Implementation Germany)
Customer contact: Anja Keller, HR business partner Germany
Global account owner: Jonas Peeters (Enterprise accounts, Antwerp)

## Summary

| Item                                | Status                                            |
| ----------------------------------- | ------------------------------------------------- |
| Go-live payroll (Innovapay)         | **1 April 2026** (first live payroll: April 2026) |
| Go-live time registration (Protime) | **1 April 2026**, same date as payroll            |
| Overall status                      | Amber                                             |
| Last status update                  | 11 February 2026                                  |

Scope: 600 employees, office Düsseldorf and 22 stores. Payroll moves from the previous provider to SD Worx Innovapay on SAP SuccessFactors. Store staff hours will come from Protime terminals and the myProtime app from the same date.

## Workstreams

| Workstream                                     | Owner                      | Status  | Comment                                                                                                                     |
| ---------------------------------------------- | -------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| Employee master data                           | Katrin Weber / Anja Keller | Amber   | Second extract from the old provider received 5 February. About 8% of records still miss a valid Steuer-ID or Krankenkasse. |
| Year-to-date values (Lohnjournal 2026)         | Katrin Weber               | Amber   | Needed for the April run. Mapping of old wage types to Innovapay wage types 85% done.                                       |
| Wage types and Tarifvertrag (Einzelhandel NRW) | Payroll consultant DE      | Green   | Store allowances and Sonntagszuschläge configured.                                                                          |
| Interfaces (SuccessFactors Employee Central)   | Integration team           | Green   | Test interface running since January.                                                                                       |
| Protime configuration                          | Ruben Jacobs (Protime)     | Green   | Store schedules and clocking rules configured for 3 pilot stores.                                                           |
| Parallel runs                                  | Katrin Weber               | Planned | Parallel run 1 with February data, parallel run 2 with March data.                                                          |
| DEÜV / ELStAM registration                     | Payroll consultant DE      | Planned | Registration of SD Worx as payroll provider in March.                                                                       |
| Training HR and store managers                 | Anja Keller                | Planned | Train the trainer in March.                                                                                                 |

## Timeline

| Date       | Milestone                                      |
| ---------- | ---------------------------------------------- |
| 01-10-2025 | Kick-off in Düsseldorf                         |
| 15-12-2025 | Design sign-off                                |
| 20-02-2026 | Parallel run 1 (February payroll)              |
| 18-03-2026 | Parallel run 2 (March payroll)                 |
| 25-03-2026 | Go / no-go meeting with Veldra                 |
| 01-04-2026 | Go-live Innovapay and Protime                  |
| April 2026 | First live payroll, hypercare until end of May |

## Risks and actions

1. **Data quality from the old provider.** If the missing tax and health insurance data is not complete by 20 February, parallel run 1 will not be representative. Action: Anja Keller to chase the stores for the missing forms. Due 18 February.
2. **Year-to-date values.** The old provider delivers the Lohnjournal only as PDF. We need a structured file for the cumulative values. Action: Katrin to escalate to the old provider through Veldra. Due 16 February.
3. **Works council (Betriebsrat).** Time registration in the stores needs information to the Betriebsrat. Anja is preparing the presentation for the February meeting.

## Decisions

- 15-12-2025: Protime goes live together with payroll, so that store hours flow into the first Innovapay run.
- 15-12-2025: No retroactive corrections for Q1 in Innovapay. Q1 corrections stay with the old provider.
- 28-01-2026: Hypercare by the implementation team until the second live payroll.

## Links

- Design document Veldra DE (implementation-de/customers/veldra-deutschland/design)
- Test log parallel runs (implementation-de/customers/veldra-deutschland/tests)
