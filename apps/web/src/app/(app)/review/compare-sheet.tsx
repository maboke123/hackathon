"use client";

import { ArrowRightIcon, GitCompareArrowsIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { countryLabels } from "@/lib/data/labels";
import type { SheetDocument } from "@/lib/document-view";
import { cn } from "@/lib/utils";
import type { DiffPart } from "@/lib/word-diff";
import { DocumentPanel } from "../document-sheet";
import {
  PickUpButton,
  type ScopeValue,
  type TaskOutcome,
  useDecide,
} from "./task-actions";

type ScopeSide = ScopeValue & { title: string };

export type Comparison = {
  reviewId: string;
  kindLabel: string;
  reason: string;
  otherLabel: string;
  mine: SheetDocument;
  other: SheetDocument;
  /** Word diff from the document's sentence to the other source's sentence. */
  diff: DiffPart[] | null;
  mineSentence: string | null;
  otherSentence: string | null;
  update: {
    before: string | null;
    after: string;
    diff: DiffPart[] | null;
  } | null;
  outcomes: TaskOutcome[];
  points: number;
  /** Current country and customer of both sides, for "both are right". */
  scopes: ScopeSide[];
  customers: { id: string; name: string }[];
};

function ScopeFields({
  scopes,
  customers,
  onChange,
}: {
  scopes: ScopeSide[];
  customers: { id: string; name: string }[];
  onChange: (scopes: ScopeSide[]) => void;
}) {
  const update = (index: number, change: Partial<ScopeValue>) =>
    onChange(
      scopes.map((scope, position) =>
        position === index ? { ...scope, ...change } : scope,
      ),
    );

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <p className="text-sm font-medium">What does each source apply to?</p>
      {scopes.map((scope, index) => (
        <div
          key={scope.itemId}
          className="grid items-center gap-2 sm:grid-cols-[1fr_12rem_12rem]"
        >
          <span className="truncate text-sm">{scope.title}</span>
          <NativeSelect
            aria-label={`Country for ${scope.title}`}
            value={scope.country ?? ""}
            onChange={(event) =>
              update(index, { country: event.target.value || null })
            }
            className="w-full"
          >
            <NativeSelectOption value="">All countries</NativeSelectOption>
            {Object.entries(countryLabels).map(([code, name]) => (
              <NativeSelectOption key={code} value={code}>
                {name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label={`Customer for ${scope.title}`}
            value={scope.customerId ?? ""}
            onChange={(event) =>
              update(index, { customerId: event.target.value || null })
            }
            className="w-full"
          >
            <NativeSelectOption value="">All customers</NativeSelectOption>
            {customers.map((customer) => (
              <NativeSelectOption key={customer.id} value={customer.id}>
                {customer.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      ))}
    </div>
  );
}

function Sentence({
  parts,
  fallback,
  side,
}: {
  parts: DiffPart[] | null;
  fallback: string | null;
  side: "before" | "after";
}) {
  if (!parts) {
    return (
      <>{fallback ?? "No single sentence found. Read the full source below."}</>
    );
  }
  const changed = side === "before" ? "removed" : "added";
  return (
    <>
      {parts
        .filter((part) => part.change === "same" || part.change === changed)
        .map((part, index) =>
          part.change === "same" ? (
            <span key={index}>
              {side === "before" ? part.before : part.text}
            </span>
          ) : (
            <mark
              key={index}
              className={cn(
                "text-foreground rounded-sm px-0.5",
                side === "before" ? "bg-destructive/15" : "bg-success/20",
              )}
            >
              {part.text}
            </mark>
          ),
        )}
    </>
  );
}

function Claim({
  label,
  title,
  tone,
  children,
}: {
  label: string;
  title: string;
  tone: "before" | "after";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-l-4 p-5",
        tone === "before" ? "border-l-destructive" : "border-l-success",
      )}
    >
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{title}</p>
      </div>
      <p className="text-base leading-7">{children}</p>
    </div>
  );
}

function UpdatePreview({
  update,
}: {
  update: NonNullable<Comparison["update"]>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.08em]">
        Preview of the change
      </p>
      <div className="overflow-hidden rounded-lg border text-sm leading-6">
        {update.before ? (
          <div className="bg-destructive/5 grid grid-cols-[5.5rem_1fr] gap-3 border-b px-4 py-3">
            <span className="text-destructive text-xs font-medium">
              Taken out
            </span>
            <span className="text-muted-foreground decoration-destructive/50 line-through">
              {update.before}
            </span>
          </div>
        ) : null}
        <div className="bg-success/5 grid grid-cols-[5.5rem_1fr] gap-3 px-4 py-3">
          <span className="text-success text-xs font-medium">
            {update.before ? "Put in" : "Added at the end"}
          </span>
          <span>
            <Sentence
              parts={update.diff}
              fallback={update.after}
              side="after"
            />
          </span>
        </div>
      </div>
    </div>
  );
}

export function CompareSheet({
  comparison,
  canDecide,
  colleagueId,
}: {
  comparison: Comparison;
  canDecide: boolean;
  colleagueId: string;
}) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(comparison.outcomes[0]?.id ?? "");
  const { decide, pending } = useDecide(comparison.reviewId, () =>
    setOpen(false),
  );
  const [scopes, setScopes] = useState(comparison.scopes);
  const selected = comparison.outcomes.find((outcome) => outcome.id === choice);
  const splitting = choice === "different_scope";
  const [first, second] = scopes;
  const sameScope =
    !!first &&
    !!second &&
    first.country === second.country &&
    first.customerId === second.customerId;
  const { mine, other } = comparison;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={canDecide ? "default" : "outline"}>
          <GitCompareArrowsIcon strokeWidth={1.5} data-icon="inline-start" />
          {canDecide ? "Compare and decide" : "Compare sources"}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-4xl data-[side=right]:xl:max-w-6xl">
        <SheetHeader className="gap-2 border-b px-6 py-5 pr-12">
          <p className="text-primary text-xs font-medium uppercase tracking-[0.08em]">
            {comparison.kindLabel}
          </p>
          <SheetTitle className="text-xl leading-snug">{mine.title}</SheetTitle>
          <SheetDescription className="max-w-3xl text-base">
            {comparison.reason}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className="flex flex-col gap-4 px-6 py-6">
            <h3 className="text-base">What is different</h3>
            <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
              <Claim
                label="Your document says"
                title={mine.title}
                tone="before"
              >
                <Sentence
                  parts={comparison.diff}
                  fallback={comparison.mineSentence}
                  side="before"
                />
              </Claim>
              <ArrowRightIcon
                strokeWidth={1.5}
                className="text-muted-foreground hidden size-5 self-center md:block"
              />
              <Claim
                label={comparison.otherLabel}
                title={other.title}
                tone="after"
              >
                <Sentence
                  parts={comparison.diff}
                  fallback={comparison.otherSentence}
                  side="after"
                />
              </Claim>
            </div>
            {comparison.diff ? (
              <p className="text-muted-foreground text-xs">
                Words that differ are marked. Red is only in your document,
                green only in the other source.
              </p>
            ) : null}
          </section>

          <section className="flex flex-col gap-4 border-t px-6 py-6">
            <h3 className="text-base">What should happen?</h3>
            {canDecide ? (
              <>
                <RadioGroup
                  value={choice}
                  onValueChange={setChoice}
                  className="gap-0 overflow-hidden rounded-lg border"
                  aria-label="Decision"
                >
                  {comparison.outcomes.map((outcome) => (
                    <label
                      key={outcome.id}
                      htmlFor={`${comparison.reviewId}-${outcome.id}`}
                      className={cn(
                        "flex cursor-pointer gap-3 border-b px-4 py-3 transition-colors duration-150 last:border-b-0",
                        choice === outcome.id ? "bg-accent" : "hover:bg-muted",
                      )}
                    >
                      <RadioGroupItem
                        id={`${comparison.reviewId}-${outcome.id}`}
                        value={outcome.id}
                        className="mt-0.5"
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="font-medium">{outcome.label}</span>
                        <span className="text-muted-foreground text-sm">
                          {outcome.hint}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                {splitting ? (
                  <ScopeFields
                    scopes={scopes}
                    customers={comparison.customers}
                    onChange={setScopes}
                  />
                ) : null}
                {choice === "add_to_document" && comparison.update ? (
                  <UpdatePreview update={comparison.update} />
                ) : null}
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    size="lg"
                    disabled={pending || !selected || (splitting && sameScope)}
                    onClick={() =>
                      decide(
                        choice,
                        splitting
                          ? scopes.map(({ itemId, country, customerId }) => ({
                              itemId,
                              country,
                              customerId,
                            }))
                          : undefined,
                      )
                    }
                  >
                    {pending ? "Saving" : (selected?.label ?? "Pick an option")}
                  </Button>
                  <span className="text-primary font-heading font-semibold">
                    +{comparison.points} karma
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4 text-sm">
                <span className="text-muted-foreground">
                  Nobody owns this task yet. Pick it up to decide.
                </span>
                <PickUpButton
                  reviewId={comparison.reviewId}
                  colleagueId={colleagueId}
                />
              </div>
            )}
          </section>

          <section className="flex flex-col border-t">
            <h3 className="px-6 pt-6 text-base">Full sources</h3>
            <div className="grid xl:grid-cols-2 xl:divide-x">
              <DocumentPanel
                document={mine}
                className="xl:h-[75vh]"
                scrollToPassage={false}
              />
              <DocumentPanel
                document={other}
                className="border-t xl:h-[75vh] xl:border-t-0"
                scrollToPassage={false}
              />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
