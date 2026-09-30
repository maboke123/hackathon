import { cn } from "@/lib/utils";
import type { DiffPart } from "@/lib/word-diff";

/** One side of a word diff: removed words marked red, added words green. */
export function DiffSentence({
  parts,
  fallback,
  side,
}: {
  parts: DiffPart[] | null;
  fallback: string | null;
  side: "before" | "after";
}) {
  if (!parts) {
    return (
      <>{fallback ?? "No single sentence found. Read the full source below."}</>
    );
  }
  const changed = side === "before" ? "removed" : "added";
  return (
    <>
      {parts
        .filter((part) => part.change === "same" || part.change === changed)
        .map((part, index) =>
          part.change === "same" ? (
            <span key={index}>
              {side === "before" ? part.before : part.text}
            </span>
          ) : (
            <mark
              key={index}
              className={cn(
                "text-foreground rounded-sm px-0.5",
                side === "before" ? "bg-destructive/15" : "bg-success/20",
              )}
            >
              {part.text}
            </mark>
          ),
        )}
    </>
  );
}
