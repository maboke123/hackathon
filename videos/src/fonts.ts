import { continueRender, delayRender } from "remotion";

const faces = [
  '600 1em "Hanken Grotesk Variable"',
  '400 1em "Inter Variable"',
  '500 1em "Inter Variable"',
];

export function waitForFonts(): void {
  const handle = delayRender("Loading fonts");
  Promise.all(faces.map((face) => document.fonts.load(face)))
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle));
}
