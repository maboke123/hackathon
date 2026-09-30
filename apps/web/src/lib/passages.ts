export type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "text"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; rows: string[][] };

export type PassageLocation = { block: number; row: number | null };

export type Passage = { text: string; at: PassageLocation | null };

export function cleanInline(text: string): string {
  return text
    .replace(/\*\*|__|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSeparatorRow(line: string): boolean {
  return /^\|[\s|:-]+\|?$/.test(line.trim());
}

function tableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cleanInline(cell));
}

const listItem = /^\s*([-*]|\d+\.)\s+/;

function lineKind(line: string): "heading" | "list" | "text" {
  if (/^#{1,6}\s+/.test(line)) return "heading";
  return listItem.test(line) ? "list" : "text";
}

export function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of body.split(/\n\s*\n/)) {
    const chunk = raw.trim();
    if (!chunk || /^(---|WEBVTT)$/.test(chunk)) continue;
    const lines = chunk.split("\n");
    if (lines.every((line) => line.trim().startsWith("|"))) {
      blocks.push({
        kind: "table",
        rows: lines.filter((line) => !isSeparatorRow(line)).map(tableCells),
      });
      continue;
    }
    // A paragraph can mix a lead-in line, list items and a heading.
    const runs: { kind: "heading" | "list" | "text"; lines: string[] }[] = [];
    for (const line of lines) {
      const kind = lineKind(line);
      const last = runs.at(-1);
      if (last && kind !== "heading" && last.kind === kind) {
        last.lines.push(line);
      } else if (last?.kind === "list" && /^\s+\S/.test(line)) {
        last.lines[last.lines.length - 1] += ` ${line.trim()}`;
      } else {
        runs.push({ kind, lines: [line] });
      }
    }
    for (const run of runs) {
      if (run.kind === "heading") {
        const heading = run.lines[0]?.match(/^(#{1,6})\s+(.*)$/);
        blocks.push({
          kind: "heading",
          level: heading?.[1]?.length ?? 1,
          text: cleanInline(heading?.[2] ?? ""),
        });
      } else if (run.kind === "list") {
        blocks.push({
          kind: "list",
          items: run.lines.map((line) =>
            cleanInline(line.replace(listItem, "")),
          ),
        });
      } else {
        blocks.push({ kind: "text", text: cleanInline(run.lines.join(" ")) });
      }
    }
  }
  return blocks;
}

type Candidate = { text: string; at: PassageLocation };

function candidates(blocks: Block[]): Candidate[] {
  return blocks.flatMap((block, index): Candidate[] => {
    switch (block.kind) {
      case "text":
        return [{ text: block.text, at: { block: index, row: null } }];
      case "list":
        return [
          { text: block.items.join(" "), at: { block: index, row: null } },
        ];
      case "table":
        return block.rows.map((cells, row) => ({
          text: cells.filter(Boolean).join(": "),
          at: { block: index, row },
        }));
      case "heading":
        return [];
    }
  });
}

/** The paragraph or table row that best matches the terms. Rare terms count more. */
export function bestPassage(body: string, terms: string[]): Passage {
  const options = candidates(parseBlocks(body)).filter(
    (option) => option.text.length > 30 && !/^NOTE\b/.test(option.text),
  );
  const lowered = options.map((option) => option.text.toLowerCase());
  const weight = new Map(
    terms.map((term) => [
      term,
      1 / Math.max(1, lowered.filter((text) => text.includes(term)).length),
    ]),
  );
  let best: Candidate | undefined = options[0];
  let bestScore = -1;
  lowered.forEach((text, index) => {
    const score = terms.reduce(
      (total, term) =>
        total + (text.includes(term) ? (weight.get(term) ?? 0) : 0),
      0,
    );
    if (score > bestScore) {
      best = options[index] ?? best;
      bestScore = score;
    }
  });
  if (!best) return { text: cleanInline(body).slice(0, 600), at: null };
  const text =
    best.text.length > 600 ? `${best.text.slice(0, 597)}...` : best.text;
  return { text, at: best.at };
}

/** Where a quoted text appears in a body, so it can be highlighted. */
export function locatePassage(body: string, quote: string): Passage {
  const needle = cleanInline(quote).toLowerCase().slice(0, 40);
  const match = candidates(parseBlocks(body)).find((option) =>
    option.text.toLowerCase().includes(needle),
  );
  return { text: cleanInline(quote), at: match?.at ?? null };
}
