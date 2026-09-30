"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fieldErrors, idleFormState } from "@/lib/form-state";
import { signIn } from "../actions";

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, idleFormState);
  const emailErrors = fieldErrors(state, "email");
  const passwordErrors = fieldErrors(state, "password");

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup>
        <Field data-invalid={Boolean(emailErrors)}>
          <FieldLabel htmlFor="email">Work email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email}
            aria-invalid={Boolean(emailErrors)}
          />
          <FieldError errors={emailErrors} />
        </Field>
        <Field data-invalid={Boolean(passwordErrors)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(passwordErrors)}
          />
          <FieldError errors={passwordErrors} />
        </Field>
      </FieldGroup>
      <SubmitButton size="lg" pendingLabel="Logging in" className="self-start">
        Log in
      </SubmitButton>
    </form>
  );
}
