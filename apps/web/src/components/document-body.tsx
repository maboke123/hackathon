"use client";

import { useEffect, useRef } from "react";
import { type Passage, parseBlocks } from "@/lib/passages";
import { cn } from "@/lib/utils";

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

const headingSizes: Record<number, string> = {
  1: "text-2xl pt-2",
  2: "text-lg pt-4",
};

/** Renders a corpus body (Markdown, email or transcript) and scrolls to the passage. */
export function DocumentBody({
  body,
  passage,
  terms = [],
  scrollToPassage = true,
}: {
  body: string;
  passage: Passage | null;
  terms?: string[];
  scrollToPassage?: boolean;
}) {
  const highlightRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (scrollToPassage) {
      highlightRef.current?.scrollIntoView({ block: "center" });
    }
  }, [scrollToPassage]);

  const at = passage?.at ?? null;
  const highlight = "bg-accent border-primary border-l-2";
  const setHighlight = (node: HTMLElement | null) => {
    highlightRef.current = node;
  };

  return (
    <div className="flex max-w-[72ch] flex-col gap-4 text-[0.9375rem] leading-7">
      {parseBlocks(body).map((block, index) => {
        const isHit = at?.block === index;
        const key = `${block.kind}-${index}`;
        switch (block.kind) {
          case "heading":
            return (
              <h3
                key={key}
                className={cn(
                  "font-heading leading-tight",
                  headingSizes[block.level] ?? "pt-2 text-base",
                )}
              >
                {block.text}
              </h3>
            );
          case "table": {
            const [header, ...rows] = block.rows;
            return (
              <div key={key} className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm leading-6">
                  {header ? (
                    <thead className="bg-muted/60 border-b text-left">
                      <tr>
                        {header.map((cell, column) => (
                          <th
                            key={`${key}-head-${column}`}
                            className="whitespace-nowrap px-3 py-2 font-medium"
                          >
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  ) : null}
                  <tbody className="divide-y">
                    {rows.map((cells, index) => {
                      const row = index + 1;
                      const rowHit = isHit && at?.row === row;
                      return (
                        <tr
                          key={`${key}-${row}`}
                          ref={rowHit ? setHighlight : undefined}
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
          }
          case "list":
            return (
              <ul
                key={key}
                ref={isHit ? setHighlight : undefined}
                className={cn(
                  "marker:text-muted-foreground flex list-disc flex-col gap-1.5 pl-5",
                  isHit && `${highlight} rounded-r-md py-2`,
                )}
              >
                {block.items.map((item) => (
                  <li key={item} className="pl-1">
                    <Marked text={item} terms={terms} />
                  </li>
                ))}
              </ul>
            );
          case "text":
            return (
              <p
                key={key}
                ref={isHit ? setHighlight : undefined}
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
