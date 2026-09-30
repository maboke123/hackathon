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

export function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of body.split(/\n\s*\n/)) {
    const chunk = raw.trim();
    if (!chunk || /^(---|WEBVTT)$/.test(chunk)) continue;
    const lines = chunk.split("\n");
    const heading = chunk.match(/^(#{1,6})\s+(.*)$/);
    if (heading && lines.length === 1) {
      blocks.push({
        kind: "heading",
        level: heading[1]?.length ?? 1,
        text: cleanInline(heading[2] ?? ""),
      });
    } else if (lines.every((line) => line.trim().startsWith("|"))) {
      blocks.push({
        kind: "table",
        rows: lines.filter((line) => !isSeparatorRow(line)).map(tableCells),
      });
    } else if (lines.every((line) => /^\s*([-*]|\d+\.)\s+/.test(line))) {
      blocks.push({
        kind: "list",
        items: lines.map((line) =>
          cleanInline(line.replace(/^\s*([-*]|\d+\.)\s+/, "")),
        ),
      });
    } else {
      blocks.push({ kind: "text", text: cleanInline(chunk) });
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
