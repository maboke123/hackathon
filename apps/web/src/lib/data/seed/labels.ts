import type { Colleague, DocumentType, KnowledgeItem } from "../types";

type Labelled = Pick<
  KnowledgeItem,
  | "country"
  | "subject"
  | "documentType"
  | "accessLevel"
  | "accessTeamIds"
  | "labelStatus"
>;

const TEAM_TYPES: [RegExp, DocumentType][] = [
  [/legal/, "legal"],
  [/customer-service|service-desk/, "customer_service"],
  [/enterprise-accounts|enterprise-service-delivery/, "sales"],
  [
    /implementation|innovapay|managed-payroll|payroll-poland|sd-worx-france/,
    "implementation",
  ],
  [/reward-products/, "product"],
  [/knowledge-and-content/, "internal"],
];

const TEAM_COUNTRIES: [RegExp, string][] = [
  [/belgium|benelux/, "BE"],
  [/netherlands/, "NL"],
  [/germany/, "DE"],
  [/spain/, "ES"],
  [/france/, "FR"],
  [/poland/, "PL"],
];

const SUBJECTS: [RegExp, string][] = [
  [/legal update/i, "Legal update"],
  [
    /quarterly service review|contacts and escalation|account plan|service agreement|nouveau contact|grands comptes|introduction and escalation|werknemerslijn/i,
    "Customer account",
  ],
  [/handover/i, "Account handover"],
  [/onboarding as a new account owner/i, "Account onboarding"],
  [
    /payroll cut-?off|afsluitdatum|overtime|overuren|payroll run/i,
    "Payroll processing",
  ],
  [/geboorteverlof|birth leave|vaderschapsverlof/i, "Birth leave"],
  [/maaltijdcheque|meal voucher/i, "Meal vouchers"],
  [/indexering|indexation|indexatie|budget indexering/i, "Wage indexation"],
  [
    /dubbel vakantiegeld|vertrekvakantiegeld|holiday pay|paga extra|extra pay/i,
    "Holiday pay",
  ],
  [/ecocheque/i, "Eco vouchers"],
  [/jobstudent|student work/i, "Student work"],
  [/dimona/i, "Dimona"],
  [/flexi-?job/i, "Flexi-jobs"],
  [/pay transparency|loontransparantie/i, "Pay transparency"],
  [/flex income plan|FIP/i, "Flex Income Plan"],
  [/go-live|innovapay|protime|retro/i, "Payroll implementation"],
  [/nomina/i, "Payroll processing"],
  [/huisstijl|huddle/i, "Internal communication"],
  [/automatic reply|out of office|afwezig/i, "Out of office"],
];

const TEXT_COUNTRIES: [RegExp, string][] = [
  [/belgi|belgium|belgique/i, "BE"],
  [/deutschland|germany|duitsland/i, "DE"],
  [/polska|poland|polen/i, "PL"],
  [/iberia|spain|espa|nomina/i, "ES"],
  [/france|frankrijk/i, "FR"],
  [/nederland|netherlands/i, "NL"],
];

const RESTRICTED =
  /contract|agreement|account plan|contacts and escalation|annex|personeelsnummer|personnel number/i;

const FALLBACK_TEAM = "team-knowledge-and-content-operations";
const CS_BELGIUM = "team-customer-service-belgium-sme";

const OVERRIDES: Record<string, Partial<Labelled>> = {
  "mail-03": {
    documentType: "internal",
    accessLevel: "company",
    country: "BE",
  },
  "mail-06": { documentType: "customer_service" },
  "mail-12": { documentType: "customer_service" },
  "mail-07": { documentType: "sales" },
  "mail-09": { documentType: "sales" },
  "mail-04": { accessLevel: "company" },
  "mail-05": { accessLevel: "company" },
  "chat-01": { documentType: "customer_service" },
  "doc-14": { documentType: "sales" },
};

function pick<T>(rules: [RegExp, T][], text: string): T | null {
  return rules.find(([pattern]) => pattern.test(text))?.[1] ?? null;
}

export function labelItem(
  item: KnowledgeItem,
  colleagues: Colleague[],
  countriesByCustomer: Map<string, string[]>,
): Labelled {
  const team = item.teamId ?? "";
  const owner = colleagues.find((person) => person.id === item.ownerId);
  const customerCountries = item.customerId
    ? (countriesByCustomer.get(item.customerId) ?? [])
    : [];
  const scopeText = `${item.title}
${item.location}
${item.body.slice(0, 400)}`;
  const country =
    item.country ??
    (customerCountries.length === 1 ? customerCountries[0] : null) ??
    pick(TEAM_COUNTRIES, team) ??
    (item.customerId || item.kind === "document"
      ? pick(TEXT_COUNTRIES, scopeText)
      : null) ??
    null;

  const subject = pick(SUBJECTS, `${item.title}\n${item.body.slice(0, 600)}`);
  const documentType =
    pick(TEAM_TYPES, team) ?? (item.customerId ? "sales" : "internal");

  const isPrivate = item.sourceSystem === "onedrive" || item.status === "draft";
  const isConversation = ["email", "chat", "meeting", "call"].includes(
    item.kind,
  );
  const accessLevel: Labelled["accessLevel"] = isPrivate
    ? "private"
    : RESTRICTED.test(`${item.title}
${item.location}`)
      ? "restricted"
      : item.kind === "ticket" || isConversation || item.customerId
        ? "team"
        : item.location.startsWith("/sites/Legal")
          ? "company"
          : "team";

  const accessTeamId =
    item.teamId ??
    (item.customerId && country === "BE" ? CS_BELGIUM : FALLBACK_TEAM);
  const accessTeamIds = accessLevel === "company" ? [] : [accessTeamId];

  const complete = Boolean(
    country && subject && item.teamId && (owner || item.kind !== "document"),
  );

  return {
    country,
    subject: subject ?? item.title,
    documentType,
    accessLevel,
    accessTeamIds,
    labelStatus: complete ? "labelled" : subject ? "partial" : "unlabelled",
    ...OVERRIDES[item.id],
  };
}
