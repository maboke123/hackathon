"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { SubmitButton } from "@/components/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { idleFormState } from "@/lib/form-state";
import { notifyAffectedAction } from "./actions";

export type AnswerView = {
  id: string;
  customer: string;
  recipient: string;
  meta: string;
  consultant: string;
  reliedOn: string;
  told: string;
  oldValues: string[];
  draft: string;
  sentOn: string | null;
};

export type DependentView = {
  id: string;
  title: string;
  owner: string | null;
  meta: string;
  queued: boolean;
};

function Told({ text, values }: { text: string; values: string[] }) {
  const value = values.find((entry) => text.includes(entry));
  if (!value) return <>{text}</>;
  const at = text.indexOf(value);
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-destructive/15 text-foreground rounded-sm px-0.5">
        {value}
      </mark>
      {text.slice(at + value.length)}
    </>
  );
}

function SelectionBar({
  selected,
  total,
  onAll,
  onNone,
}: {
  selected: number;
  total: number;
  onAll: () => void;
  onNone: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground tabular-nums">
        {selected} of {total} selected
      </span>
      <Button type="button" variant="outline" size="sm" onClick={onAll}>
        All
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onNone}>
        None
      </Button>
    </div>
  );
}

function toggle(set: Set<string>, id: string, on: boolean) {
  const next = new Set(set);
  if (on) next.add(id);
  else next.delete(id);
  return next;
}

export function NotifyForm({
  itemId,
  answers,
  dependents,
}: {
  itemId: string;
  answers: AnswerView[];
  dependents: DependentView[];
}) {
  const [state, action] = useActionState(notifyAffectedAction, idleFormState);
  const openAnswers = answers.filter((answer) => !answer.sentOn);
  const openDependents = dependents.filter(
    (dependent) => !dependent.queued && dependent.owner,
  );
  const [answerIds, setAnswerIds] = useState(
    () => new Set(openAnswers.map((answer) => answer.id)),
  );
  const [dependentIds, setDependentIds] = useState(
    () => new Set(openDependents.map((dependent) => dependent.id)),
  );

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  const selectedAnswers = openAnswers.filter((answer) =>
    answerIds.has(answer.id),
  );
  const selectedDependents = openDependents.filter((dependent) =>
    dependentIds.has(dependent.id),
  );
  const nothingOpen = openAnswers.length + openDependents.length === 0;

  return (
    <form action={action} className="flex flex-col">
      <input type="hidden" name="itemId" value={itemId} />

      <section className="flex flex-col gap-6 border-t py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl">Customers who got an answer from it</h2>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Each correction is drafted from your document and goes out in the
              name of the colleague who answered. Read it before you send.
            </p>
          </div>
          {openAnswers.length > 1 ? (
            <SelectionBar
              selected={selectedAnswers.length}
              total={openAnswers.length}
              onAll={() =>
                setAnswerIds(new Set(openAnswers.map((answer) => answer.id)))
              }
              onNone={() => setAnswerIds(new Set())}
            />
          ) : null}
        </div>
        {answers.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {answers.map((answer) => {
              const checked = answerIds.has(answer.id) && !answer.sentOn;
              return (
                <li key={answer.id} className="flex flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    {answer.sentOn ? null : (
                      <Checkbox
                        id={`answer-${answer.id}`}
                        name="answer"
                        value={answer.id}
                        checked={checked}
                        onCheckedChange={(value) =>
                          setAnswerIds((current) =>
                            toggle(current, answer.id, value === true),
                          )
                        }
                        className="mt-1"
                      />
                    )}
                    <label
                      htmlFor={`answer-${answer.id}`}
                      className="flex flex-1 cursor-pointer flex-col gap-1"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {answer.recipient}, {answer.customer}
                        </span>
                        {answer.sentOn ? (
                          <Badge variant="secondary">
                            Correction sent {answer.sentOn}
                          </Badge>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {answer.meta}. Answered by {answer.consultant} with{" "}
                        {answer.reliedOn}.
                      </span>
                    </label>
                  </div>
                  <blockquote className="border-l-destructive ml-7 border-l-2 pl-4 text-sm leading-6">
                    <span className="text-muted-foreground">
                      They were told:{" "}
                    </span>
                    <Told text={answer.told} values={answer.oldValues} />
                  </blockquote>
                  {checked ? (
                    <div className="ml-7 flex flex-col gap-2">
                      <label
                        htmlFor={`message-${answer.id}`}
                        className="text-sm font-medium"
                      >
                        Correction to {answer.recipient}
                      </label>
                      <Textarea
                        id={`message-${answer.id}`}
                        name={`message-${answer.id}`}
                        defaultValue={answer.draft}
                        rows={10}
                        className="text-sm leading-6"
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="No customer relied on the old documents"
            description="No ticket, email or call is linked to an answer from them. Nobody needs a correction."
          />
        )}
      </section>

      <section className="flex flex-col gap-6 border-t py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl">Documents based on it</h2>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Their owners get a check in their review queue with the old value
              marked. Nothing changes in their document until they decide.
            </p>
          </div>
          {openDependents.length > 1 ? (
            <SelectionBar
              selected={selectedDependents.length}
              total={openDependents.length}
              onAll={() =>
                setDependentIds(
                  new Set(openDependents.map((dependent) => dependent.id)),
                )
              }
              onNone={() => setDependentIds(new Set())}
            />
          ) : null}
        </div>
        {dependents.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {dependents.map((dependent) => {
              const open = !dependent.queued && dependent.owner !== null;
              return (
                <li key={dependent.id} className="flex items-start gap-3 p-5">
                  {open ? (
                    <Checkbox
                      id={`dependent-${dependent.id}`}
                      name="dependent"
                      value={dependent.id}
                      checked={dependentIds.has(dependent.id)}
                      onCheckedChange={(value) =>
                        setDependentIds((current) =>
                          toggle(current, dependent.id, value === true),
                        )
                      }
                      className="mt-1"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/documents/${dependent.id}`}
                        className="text-primary font-medium underline-offset-4 hover:underline"
                      >
                        {dependent.title}
                      </Link>
                      {dependent.queued ? (
                        <Badge variant="secondary">
                          In the owner&apos;s queue
                        </Badge>
                      ) : null}
                      {dependent.owner === null ? (
                        <Badge variant="outline">No owner</Badge>
                      ) : null}
                    </span>
                    <label
                      htmlFor={`dependent-${dependent.id}`}
                      className="text-muted-foreground text-sm"
                    >
                      {dependent.meta}
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="No document is based on the old ones"
            description="Nothing else follows their rules, so no other owner needs to check."
          />
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t pt-8">
        {nothingOpen ? (
          <Button asChild>
            <Link href={`/documents/${itemId}`}>Go to the document</Link>
          </Button>
        ) : (
          <>
            <SubmitButton
              pendingLabel="Sending"
              disabled={
                selectedAnswers.length + selectedDependents.length === 0
              }
            >
              {sendLabel(selectedAnswers.length, selectedDependents.length)}
            </SubmitButton>
            <Button asChild variant="ghost">
              <Link href={`/documents/${itemId}`}>Skip, tell nobody</Link>
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

function sendLabel(customers: number, owners: number): string {
  const parts = [
    customers > 0
      ? `send ${customers} ${customers === 1 ? "correction" : "corrections"}`
      : null,
    owners > 0
      ? `ask ${owners} ${owners === 1 ? "owner" : "owners"} to check`
      : null,
  ].filter(Boolean);
  if (parts.length === 0) return "Nothing selected";
  const text = parts.join(" and ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
