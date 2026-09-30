import { CheckIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, PageSection } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { requireUser } from "@/lib/auth/session";
import { type Customer, getRepository, sourceSystemLabels } from "@/lib/data";
import { formatDate } from "@/lib/format";
import {
  askQuestion,
  type Contact,
  contactName,
  type Evaluation,
  type Reason,
  type Support,
} from "@/lib/trust";
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

const toneIcons = {
  good: <CheckIcon strokeWidth={1.5} className="text-success size-4" />,
  warning: (
    <TriangleAlertIcon
      strokeWidth={1.5}
      className="text-warning-foreground size-4"
    />
  ),
  blocked: <XIcon strokeWidth={1.5} className="text-destructive size-4" />,
};

function Reasons({ reasons }: { reasons: Reason[] }) {
  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {reasons.map((reason) => (
        <li key={reason.text} className="flex gap-2">
          <span className="mt-0.5 shrink-0">{toneIcons[reason.tone]}</span>
          <span>{reason.text}</span>
        </li>
      ))}
    </ul>
  );
}

function ContactLine({ contact }: { contact: Contact | null }) {
  if (!contact) {
    return <span>Knowledge and content operations</span>;
  }
  if (contact.kind === "team") {
    return <span>{contact.team.name} (no owner, the team picks it up)</span>;
  }
  const { colleague, note } = contact;
  return (
    <span>
      {colleague.name}, {colleague.jobTitle}.{" "}
      <a
        href={`mailto:${colleague.email}`}
        className="text-primary underline-offset-4 hover:underline"
      >
        {colleague.email}
      </a>
      {note ? <span className="text-muted-foreground"> ({note})</span> : null}
    </span>
  );
}

