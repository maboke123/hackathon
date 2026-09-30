import { itemKindLabels, sourceSystemLabels } from "@/lib/data/labels";
import type { Colleague, Customer, KnowledgeItem } from "@/lib/data/types";
import { formatDate } from "@/lib/format";
import type { Passage } from "@/lib/passages";

export type PersonTarget = {
  name: string;
  detail: string;
  email: string | null;
};

export type DocumentFact = { label: string; value: string };

export type DocumentPerson = {
  label: string;
  person: PersonTarget;
  /** Offer "Ask to check" for this document in the person's menu. */
  askToCheck: boolean;
};

/** Everything the document sheet shows, serialisable for client components. */
export type SheetDocument = {
  id: string;
  title: string;
  kindLabel: string;
  location: string;
  body: string;
  passage: Passage | null;
  people: DocumentPerson[];
  facts: DocumentFact[];
};

export function personTarget(colleague: Colleague): PersonTarget {
  return {
    name: colleague.name,
    detail:
      colleague.status === "active"
        ? colleague.jobTitle
        : `${colleague.jobTitle}. Left${colleague.endDate ? ` on ${formatDate(colleague.endDate)}` : ""}.`,
    email: colleague.status === "active" ? colleague.email : null,
  };
}

export function scopeLabel(item: KnowledgeItem, customers: Customer[]): string {
  const customer = customers.find((entry) => entry.id === item.customerId);
  return [
    item.country ?? "All countries",
    customer?.name ?? "All customers",
    item.jointCommittee ? `PC ${item.jointCommittee}` : null,
  ]
    .filter((label): label is string => label !== null)
    .join(", ");
}

export function toSheetDocument(
  item: KnowledgeItem,
  context: {
    colleagues: Map<string, Colleague>;
    customers: Customer[];
    passage?: Passage | null;
    viewerId?: string | null;
  },
): SheetDocument {
  const isDocument = item.kind === "document";
  const personId = isDocument ? item.ownerId : item.authorId;
  const person = personId ? context.colleagues.get(personId) : undefined;
  const people: DocumentPerson[] = person
    ? [
        {
          label: isDocument ? "Owner" : "From",
          person: personTarget(person),
          askToCheck:
            isDocument &&
            person.status === "active" &&
            person.id !== context.viewerId,
        },
      ]
    : [];

  const facts: DocumentFact[] = [];
  if (isDocument && !person) facts.push({ label: "Owner", value: "None" });
  facts.push({ label: "Scope", value: scopeLabel(item, context.customers) });
  if (isDocument) {
    facts.push(
      {
        label: "Last checked",
        value: item.lastCheckedAt ? formatDate(item.lastCheckedAt) : "Never",
      },
      { label: "Modified", value: formatDate(item.modifiedAt.slice(0, 10)) },
    );
  } else {
    facts.push({
      label: "Date",
      value: formatDate(item.createdAt.slice(0, 10)),
    });
  }

  return {
    id: item.id,
    title: item.title,
    kindLabel: `${itemKindLabels[item.kind]}, ${sourceSystemLabels[item.sourceSystem]}`,
    location: item.location,
    body: item.body,
    passage: context.passage ?? null,
    people,
    facts,
  };
}
