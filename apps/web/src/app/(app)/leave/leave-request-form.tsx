"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { fieldErrors, idleFormState } from "@/lib/form-state";
import { requestLeave } from "./actions";

type LeaveRequestFormProps = {
  leaveTypes: { value: string; label: string }[];
  minDate: string;
};

export function LeaveRequestForm({
  leaveTypes,
  minDate,
}: LeaveRequestFormProps) {
  const [state, formAction] = useActionState(requestLeave, idleFormState);
  const typeErrors = fieldErrors(state, "type");
  const startErrors = fieldErrors(state, "startDate");
  const endErrors = fieldErrors(state, "endDate");
  const noteErrors = fieldErrors(state, "note");

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
    }
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      noValidate
      className="flex max-w-lg flex-col gap-6"
    >
      <FieldGroup>
        <Field data-invalid={Boolean(typeErrors)}>
          <FieldLabel htmlFor="type">Type</FieldLabel>
          <NativeSelect
            id="type"
            name="type"
            className="w-full"
            defaultValue={state.values?.type ?? leaveTypes[0]?.value}
            aria-invalid={Boolean(typeErrors)}
          >
            {leaveTypes.map((type) => (
              <NativeSelectOption key={type.value} value={type.value}>
                {type.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError errors={typeErrors} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={Boolean(startErrors)}>
            <FieldLabel htmlFor="startDate">From</FieldLabel>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              min={minDate}
              defaultValue={state.values?.startDate}
              aria-invalid={Boolean(startErrors)}
            />
            <FieldError errors={startErrors} />
          </Field>
          <Field data-invalid={Boolean(endErrors)}>
            <FieldLabel htmlFor="endDate">To</FieldLabel>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              min={minDate}
              defaultValue={state.values?.endDate}
              aria-invalid={Boolean(endErrors)}
            />
            <FieldError errors={endErrors} />
          </Field>
        </div>
        <Field data-invalid={Boolean(noteErrors)}>
          <FieldLabel htmlFor="note">Note for your manager</FieldLabel>
          <Textarea
            id="note"
            name="note"
            rows={2}
            maxLength={200}
            placeholder="Optional"
            defaultValue={state.values?.note}
            aria-invalid={Boolean(noteErrors)}
          />
          <FieldError errors={noteErrors} />
        </Field>
      </FieldGroup>
      <SubmitButton pendingLabel="Sending" className="self-start">
        Send request
      </SubmitButton>
    </form>
  );
}
