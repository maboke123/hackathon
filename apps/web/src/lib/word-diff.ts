export type DiffPart = {
  text: string;
  change: "same" | "removed" | "added";
  /** For unchanged parts: the text as written on the before side. */
  before: string;
};

const key = (token: string) =>
  token
    .trim()
    .toLowerCase()
    .replace(/^[("'*]+|[)"'*.,;:!?]+$/g, "");

/** Word level diff (longest common subsequence), for short passages. */
export function wordDiff(before: string, after: string): DiffPart[] {
  const a = before.match(/\S+\s*/g) ?? [];
  const b = after.match(/\S+\s*/g) ?? [];
  const lengths = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      const row = lengths[i] ?? [];
      row[j] =
        key(a[i] ?? "") === key(b[j] ?? "")
          ? (lengths[i + 1]?.[j + 1] ?? 0) + 1
          : Math.max(lengths[i + 1]?.[j] ?? 0, row[j + 1] ?? 0);
    }
  }

  const parts: DiffPart[] = [];
  const push = (text: string, change: DiffPart["change"], before = text) => {
    const last = parts.at(-1);
    if (last?.change === change) {
      last.text += text;
      last.before += before;
    } else {
      parts.push({ text, change, before });
    }
  };
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    const left = a[i];
    const right = b[j];
    if (left !== undefined && right !== undefined && key(left) === key(right)) {
      push(right, "same", left);
      i += 1;
      j += 1;
    } else if (
      right === undefined ||
      (left !== undefined &&
        (lengths[i + 1]?.[j] ?? 0) >= (lengths[i]?.[j + 1] ?? 0))
    ) {
      push(left ?? "", "removed");
      i += 1;
    } else {
      push(right, "added");
      j += 1;
    }
  }
  return parts;
}

/** Marking words only helps when the sentences share enough of them. */
export function isReadableDiff(parts: DiffPart[]): boolean {
  const words = (text: string) => text.split(/\s+/).filter(Boolean).length;
  const same = parts
    .filter((part) => part.change === "same")
    .reduce((total, part) => total + words(part.text), 0);
  const before = parts
    .filter((part) => part.change !== "added")
    .reduce((total, part) => total + words(part.before), 0);
  const after = parts
    .filter((part) => part.change !== "removed")
    .reduce((total, part) => total + words(part.text), 0);
  return same / Math.max(before, after, 1) >= 0.4;
}
