"use client";

import { DocumentBody } from "@/components/document-body";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { SheetDocument } from "@/lib/document-view";
import { cn } from "@/lib/utils";
import { PersonMenu } from "./person-menu";

export function DocumentPanel({
  document,
  title,
  note,
  terms = [],
  question,
  className,
  scrollToPassage,
}: {
  document: SheetDocument;
  /** Heading element, so a sheet can pass its accessible title. */
  title?: React.ReactNode;
  note?: React.ReactNode;
  terms?: string[];
  question?: string;
  className?: string;
  scrollToPassage?: boolean;
}) {
  return (
    <section className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <header className="flex flex-col gap-4 border-b px-6 py-5 pr-12">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.08em]">
            {document.kindLabel}
          </p>
          {title ?? <h3 className="text-lg leading-snug">{document.title}</h3>}
          {note ? (
            <div className="text-muted-foreground text-sm">{note}</div>
          ) : null}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          {document.people.map(({ label, person, askToCheck }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd>
                <PersonMenu
                  person={person}
                  itemId={askToCheck ? document.id : undefined}
                  itemTitle={document.title}
                  question={question}
                />
              </dd>
            </div>
          ))}
          {document.facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs">{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground break-all font-mono text-xs">
          {document.location}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <DocumentBody
          body={document.body}
          passage={document.passage}
          terms={terms}
          scrollToPassage={scrollToPassage}
        />
      </div>
    </section>
  );
}

export function DocumentSheet({
  document,
  trigger,
  note,
  terms,
  question,
}: {
  document: SheetDocument;
  trigger?: React.ReactNode;
  note?: string;
  terms?: string[];
  question?: string;
}) {
  return (
    <Sheet>
      {trigger ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : (
        <SheetTrigger className="hover:text-primary text-left font-medium underline-offset-4 hover:underline">
          {document.title}
        </SheetTrigger>
      )}
      <SheetContent className="w-full gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl data-[side=right]:xl:max-w-4xl">
        <DocumentPanel
          document={document}
          title={
            <SheetTitle className="text-xl leading-snug">
              {document.title}
            </SheetTitle>
          }
          note={
            <SheetDescription>
              {note ?? "The document as it is stored today."}
            </SheetDescription>
          }
          terms={terms}
          question={question}
        />
      </SheetContent>
    </Sheet>
  );
}
