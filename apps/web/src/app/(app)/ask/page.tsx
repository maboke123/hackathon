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
  const { colleague, note } = contact;
  return (
    <span>
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
      <span className="text-muted-foreground">
        , {colleague.jobTitle}
        {note ? ` (${note})` : ""}
      </span>
    </span>
  );
}

function Supports({ supports, view }: { supports: Support[]; view: View }) {
  if (supports.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">Confirmed in</h3>
      <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
        {supports.map(({ record, reason }) => (
          <li key={record.id}>
            <DocumentLink item={record} passage={null} view={view} />,{" "}
            {formatDate(record.createdAt.slice(0, 10))}. {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SourceFacts({
  evaluation,
  view,
}: {
  evaluation: Evaluation;
  view: View;
}) {
  const { item, owner, passage } = evaluation;
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Source",
      value: <DocumentLink item={item} passage={passage} view={view} />,
    },
    {
      label: "Owner",
      value:
        owner?.status === "active" ? (
          <PersonMenu
            person={{
              name: owner.name,
              detail: owner.jobTitle,
              email: owner.email,
            }}
            itemId={item.id}
            itemTitle={item.title}
            question={view.question}
          />
        ) : (
          ownerLabel(owner)
        ),
    },
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
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function AnswerCard({
  evaluation,
  view,
}: {
  evaluation: Evaluation;
  view: View;
}) {
  return (
    <section className="flex flex-col rounded-lg border">
      <div className="bg-accent flex flex-col gap-3 rounded-t-lg border-b p-6">
        <p className="text-primary text-sm font-medium">Answer</p>
        <p className="text-lg leading-relaxed">{evaluation.passage.text}</p>
      </div>
      <div className="grid gap-8 p-6 lg:grid-cols-2">
        <SourceFacts evaluation={evaluation} view={view} />
        <div className="flex flex-col gap-6">
          <Reasons reasons={evaluation.reasons} />
          <Supports supports={evaluation.supports} view={view} />
          <p className="text-sm">
            <span className="text-muted-foreground">Questions about it: </span>
            <ContactLine
              contact={evaluation.contact}
              item={evaluation.item}
              view={view}
            />
          </p>
        </div>
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
      <div className="flex flex-col gap-2 border-b p-6">
        <p className="text-destructive text-sm font-medium">
          No confident answer
        </p>
        <p className="text-lg">
          Two sources disagree and nobody has decided yet. Do not guess: ask{" "}
          {reviewerName}.
        </p>
      </div>
      <div className="bg-border grid gap-px sm:grid-cols-2">
        {[
          {
            item: evaluation.item,
            owner: evaluation.owner,
            detail: evaluation.item.lastCheckedAt
              ? `Document, checked ${formatDate(evaluation.item.lastCheckedAt)}`
              : "Document, never checked",
            passage: evaluation.passage,
            supports: evaluation.supports,
          },
          {
            item: conflict.other,
            owner: null,
            detail: `${sourceSystemLabels[conflict.other.sourceSystem]}, ${formatDate(conflict.other.createdAt.slice(0, 10))}`,
            passage: conflict.otherPassage,
            supports: conflict.otherSupports,
          },
        ].map((side) => (
          <div
            key={side.item.id}
            className="bg-background flex flex-col gap-3 p-6"
          >
            <div className="flex flex-col gap-0.5">
              <DocumentLink
                item={side.item}
                passage={side.passage}
                view={view}
              />
              <p className="text-muted-foreground text-sm">{side.detail}</p>
            </div>
            <blockquote className="border-l-2 pl-4">
              {side.passage.text}
            </blockquote>
            <Supports supports={side.supports} view={view} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 border-t p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
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
      {evaluations.map((evaluation) => (
        <li
          key={evaluation.item.id}
          className="grid gap-3 p-4 sm:grid-cols-[16rem_1fr]"
        >
          <div className="flex flex-col items-start gap-1.5">
            <DocumentLink
              item={evaluation.item}
              passage={evaluation.passage}
              view={view}
            />
            {evaluation.exclusion ? (
              <Badge variant="destructive">{evaluation.exclusion}</Badge>
            ) : null}
          </div>
          <div className="flex flex-col gap-3">
            <Reasons
              reasons={evaluation.reasons.filter(
                (reason) => reason.tone !== "good",
              )}
            />
            {evaluation.contact ? (
              <p className="text-sm">
                <span className="text-muted-foreground">Contact: </span>
                <ContactLine
                  contact={evaluation.contact}
                  item={evaluation.item}
                  view={view}
                />
              </p>
            ) : null}
          </div>
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
              description="On topic, but replaced, a copy, or for another country or customer. Shown so you know why not to use them."
            >
              <EvaluationList evaluations={result.notUsed} view={view} />
            </PageSection>
          ) : null}

          {result.alsoFound.length > 0 ? (
            <PageSection
              title="Less related"
              description="Could be used, but a weaker match or less trusted than the answer."
            >
              <EvaluationList evaluations={result.alsoFound} view={view} />
            </PageSection>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
