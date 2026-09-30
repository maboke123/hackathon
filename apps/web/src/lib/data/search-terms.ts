// Common Dutch, French and English words that would match every document.
const STOPWORDS = new Set(
  (
    "de het een en van voor in op met aan te is zijn dat die dit wat hoe hoeveel " +
    "krijgt krijg kan kunnen wordt worden er ze hij zij ik je we mijn onze ook of " +
    "niet nog naar bij als dan om over tot uit le la les un une des du et en pour " +
    "est dans sur par au aux qui que the a an and of for to in on with is are be " +
    "what how many much does do can will this that it his her their our my get gets"
  ).split(" "),
);

export function searchTerms(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
  return [...new Set(words)];
}
