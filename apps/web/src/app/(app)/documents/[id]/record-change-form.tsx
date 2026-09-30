"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fieldErrors, idleFormState } from "@/lib/form-state";
import { recordDocumentChange } from "./actions";

export function RecordChangeForm({
  itemId,
  downstream,
}: {
  itemId: string;
  downstream: number;
}) {
  const [state, action] = useActionState(recordDocumentChange, idleFormState);

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="itemId" value={itemId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="oldValue">Old value</FieldLabel>
          <Input
            id="oldValue"
            name="oldValue"
            placeholder="EUR 8,00"
            defaultValue={state.values?.oldValue}
            maxLength={200}
            required
          />
          <FieldError errors={fieldErrors(state, "oldValue")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="newValue">New value</FieldLabel>
          <Input
            id="newValue"
            name="newValue"
            placeholder="EUR 10,00"
            defaultValue={state.values?.newValue}
            maxLength={200}
            required
          />
          <FieldError errors={fieldErrors(state, "newValue")} />
        </Field>
      </div>
      <div>
        <SubmitButton pendingLabel="Sending">
          {downstream === 0
            ? "Record change"
            : `Record change and check ${downstream} ${downstream === 1 ? "document" : "documents"}`}
        </SubmitButton>
      </div>
    </form>
  );
}
