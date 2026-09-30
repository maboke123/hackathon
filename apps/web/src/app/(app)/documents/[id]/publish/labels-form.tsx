"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { fieldErrors, idleFormState } from "@/lib/form-state";
import { saveLabels } from "./actions";

type Option = { value: string; label: string };

export type LabelField = {
  name: string;
  label: string;
  value: string;
  options: Option[] | null;
  /** Why this value was suggested, or that nothing could be found. */
  hint: string;
};

export function LabelsForm({
  itemId,
  fields,
}: {
  itemId: string;
  fields: LabelField[];
}) {
  const [state, action] = useActionState(saveLabels, idleFormState);

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="itemId" value={itemId} />
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <Field
            key={field.name}
            className={
              field.name === "title" ? "sm:col-span-2 lg:col-span-3" : undefined
            }
          >
            <FieldLabel htmlFor={field.name}>{field.label}</FieldLabel>
            {field.options ? (
              <NativeSelect
                id={field.name}
                name={field.name}
                defaultValue={state.values?.[field.name] ?? field.value}
                className="w-full"
              >
                {field.options.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            ) : (
              <Input
                id={field.name}
                name={field.name}
                defaultValue={state.values?.[field.name] ?? field.value}
                maxLength={200}
              />
            )}
            <FieldDescription>{field.hint}</FieldDescription>
            <FieldError errors={fieldErrors(state, field.name)} />
          </Field>
        ))}
      </div>
      <div>
        <SubmitButton variant="outline" pendingLabel="Saving">
          Save labels
        </SubmitButton>
      </div>
    </form>
  );
}
