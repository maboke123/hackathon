import { z } from "zod";

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export const idleFormState: FormState = { status: "idle" };

export function invalidForm(
  error: z.ZodError,
  values?: Record<string, string>,
): FormState {
  return {
    status: "error",
    fieldErrors: z.flattenError(error).fieldErrors,
    values,
  };
}

export function invalidField(
  name: string,
  message: string,
  values?: Record<string, string>,
): FormState {
  return { status: "error", fieldErrors: { [name]: [message] }, values };
}

export function fieldErrors(state: FormState, name: string) {
  return state.fieldErrors?.[name]?.map((message) => ({ message }));
}
