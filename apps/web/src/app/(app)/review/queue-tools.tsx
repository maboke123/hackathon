"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { fieldErrors, idleFormState } from "@/lib/form-state";
import { checkAllDocuments, requestReview } from "./actions";

export type DocumentOption = {
  id: string;
  title: string;
  owner: string | null;
};

function RequestForm({
  documents,
  onDone,
}: {
  documents: DocumentOption[];
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(requestReview, idleFormState);
  const itemErrors = fieldErrors(state, "itemId");
  const noteErrors = fieldErrors(state, "note");

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <Field data-invalid={Boolean(itemErrors)}>
          <FieldLabel htmlFor="itemId">Document</FieldLabel>
          <NativeSelect
            id="itemId"
            name="itemId"
            defaultValue={state.values?.itemId ?? ""}
            aria-invalid={Boolean(itemErrors)}
            className="w-full"
          >
            <NativeSelectOption value="" disabled>
              Pick a document
            </NativeSelectOption>
            {documents.map((document) => (
              <NativeSelectOption
                key={document.id}
                value={document.id}
                disabled={!document.owner}
              >
                {document.title} ({document.owner ?? "no owner yet"})
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>
            Only documents with an owner can be reviewed.
          </FieldDescription>
          <FieldError errors={itemErrors} />
        </Field>
        <Field data-invalid={Boolean(noteErrors)}>
          <FieldLabel htmlFor="note">What should the owner check?</FieldLabel>
          <Textarea
            id="note"
            name="note"
            rows={3}
            maxLength={300}
            defaultValue={state.values?.note}
            placeholder="A customer says the meal voucher maximum went up in January."
            aria-invalid={Boolean(noteErrors)}
          />
          <FieldError errors={noteErrors} />
        </Field>
      </FieldGroup>
      <SubmitButton pendingLabel="Sending" className="self-start">
        Send to the owner
      </SubmitButton>
    </form>
  );
}

export function RequestReviewDialog({
  documents,
}: {
  documents: DocumentOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Request a review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a review</DialogTitle>
          <DialogDescription>
            The owner gets it at the top of their queue with a two day deadline.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <RequestForm documents={documents} onDone={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function PeriodicCheckButton() {
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await checkAllDocuments();
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button variant="outline" onClick={run} disabled={pending}>
      {pending ? "Checking" : "Run the check now"}
    </Button>
  );
}
