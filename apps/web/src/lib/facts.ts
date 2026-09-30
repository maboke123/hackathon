import { parseBlocks } from "@/lib/passages";
import { searchTerms } from "@/lib/data/search-terms";

type Unit = "money" | "percent" | "days" | "weeks" | "months";

export type Fact = { unit: Unit; amount: number; text: string };

export type FactConflict = {
  /** The sentence in the new document. */
  mine: string;
  /** The sentence in the other document. */
  theirs: string;
  myValue: string;
  theirValue: string;
};

const UNITS: [RegExp, Unit][] = [
  [/^(eur|euro|€)$/i, "money"],
  [/^(%|procent|percent)$/i, "percent"],
  [/^(dagen|days|jours|werkdagen|kalenderdagen)$/i, "days"],
  [/^(weken|weeks|semaines)$/i, "weeks"],
  [/^(maanden|months|mois)$/i, "months"],
];

const NUMBER = String.raw`\d+(?:[.,]\d+)*`;
const VALUE = new RegExp(
  String.raw`(?:(EUR|€)\s?(${NUMBER}))|(${NUMBER})\s?(%|procent|percent|euro|EUR|dagen|days|jours|werkdagen|kalenderdagen|weken|weeks|semaines|maanden|months|mois)\b`,
  "gi",
);

const MIN_OVERLAP = 0.35;

function parseAmount(raw: string): number {
  if (/^\d{1,3}([.,]\d{3})+$/.test(raw))
    return Number(raw.replace(/[.,]/g, ""));
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(raw)) {
    return Number(raw.replace(/\./g, "").replace(",", "."));
  }
  return Number(raw.replace(",", "."));
}

export function extractFacts(text: string): Fact[] {
  const facts: Fact[] = [];
  for (const match of text.matchAll(VALUE)) {
    const unitWord = match[1] ?? match[4] ?? "";
    const number = match[2] ?? match[3] ?? "";
    const unit = UNITS.find(([pattern]) => pattern.test(unitWord))?.[1];
    const amount = parseAmount(number);
    if (unit && Number.isFinite(amount)) {
      facts.push({ unit, amount, text: match[0].trim() });
    }
  }
  return facts;
}

/** Sentences, list items and table rows, as plain text. */
export function sentences(body: string): string[] {
  return parseBlocks(body).flatMap((block) => {
    switch (block.kind) {
      case "text":
        return block.text.split(/(?<=[.!?])\s+(?=[A-Z0-9("])/);
      case "list":
        return block.items;
      case "table":
        return block.rows.map((cells) => cells.filter(Boolean).join(": "));
      case "heading":
        return [];
    }
  });
}

function words(text: string): Set<string> {
  return new Set(searchTerms(text).filter((word) => !/^\d+$/.test(word)));
}

function overlap(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared < 2 ? 0 : shared / Math.min(a.size, b.size);
}

const states = (facts: Fact[], fact: Fact) =>
  facts.some(
    (other) => other.unit === fact.unit && other.amount === fact.amount,
  );

/** A value of mine that their sentence contradicts and their document never states. */
function differing(mine: Fact[], theirs: Fact[], theirDocument: Fact[]) {
  for (const fact of mine) {
    const sameUnit = theirs.filter((other) => other.unit === fact.unit);
    if (sameUnit.length === 0 || states(theirDocument, fact)) continue;
    const other = sameUnit.find((entry) => !states(mine, entry));
    if (other) return { mine: fact, theirs: other };
  }
  return null;
}

/** The value a document stresses in bold, such as "**15 dagen**". */
function headline(body: string): Fact | null {
  for (const match of body.matchAll(/\*\*([^*]+)\*\*/g)) {
    const [fact] = extractFacts(match[1] ?? "");
    if (fact && fact.unit !== "percent") return fact;
  }
  return null;
}

/**
 * Finds a place where two documents state a different value for the same
 * thing: first two similar sentences with different amounts, then, for
 * documents on the same subject, the value each document stresses in bold.
 */
export function findConflict(
  myBody: string,
  theirBody: string,
  sameSubject: boolean,
): FactConflict | null {
  const mine = sentences(myBody).map((text) => ({
    text,
    facts: extractFacts(text),
    words: words(text),
  }));
  const theirs = sentences(theirBody).map((text) => ({
    text,
    facts: extractFacts(text),
    words: words(text),
  }));

  const theirFacts = extractFacts(theirBody.replace(/\*\*/g, ""));

  let best: (FactConflict & { score: number }) | null = null;
  for (const own of mine.filter((entry) => entry.facts.length > 0)) {
    for (const other of theirs.filter((entry) => entry.facts.length > 0)) {
      const score = overlap(own.words, other.words);
      if (score < MIN_OVERLAP || (best && score <= best.score)) continue;
      const pair = differing(own.facts, other.facts, theirFacts);
      if (!pair) continue;
      best = {
        mine: own.text,
        theirs: other.text,
        myValue: pair.mine.text,
        theirValue: pair.theirs.text,
        score,
      };
    }
  }
  if (best) {
    const { score: _score, ...conflict } = best;
    return conflict;
  }

  if (!sameSubject) return null;
  const myHeadline = headline(myBody);
  const theirHeadline = headline(theirBody);
  if (
    !myHeadline ||
    !theirHeadline ||
    myHeadline.unit !== theirHeadline.unit ||
    states(theirFacts, myHeadline)
  ) {
    return null;
  }
  const containing = (list: typeof mine, fact: Fact) =>
    list.find((entry) => entry.text.includes(fact.text))?.text ?? fact.text;
  return {
    mine: containing(mine, myHeadline),
    theirs: containing(theirs, theirHeadline),
    myValue: myHeadline.text,
    theirValue: theirHeadline.text,
  };
}
