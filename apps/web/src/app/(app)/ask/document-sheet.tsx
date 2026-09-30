"use client";

import { useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { type Passage, parseBlocks } from "@/lib/passages";

export type DocumentFact = { label: string; value: string };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Marked({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  return (
    <>
      {text.split(pattern).map((part, index) =>
        index % 2 === 1 ? (
          <mark
            key={`${part}-${index}`}
            className="bg-brand-yellow/40 text-foreground rounded-sm"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

function DocumentBody({
  body,
  passage,
  terms,
}: {
  body: string;
  passage: Passage | null;
  terms: string[];
}) {
  const highlightRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ block: "center" });
  }, []);

  const at = passage?.at ?? null;
  const highlight = "bg-accent border-primary border-l-2";

  return (
    <div className="flex flex-col gap-4 leading-relaxed">
      {parseBlocks(body).map((block, index) => {
        const isHit = at?.block === index;
        const key = `${block.kind}-${index}`;
        switch (block.kind) {
          case "heading":
            return (
              <h3
                key={key}
                className={cn(
                  "font-heading pt-2",
                  block.level <= 1 ? "text-xl" : "text-base",
                )}
              >
                {block.text}
              </h3>
            );
          case "table":
            return (
              <div key={key} className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    {block.rows.map((cells, row) => {
                      const rowHit = isHit && at?.row === row;
                      return (
                        <tr
                          key={`${key}-${row}`}
                          ref={
                            rowHit
                              ? (node) => {
                                  highlightRef.current = node;
                                }
                              : undefined
                          }
                          className={cn(rowHit && highlight)}
                        >
                          {cells.map((cell, column) => (
                            <td
                              key={`${key}-${row}-${column}`}
                              className="px-3 py-2 align-top"
                            >
                              <Marked text={cell} terms={terms} />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          case "list":
            return (
              <ul
                key={key}
                ref={
                  isHit
                    ? (node) => {
                        highlightRef.current = node;
                      }
                    : undefined
                }
                className={cn(
                  "flex list-disc flex-col gap-1 pl-5",
                  isHit && `${highlight} rounded-r-md py-2`,
                )}
              >
                {block.items.map((item) => (
                  <li key={item}>
                    <Marked text={item} terms={terms} />
                  </li>
                ))}
              </ul>
            );
          case "text":
            return (
              <p
                key={key}
                ref={
                  isHit
                    ? (node) => {
                        highlightRef.current = node;
                      }
                    : undefined
                }
                className={cn(isHit && `${highlight} rounded-r-md px-3 py-2`)}
              >
                <Marked text={block.text} terms={terms} />
              </p>
            );
        }
      })}
    </div>
  );
}

export function DocumentSheet({
  title,
  body,
  facts,
  passage,
  terms,
}: {
  title: string;
  body: string;
  facts: DocumentFact[];
  passage: Passage | null;
  terms: string[];
}) {
  return (
    <Sheet>
      <SheetTrigger className="hover:text-primary text-left font-medium underline-offset-4 hover:underline">
        {title}
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-2xl data-[side=right]:sm:max-w-2xl">
        <SheetHeader className="border-b p-6 pr-12">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          <SheetDescription>
            The highlighted part is what the answer is based on. Question words
            are marked.
          </SheetDescription>
          <dl className="mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[7rem_1fr]">
            {facts.map((fact) => (
              <div key={fact.label} className="contents">
                <dt className="text-muted-foreground">{fact.label}</dt>
                <dd className="break-words">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </SheetHeader>
        <div className="overflow-y-auto p-6">
          <DocumentBody body={body} passage={passage} terms={terms} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
