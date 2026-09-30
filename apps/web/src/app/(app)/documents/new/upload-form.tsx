"use client";

import { FileTextIcon, UploadIcon } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fieldErrors, idleFormState } from "@/lib/form-state";
import { uploadDocument } from "./actions";

const SAMPLE = "/samples/werkinstructie-geboorteverlof-2026.md";

export function UploadForm() {
  const [state, action] = useActionState(uploadDocument, idleFormState);
  const [text, setText] = useState(state.values?.text ?? "");
  const [fileName, setFileName] = useState(state.values?.fileName ?? "");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      toast.error("Upload a Markdown or text file (.md or .txt).");
      return;
    }
    setText(await file.text());
    setFileName(file.name);
  }

  async function loadSample() {
    const response = await fetch(SAMPLE);
    if (!response.ok) {
      toast.error("Could not load the sample document.");
      return;
    }
    setText(await response.text());
    setFileName(SAMPLE.split("/").at(-1) ?? "");
  }

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6">
      <input type="hidden" name="fileName" value={fileName} />

      <div
        className="hover:bg-muted/50 flex flex-col items-start gap-4 rounded-lg border border-dashed p-6 transition-colors sm:flex-row sm:items-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void readFile(event.dataTransfer.files[0]);
        }}
      >
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
          {fileName ? (
            <FileTextIcon className="size-5" aria-hidden="true" />
          ) : (
            <UploadIcon className="size-5" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="font-medium">
            {fileName || "Drop a Markdown or text file here"}
          </p>
          <p className="text-muted-foreground text-sm">
            {fileName
              ? `${text.length.toLocaleString("en-GB")} characters read. Check the text below.`
              : "Or choose a file, paste the text below, or try the sample work instruction."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInput.current?.click()}
          >
            Choose file
          </Button>
          <Button type="button" variant="ghost" onClick={loadSample}>
            Use sample
          </Button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          className="sr-only"
          onChange={(event) => void readFile(event.target.files?.[0])}
        />
      </div>

      <Field>
        <FieldLabel htmlFor="title">Title</FieldLabel>
        <Input
          id="title"
          name="title"
          defaultValue={state.values?.title}
          placeholder="Taken from the first heading when left empty"
          maxLength={200}
        />
        <FieldError errors={fieldErrors(state, "title")} />
      </Field>

      <Field>
        <FieldLabel htmlFor="text">Text</FieldLabel>
        <Textarea
          id="text"
          name="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={14}
          className="font-mono text-xs leading-5"
          placeholder="# Werkinstructie ..."
        />
        <FieldDescription>
          Markdown headings, lists and tables are kept.
        </FieldDescription>
        <FieldError errors={fieldErrors(state, "text")} />
        <FieldError errors={fieldErrors(state, "fileName")} />
      </Field>

      <div>
        <SubmitButton pendingLabel="Labelling and comparing">
          Upload and label
        </SubmitButton>
      </div>
    </form>
  );
}