function Supports({ supports }: { supports: Support[] }) {
  if (supports.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">Confirmed in</h3>
      <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
        {supports.map(({ record, reason }) => (
          <li key={record.id}>
            <span className="text-foreground">{record.title}</span>,{" "}
            {formatDate(record.createdAt.slice(0, 10))}. {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

function scopeLabels(evaluation: Evaluation, customers: Customer[]) {
  const { item } = evaluation;
  const customer = customers.find((entry) => entry.id === item.customerId);
  return [
    item.country ?? "All countries",
    customer?.name ?? "All customers",
    item.jointCommittee ? `PC ${item.jointCommittee}` : null,
  ].filter((label): label is string => label !== null);
}

function SourceFacts({
  evaluation,
  customers,
}: {
  evaluation: Evaluation;
  customers: Customer[];
}) {
  const { item, owner } = evaluation;
  const facts = [
    { label: "Source", value: item.title },
    {
      label: "Owner",
      value: owner
        ? `${owner.name}${owner.status === "active" ? "" : " (left)"}`
        : "None",
    },
    {
      label: "Last checked",
      value: item.lastCheckedAt ? formatDate(item.lastCheckedAt) : "Never",
    },
    { label: "Scope", value: scopeLabels(evaluation, customers).join(", ") },
    {
      label: "Where",
      value: `${sourceSystemLabels[item.sourceSystem]}, ${item.location}`,
    },
  ];
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
      {facts.map((fact) => (
        <div key={fact.label} className="contents">
          <dt className="text-muted-foreground">{fact.label}</dt>
          <dd className="break-words">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function AnswerCard({
  evaluation,
  customers,
}: {
  evaluation: Evaluation;
  customers: Customer[];
}) {
  return (
    <section className="flex flex-col rounded-lg border">
      <div className="bg-accent flex flex-col gap-3 rounded-t-lg border-b p-6">
        <p className="text-primary text-sm font-medium">Answer</p>
        <p className="text-lg leading-relaxed">{evaluation.passage}</p>
      </div>
      <div className="grid gap-8 p-6 lg:grid-cols-2">
        <SourceFacts evaluation={evaluation} customers={customers} />
        <div className="flex flex-col gap-6">
          <Reasons reasons={evaluation.reasons} />
          <Supports supports={evaluation.supports} />
          <p className="text-sm">
            <span className="text-muted-foreground">Questions about it: </span>
            <ContactLine contact={evaluation.contact} />
          </p>
        </div>
      </div>
    </section>
  );
}

function BlockedCard({
  evaluation,
  question,
}: {
  evaluation: Evaluation;
  question: string;
}) {
  const { conflict } = evaluation;
  if (!conflict) return null;
  return (
    <section className="flex flex-col rounded-lg border">
      <div className="flex flex-col gap-2 border-b p-6">
        <p className="text-destructive text-sm font-medium">
          No confident answer
        </p>
        <p className="text-lg">
          Two sources disagree and nobody has decided yet. Do not guess: ask{" "}
          {contactName(conflict.reviewer)}.
        </p>
      </div>
      <div className="bg-border grid gap-px sm:grid-cols-2">
        {[
          {
            title: evaluation.item.title,
            detail: evaluation.item.lastCheckedAt
              ? `Document, checked ${formatDate(evaluation.item.lastCheckedAt)}`
              : "Document, never checked",
            passage: evaluation.passage,
            supports: evaluation.supports,
          },
          {
            title: conflict.other.title,
            detail: `${sourceSystemLabels[conflict.other.sourceSystem]}, ${formatDate(conflict.other.createdAt.slice(0, 10))}`,
            passage: conflict.otherPassage,
            supports: conflict.otherSupports,
          },
        ].map((side) => (
          <div
            key={side.title}
            className="bg-background flex flex-col gap-3 p-6"
          >
            <div className="flex flex-col gap-0.5">
              <h3 className="font-medium">{side.title}</h3>
              <p className="text-muted-foreground text-sm">{side.detail}</p>
            </div>
            <blockquote className="border-l-2 pl-4">{side.passage}</blockquote>
            <Supports supports={side.supports} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 border-t p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="text-muted-foreground">Ask: </span>
          <ContactLine contact={conflict.reviewer} />
        </p>
        {conflict.review ? (
          <Badge variant="secondary">
            In {contactName(conflict.reviewer)}&apos;s queue since{" "}
            {formatDate(conflict.review.createdAt.slice(0, 10))}
          </Badge>
        ) : (
          <SendToOwnerButton linkId={conflict.link.id} question={question} />
        )}
      </div>
    </section>
  );
}

function EvaluationList({ evaluations }: { evaluations: Evaluation[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {evaluations.map((evaluation) => (
        <li
          key={evaluation.item.id}
          className="grid gap-3 p-4 sm:grid-cols-[16rem_1fr]"
        >
          <div className="flex flex-col items-start gap-1.5">
            <span className="font-medium">{evaluation.item.title}</span>
            {evaluation.exclusion ? (
              <Badge variant="destructive">{evaluation.exclusion}</Badge>
            ) : null}
          </div>
          <Reasons
            reasons={evaluation.reasons.filter(
              (reason) => reason.tone !== "good",
            )}
          />
        </li>
      ))}
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
  const customers = await getRepository().listCustomers();
  const customer =
    customers.find((entry) => entry.id === params.customer) ??
    customers.find((entry) => entry.id === DEFAULT_CUSTOMER_ID) ??
    customers[0];

  const result =
    question && customer ? await askQuestion(question, customer) : null;

  return (
    <>
      <PageHeader
        eyebrow="Live call"
        title="Ask"
        description="Pick the customer on the phone and type their question. Rules pick the source, and every source that is not used gets a reason."
      />

      <form
        method="get"
        className="flex flex-col gap-4 lg:flex-row lg:items-end"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="customer" className="text-sm font-medium">
            Customer on the phone
          </label>
          <NativeSelect
            id="customer"
            name="customer"
            defaultValue={customer?.id}
            className="w-full lg:w-64"
          >
            {customers.map((entry) => (
              <NativeSelectOption key={entry.id} value={entry.id}>
                {entry.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor="q" className="text-sm font-medium">
            Question
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={question}
            placeholder="Hoeveel dagen geboorteverlof krijgt een vader?"
            maxLength={500}
            required
          />
        </div>
        <Button type="submit">Find answer</Button>
      </form>

      <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span>Try:</span>
        {examples.map((example) => (
          <Link
            key={example.question}
            href={{
              pathname: "/ask",
              query: { customer: example.customerId, q: example.question },
            }}
            className="text-primary underline-offset-4 hover:underline"
          >
            {example.question}
          </Link>
        ))}
      </div>

      {result ? (
        <div className="mt-10 flex flex-col">
          {result.answer ? (
            <AnswerCard evaluation={result.answer} customers={customers} />
          ) : result.blocked ? (
            <BlockedCard evaluation={result.blocked} question={question} />
          ) : (
            <EmptyState
              title="No usable source"
              description="Nothing in the knowledge base applies to this customer and question. Ask the knowledge team."
            />
          )}

          {result.notUsed.length > 0 ? (
            <PageSection
              title="Not used"
              description="Found by the search, but the graph says not to use them."
            >
              <EvaluationList evaluations={result.notUsed} />
            </PageSection>
          ) : null}

          {result.alsoFound.length > 0 ? (
            <PageSection
              title="Also found"
              description="Usable, but less relevant or less trusted than the answer."
            >
              <EvaluationList evaluations={result.alsoFound} />
            </PageSection>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
