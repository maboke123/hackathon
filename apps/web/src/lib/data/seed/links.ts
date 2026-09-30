import type { NewLink } from "../types";

// The links a labeller would produce for the demo scenarios (docs/plan.md).
// Confirmed links decide answers. Suggested links wait in the owner's queue.
export const seedLinks: (Omit<NewLink, "toEvidence"> & {
  toEvidence?: string;
})[] = [
  {
    fromId: "doc-05",
    toId: "doc-01",
    type: "supersedes",
    reason:
      "Says 15 days. Since 1 January 2023 birth leave is 20 days in Belgium.",
    evidence: null,
    status: "confirmed",
    origin: "seed",
    confidence: null,
    createdBy: "p-pieter",
  },
  {
    fromId: "doc-05",
    toId: "doc-02",
    type: "supersedes",
    reason:
      "Says 15 days, written in 2022. Birth leave is 20 days since 1 January 2023.",
    evidence: null,
    status: "confirmed",
    origin: "seed",
    confidence: null,
    createdBy: "p-pieter",
  },
  {
    fromId: "doc-04",
    toId: "doc-05",
    type: "duplicate_of",
    reason:
      "Personal OneDrive copy of the 2023 update. Use the original on the legal site.",
    evidence: null,
    status: "confirmed",
    origin: "seed",
    confidence: null,
    createdBy: "p-pieter",
  },
  {
    fromId: "doc-03",
    toId: "doc-05",
    type: "variant_of",
    reason: "Same topic, rules for the Netherlands.",
    evidence: null,
    status: "confirmed",
    origin: "seed",
    confidence: null,
    createdBy: "p-sanne",
  },
  {
    fromId: "chat-01",
    toId: "doc-05",
    type: "supports",
    reason:
      "Pieter confirms 20 days in the customer service channel and links the document.",
    evidence: null,
    status: "confirmed",
    origin: "seed",
    confidence: null,
    createdBy: "system",
  },
  {
    fromId: "doc-06",
    toId: "doc-07",
    type: "based_on",
    reason:
      "The customer service instruction applies the legal meal voucher rules.",
    evidence: null,
    status: "confirmed",
    origin: "seed",
    confidence: null,
    createdBy: "p-bram",
  },
  {
    fromId: "mail-04",
    toId: "doc-07",
    type: "supports",
    reason: "The December 2025 legal update announces the EUR 10 maximum.",
    evidence: null,
    status: "confirmed",
    origin: "seed",
    confidence: null,
    createdBy: "system",
  },
  {
    fromId: "mail-05",
    toId: "doc-08",
    type: "contradicts",
    reason:
      "The June 2026 legal update caps indexation at the first EUR 4,000 gross. The document indexes the full salary.",
    evidence:
      "Vanaf nu wordt bij een indexering alleen het deel van het brutoloon tot EUR 4.000 geïndexeerd.",
    toEvidence: "Het percentage wordt op het volledige brutoloon toegepast.",
    status: "suggested",
    origin: "seed",
    confidence: null,
    createdBy: "system",
  },
  {
    fromId: "chat-03",
    toId: "mail-05",
    type: "supports",
    reason: "Pieter explains the EUR 4,000 cap with a worked example.",
    evidence: null,
    status: "confirmed",
    origin: "seed",
    confidence: null,
    createdBy: "system",
  },
  {
    fromId: "mail-05",
    toId: "doc-15",
    type: "contradicts",
    reason:
      "Belgium missed the 7 June 2026 deadline. The draft says the law applies from that date.",
    evidence:
      "De Europese richtlijn over loontransparantie (2023/970) moest tegen 7 juni 2026 omgezet zijn. België heeft die deadline gemist en heeft de Europese Commissie om zes maanden extra gevraagd.",
    toEvidence:
      "Yes. The Belgian law transposing the directive applies from **7 June 2026** to all employers in the private sector, whatever their size.",
    status: "suggested",
    origin: "seed",
    confidence: null,
    createdBy: "system",
  },
  {
    fromId: "doc-18",
    toId: "doc-16",
    type: "supersedes",
    reason:
      "The signed 2025 annex sets the cut-off on the 18th and names Sofie Hermans for escalation. The 2022 plan says the 20th and Wim Van den Broeck.",
    evidence:
      "Input cut-off (variable data, new hires, leavers, absences): 18th of the month, 17:00",
    toEvidence: "Monthly payroll input cut-off: the 20th of the month, 17:00.",
    status: "suggested",
    origin: "seed",
    confidence: null,
    createdBy: "system",
  },
  {
    fromId: "mail-02",
    toId: "doc-19",
    type: "contradicts",
    reason:
      "The go-live moved to 1 July 2026. The status page still says 1 April 2026.",
    evidence:
      "The go-live of Innovapay for Veldra Deutschland GmbH moves from 1 April 2026 to 1 July 2026.",
    toEvidence:
      "Go-live payroll (Innovapay): 1 April 2026 (first live payroll: April 2026)",
    status: "suggested",
    origin: "seed",
    confidence: null,
    createdBy: "system",
  },
  {
    fromId: "chat-02",
    toId: "doc-20",
    type: "contradicts",
    reason:
      "Store staff get the two extra payments prorated monthly since the 2025 store agreement. The instruction does not mention it.",
    evidence:
      "The new collective agreement for their stores says the two pagas extra are prorated for store staff (prorrateo). So they get 1/6 of the extra payments every month, 12 payslips instead of 14.",
    toEvidence:
      "All employees, office and stores, receive the pagas extra with the June and December payroll.",
    status: "suggested",
    origin: "seed",
    confidence: null,
    createdBy: "system",
  },
  {
    fromId: "doc-12",
    toId: "doc-11",
    type: "duplicate_of",
    reason:
      "Mostly copied from the customer service procedure. Adds student and flexi Dimona types for Staffing.",
    evidence: null,
    status: "suggested",
    origin: "seed",
    confidence: null,
    createdBy: "system",
  },
  {
    fromId: "doc-02",
    toId: "doc-01",
    type: "based_on",
    reason:
      "The quick guide sends colleagues to the work instruction for the registration steps.",
    evidence: null,
    status: "confirmed",
    origin: "seed",
    confidence: null,
    createdBy: "system",
  },
];
