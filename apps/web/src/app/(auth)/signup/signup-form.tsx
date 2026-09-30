"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fieldErrors, idleFormState } from "@/lib/form-state";
import { signUp } from "../actions";

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, idleFormState);
  const nameErrors = fieldErrors(state, "name");
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
        <Field data-invalid={Boolean(nameErrors)}>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            defaultValue={state.values?.name}
            aria-invalid={Boolean(nameErrors)}
          />
          <FieldError errors={nameErrors} />
        </Field>
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
            autoComplete="new-password"
            aria-invalid={Boolean(passwordErrors)}
          />
          {passwordErrors ? (
            <FieldError errors={passwordErrors} />
          ) : (
            <FieldDescription>At least 8 characters.</FieldDescription>
          )}
        </Field>
      </FieldGroup>
      <SubmitButton
        size="lg"
        pendingLabel="Creating account"
        className="self-start"
      >
        Create account
      </SubmitButton>
    </form>
  );
}
