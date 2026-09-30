"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { DiffSentence } from "@/components/diff-sentence";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { idleFormState } from "@/lib/form-state";
import { conflictLabels, type Relation, relationLabels } from "@/lib/relations";
import { cn } from "@/lib/utils";
import type { DiffPart } from "@/lib/word-diff";
import { discardDraft, publishDocument } from "./actions";

export type RelatedView = {
  id: string;
  title: string;
  meta: string;
  ownerName: string | null;
  reason: string;
  suggestion: Relation;
  allowed: Relation[];
  conflict: {
    mine: string;
    theirs: string;
    myValue: string;
    theirValue: string;
    diff: DiffPart[] | null;
  } | null;
};

function Marked({
  text,
  value,
  tone,
}: {
  text: string;
  value: string;
  tone: "before" | "after";
}) {
  const at = text.indexOf(value);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark
        className={cn(
          "text-foreground rounded-sm px-0.5",
          tone === "before" ? "bg-destructive/15" : "bg-success/20",
        )}
      >
        {value}
      </mark>
      {text.slice(at + value.length)}
    </>
  );
}

function ConflictCard({ related }: { related: RelatedView }) {
  const conflict = related.conflict;
  if (!conflict) return null;
  const owner = related.ownerName ?? "the owner";

  return (
    <li className="flex flex-col gap-5 rounded-lg border p-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="destructive">Conflict</Badge>
          <Link
            href={`/documents/${related.id}`}
            target="_blank"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            {related.title}
          </Link>
        </div>
        <p className="text-muted-foreground text-sm">{related.meta}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="border-l-success flex flex-col gap-2 rounded-lg border border-l-4 p-4">
          <p className="text-sm font-medium">Your document says</p>
          <p className="leading-7">
            {conflict.diff ? (
              <DiffSentence
                parts={conflict.diff}
                fallback={conflict.mine}
                side="after"
              />
            ) : (
              <Marked
                text={conflict.mine}
                value={conflict.myValue}
                tone="after"
              />
            )}
          </p>
        </div>
        <div className="border-l-destructive flex flex-col gap-2 rounded-lg border border-l-4 p-4">
          <p className="text-sm font-medium">{related.title} says</p>
          <p className="leading-7">
            {conflict.diff ? (
              <DiffSentence
                parts={conflict.diff}
                fallback={conflict.theirs}
                side="before"
              />
            ) : (
              <Marked
                text={conflict.theirs}
                value={conflict.theirValue}
                tone="before"
              />
            )}
          </p>
        </div>
      </div>

      <RadioGroup
        name={`relation-${related.id}`}
        defaultValue={related.suggestion}
        className="gap-3"
      >
        {related.allowed.map((relation) => (
          <label
            key={relation}
            className="hover:bg-muted/50 has-data-checked:border-primary flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
          >
            <RadioGroupItem value={relation} className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {relation === "contradicts"
                  ? `Not sure, ask ${owner}`
                  : conflictLabels[relation]}
                {relation === related.suggestion ? (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    (suggested)
                  </span>
                ) : null}
              </span>
              <span className="text-muted-foreground text-sm">
                {relationLabels[relation].hint}
              </span>
            </span>
          </label>
        ))}
      </RadioGroup>
      {!related.allowed.includes("contradicts") ? (
        <p className="text-muted-foreground text-sm">
          Nobody owns this document, so there is nobody to ask. Decide yourself
          or name an owner first.
        </p>
      ) : null}
    </li>
  );
}

function RelatedRow({ related }: { related: RelatedView }) {
  const [choice, setChoice] = useState<Relation>(related.suggestion);

  return (
    <li className="grid gap-3 p-4 md:grid-cols-[1fr_15rem] md:items-start">
      <div className="flex flex-col gap-1">
        <Link
          href={`/documents/${related.id}`}
          target="_blank"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          {related.title}
        </Link>
        <span className="text-muted-foreground text-sm">{related.meta}</span>
        <span className="text-sm">{related.reason}</span>
      </div>
      <div className="flex flex-col gap-1">
        <NativeSelect
          name={`relation-${related.id}`}
          value={choice}
          onChange={(event) => setChoice(event.target.value as Relation)}
          className="w-full"
          aria-label={`How ${related.title} relates to your document`}
        >
          {related.allowed.map((relation) => (
            <NativeSelectOption key={relation} value={relation}>
              {relationLabels[relation].label}
              {relation === related.suggestion ? " (suggested)" : ""}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <span className="text-muted-foreground text-xs">
          {relationLabels[choice].hint}
        </span>
      </div>
    </li>
  );
}

export function PublishForm({
  itemId,
  related,
}: {
  itemId: string;
  related: RelatedView[];
}) {
  const [state, action] = useActionState(publishDocument, idleFormState);
  const conflicts = related.filter((entry) => entry.conflict);
  const others = related.filter((entry) => !entry.conflict);

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={action} className="flex flex-col">
      <input type="hidden" name="itemId" value={itemId} />

      <section className="flex flex-col gap-6 border-t py-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl">Conflicts</h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            {conflicts.length > 0
              ? `${conflicts.length} ${conflicts.length === 1 ? "document states" : "documents state"} a different value than yours. Decide each one before you publish.`
              : "No document on this topic states a different value."}
          </p>
        </div>
        {conflicts.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {conflicts.map((entry) => (
              <ConflictCard key={entry.id} related={entry} />
            ))}
          </ul>
        ) : null}
      </section>

      <section className="flex flex-col gap-6 border-t py-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl">Related documents</h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Say how your document relates to what is already there. A link
            decides which document answers a question, so only confirm what you
            know.
          </p>
        </div>
        {others.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {others.map((entry) => (
              <RelatedRow key={entry.id} related={entry} />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nothing related found"
            description="No other document shares the topic or the key terms. Your document starts on its own."
          />
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t pt-8">
        <SubmitButton pendingLabel="Publishing">Publish document</SubmitButton>
        <Button
          type="submit"
          variant="ghost"
          formAction={discardDraft}
          formNoValidate
        >
          Discard draft
        </Button>
      </div>
    </form>
  );
}
