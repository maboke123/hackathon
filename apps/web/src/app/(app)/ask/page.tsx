import { CheckIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { EmptyState } from "@/components/empty-state";
import { InfoButton, InfoSection } from "@/components/info-button";
import { PageHeader, PageSection } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import {
  type Colleague,
  type Customer,
  getRepository,
  type KnowledgeItem,
  sourceSystemLabels,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { scopeLabel, toSheetDocument } from "@/lib/document-view";
import type { Passage } from "@/lib/passages";
import {
  askQuestion,
  type Contact,
  contactName,
  type Evaluation,
  type Reason,
  type Support,
} from "@/lib/trust";
import { DocumentSheet } from "../document-sheet";
import { PersonMenu } from "../person-menu";
import { SendToOwnerButton } from "./send-to-owner-button";

export const metadata: Metadata = {
  title: "Ask",
};

const DEFAULT_CUSTOMER_ID = "cus-havenkaai";

const examples = [
  {
    customerId: "cus-havenkaai",
    question: "Hoeveel dagen geboorteverlof krijgt een vader?",
  },
  {
    customerId: "cus-havenkaai",
    question: "Worden lonen boven 4.000 euro volledig geïndexeerd in januari?",
  },
  {
    customerId: "cus-veldra",
    question: "What is the payroll cut-off for Veldra Belgium?",
  },
];

type View = {
  customers: Customer[];
  colleagues: Map<string, Colleague>;
  viewerId: string | null;
  terms: string[];
  question: string;
};

const toneIcons = {
  good: <CheckIcon strokeWidth={1.5} className="text-success size-5" />,
  warning: (
    <TriangleAlertIcon
      strokeWidth={1.5}
      className="text-warning-foreground size-5"
    />
  ),
  blocked: <XIcon strokeWidth={1.5} className="text-destructive size-5" />,
};

function Reasons({ reasons }: { reasons: Reason[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {reasons.map((reason) => (
        <li key={reason.text} className="flex gap-2">
          <span className="mt-0.5 shrink-0 [&_svg]:size-4">
            {toneIcons[reason.tone]}
          </span>
          <span>{reason.text}</span>
        </li>
      ))}
    </ul>
  );
}

function firstSentence(text: string): string {
  return text.match(/^(.+?\.)(\s|$)/)?.[1] ?? text;
}

function ownerLabel(owner: Colleague | null): string {
  if (!owner) return "None";
  return owner.status === "active" ? owner.name : `${owner.name} (left)`;
}

function DocumentLink({
  item,
  passage,
  view,
}: {
  item: KnowledgeItem;
  passage: Passage | null;
  view: View;
}) {
  return (
    <DocumentSheet
      document={toSheetDocument(item, {
        colleagues: view.colleagues,
        customers: view.customers,
        passage,
        viewerId: view.viewerId,
      })}
      note="The highlighted part is what the answer is based on. Question words are marked."
      terms={view.terms}
      question={view.question}
    />
  );
}

function ContactLine({
  contact,
  item,
  view,
}: {
  contact: Contact | null;
  item: KnowledgeItem;
  view: View;
}) {
  if (!contact) {
    return <span>Knowledge and content operations</span>;
  }
  if (contact.kind === "team") {
    return (
      <span>
        <PersonMenu
          person={{
            name: contact.team.name,
            detail: "No owner. The team picks it up.",
            email: null,
          }}
          itemId={item.id}
          itemTitle={item.title}
          question={view.question}
        />{" "}
        <span className="text-muted-foreground">(no owner)</span>
      </span>
    );
  }
  const { colleague } = contact;
  return (
    <PersonMenu
      person={{
        name: colleague.name,
        detail: colleague.jobTitle,
        email: colleague.email,
      }}
      itemId={item.id}
      itemTitle={item.title}
      question={view.question}
    />
  );
}

function contactDetail(contact: Contact | null): string {
  if (!contact) return "Knowledge and content operations.";
  if (contact.kind === "team") {
    return `${contact.team.name}. No owner, the team picks it up.`;
  }
  const { colleague, note } = contact;
  return `${colleague.name}, ${colleague.jobTitle}${note ? ` (${note})` : ""}.`;
}

function Supports({ supports }: { supports: Support[] }) {
  if (supports.length === 0) return null;
  return (
    <InfoSection title="Confirmed in">
      <ul className="flex flex-col gap-1.5">
        {supports.map(({ record, reason }) => (
          <li key={record.id}>
            <span className="font-medium">{record.title}</span>
            <span className="text-muted-foreground">
              , {formatDate(record.createdAt.slice(0, 10))}. {reason}
            </span>
          </li>
        ))}
      </ul>
    </InfoSection>
  );
}

function SourceDetails({
  evaluation,
  view,
}: {
  evaluation: Evaluation;
  view: View;
}) {
  const { item, owner } = evaluation;
  const rows = [
    { label: "Owner", value: ownerLabel(owner) },
    {
      label: "Last checked",
      value: item.lastCheckedAt ? formatDate(item.lastCheckedAt) : "Never",
    },
    { label: "Scope", value: scopeLabel(item, view.customers) },
    {
      label: "Where",
      value: `${sourceSystemLabels[item.sourceSystem]}, ${item.location}`,
    },
  ];
  return (
    <>
      <InfoSection title="Why this source">
        <Reasons reasons={evaluation.reasons} />
      </InfoSection>
      <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
      <Supports supports={evaluation.supports} />
      <InfoSection title="Questions about it">
        <p>{contactDetail(evaluation.contact)}</p>
      </InfoSection>
    </>
  );
}

function AnswerCard({
  evaluation,
  view,
}: {
  evaluation: Evaluation;
  view: View;
}) {
  const { item, contact, owner } = evaluation;
  const contactIsOwner =
    contact?.kind === "colleague" && contact.colleague.id === owner?.id;
  const hasConcerns = evaluation.reasons.some(
    (reason) => reason.tone !== "good",
  );
  return (
    <section className="flex flex-col rounded-lg border">
      <div className="bg-accent flex flex-col gap-4 rounded-t-lg border-b p-6 sm:p-8">
        <p className="text-primary text-sm font-medium">Answer</p>
        <p className="text-xl leading-relaxed">{evaluation.passage.text}</p>
      </div>
      <div className="flex items-start justify-between gap-4 px-6 py-5 sm:px-8">
        <dl className="flex flex-col gap-x-10 gap-y-3 sm:flex-row">
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground text-sm">Source</dt>
            <dd>
              <DocumentLink
                item={item}
                passage={evaluation.passage}
                view={view}
              />
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground text-sm">
              {contactIsOwner ? "Owner" : "Contact"}
            </dt>
            <dd>
              <ContactLine contact={contact} item={item} view={view} />
            </dd>
          </div>
        </dl>
        <InfoButton
          label="Why this source"
          tone={hasConcerns ? "warning" : "default"}
        >
          <SourceDetails evaluation={evaluation} view={view} />
        </InfoButton>
      </div>
    </section>
  );
}

function BlockedCard({
  evaluation,
  view,
}: {
  evaluation: Evaluation;
  view: View;
}) {
  const { conflict } = evaluation;
  if (!conflict) return null;
  const reviewerName = contactName(conflict.reviewer);
  return (
    <section className="flex flex-col rounded-lg border">
      <div className="flex flex-col gap-3 border-b p-6 sm:p-8">
        <p className="text-destructive text-sm font-medium">
          No confident answer
        </p>
        <p className="text-xl leading-relaxed">
          Two sources disagree and nobody has decided yet. Do not guess: ask{" "}
          {reviewerName}.
        </p>
      </div>
      <div className="bg-border grid gap-px sm:grid-cols-2">
        {[
          {
            item: evaluation.item,
            detail: evaluation.item.lastCheckedAt
              ? `Document, checked ${formatDate(evaluation.item.lastCheckedAt)}.`
              : "Document, never checked.",
            passage: evaluation.passage,
            supports: evaluation.supports,
          },
          {
            item: conflict.other,
            detail: `${sourceSystemLabels[conflict.other.sourceSystem]}, ${formatDate(conflict.other.createdAt.slice(0, 10))}.`,
            passage: conflict.otherPassage,
            supports: conflict.otherSupports,
          },
        ].map((side) => (
          <div
            key={side.item.id}
            className="bg-background flex flex-col gap-4 p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <DocumentLink
                item={side.item}
                passage={side.passage}
                view={view}
              />
              <InfoButton label="About this source">
                <p>{side.detail}</p>
                <Supports supports={side.supports} />
              </InfoButton>
            </div>
            <blockquote className="border-l-2 pl-4 text-lg leading-relaxed">
              {side.passage.text}
            </blockquote>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 border-t p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          <span className="text-muted-foreground">Ask: </span>
          <ContactLine
            contact={conflict.reviewer}
            item={evaluation.item}
            view={view}
          />
        </p>
        {conflict.review ? (
          <Badge variant="secondary">
            In {reviewerName}&apos;s queue since{" "}
            {formatDate(conflict.review.createdAt.slice(0, 10))}
          </Badge>
        ) : (
          <SendToOwnerButton
            linkId={conflict.link.id}
            question={view.question}
          />
        )}
      </div>
    </section>
  );
}

function EvaluationList({
  evaluations,
  view,
}: {
  evaluations: Evaluation[];
  view: View;
}) {
  return (
    <ul className="divide-y rounded-lg border">
      {evaluations.map((evaluation) => {
        const concern = evaluation.reasons.find(
          (reason) => reason.tone !== "good",
        );
        return (
          <li
            key={evaluation.item.id}
            className="flex items-start justify-between gap-4 p-5"
          >
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <DocumentLink
                  item={evaluation.item}
                  passage={evaluation.passage}
                  view={view}
                />
                {evaluation.exclusion ? (
                  <Badge variant="destructive">{evaluation.exclusion}</Badge>
                ) : null}
              </div>
              {concern ? (
                <p className="text-muted-foreground">
                  {firstSentence(concern.text)}
                </p>
              ) : null}
            </div>
            <InfoButton label="Why it was set aside">
              <SourceDetails evaluation={evaluation} view={view} />
            </InfoButton>
          </li>
        );
      })}
    </ul>
  );
}

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = await searchParams;
  const question = typeof params.q === "string" ? params.q.trim() : "";
  const [customers, colleagues, colleague] = await Promise.all([
    getRepository().listCustomers(),
    getRepository().listColleagues(),
    getCurrentColleague(),
  ]);
  const customer =
    customers.find((entry) => entry.id === params.customer) ??
    customers.find((entry) => entry.id === DEFAULT_CUSTOMER_ID) ??
    customers[0];

  const result =
    question && customer ? await askQuestion(question, customer) : null;
  const view: View = {
    customers,
    colleagues: new Map(colleagues.map((person) => [person.id, person])),
    viewerId: colleague?.id ?? null,
    terms: result?.terms ?? [],
    question,
  };

  return (
    <>
      <PageHeader
        eyebrow="Live call"
        title="Ask"
        description="Pick the customer on the phone and type their question."
      />

      <div
        className={cn(
          "flex flex-col",
          result ? "gap-5" : "min-h-[55vh] justify-center gap-10 pb-10",
        )}
      >
        <form
          method="get"
          className={cn(
            "flex flex-col",
            result ? "gap-4 lg:flex-row lg:items-end" : "gap-8",
          )}
        >
          <div className="flex flex-col gap-2">
            <label
              htmlFor="customer"
              className={cn("font-medium", result ? "text-sm" : "text-lg")}
            >
              Customer on the phone
            </label>
            <NativeSelect
              id="customer"
              name="customer"
              defaultValue={customer?.id}
              className={cn(
                "w-full",
                result
                  ? "lg:w-72 [&_select]:h-11 [&_select]:text-base"
                  : "sm:w-[28rem] [&_select]:h-14 [&_select]:pl-4 [&_select]:text-lg",
              )}
            >
              {customers.map((entry) => (
                <NativeSelectOption key={entry.id} value={entry.id}>
                  {entry.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label
              htmlFor="q"
              className={cn("font-medium", result ? "text-sm" : "text-lg")}
            >
              Question
            </label>
            <div
              className={cn(
                "flex flex-col gap-3 sm:flex-row",
                result ? "" : "sm:gap-4",
              )}
            >
              <Input
                id="q"
                name="q"
                defaultValue={question}
                placeholder="Hoeveel dagen geboorteverlof krijgt een vader?"
                maxLength={500}
                required
                autoFocus={!result}
                className={
                  result
                    ? "h-11 text-base md:text-base"
                    : "h-16 px-5 text-xl md:text-xl"
                }
              />
              <Button
                type="submit"
                className={result ? "h-11 px-5 text-base" : "h-16 px-8 text-lg"}
              >
                Find answer
              </Button>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-3">
          <p
            className={cn(
              "text-muted-foreground",
              result ? "text-sm" : "text-base",
            )}
          >
            Try one of these
          </p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <Link
                key={example.question}
                href={{
                  pathname: "/ask",
                  query: { customer: example.customerId, q: example.question },
                }}
                className={cn(
                  "text-foreground hover:bg-muted hover:border-primary rounded-lg border transition-colors",
                  result ? "px-3 py-1.5 text-sm" : "px-4 py-3 text-base",
                )}
              >
                {example.question}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {result ? (
        <div className="mt-10 flex flex-col">
          {result.answer ? (
            <AnswerCard evaluation={result.answer} view={view} />
          ) : result.blocked ? (
            <BlockedCard evaluation={result.blocked} view={view} />
          ) : (
            <EmptyState
              title="No usable source"
              description="Nothing in the knowledge base applies to this customer and question. Ask the knowledge team."
            />
          )}

          {result.notUsed.length > 0 ? (
            <PageSection
              title="Found, but set aside"
              description="On topic, but not safe to use for this customer."
            >
              <EvaluationList evaluations={result.notUsed} view={view} />
            </PageSection>
          ) : null}

          {result.alsoFound.length > 0 ? (
            <PageSection
              title="Less related"
              description="Usable, but a weaker match than the answer."
            >
              <EvaluationList evaluations={result.alsoFound} view={view} />
            </PageSection>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
