import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import { chromium } from "playwright-chromium";

const documentsDir = path.join(
  import.meta.dirname,
  "../src/lib/data/seed/knowledge/documents",
);

type FrontMatter = Record<string, string>;

function splitFrontMatter(source: string): { meta: FrontMatter; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (!match?.[1]) throw new Error("Missing front matter");
  const meta: FrontMatter = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(": ");
    if (separator > 0) {
      meta[line.slice(0, separator).trim()] = line.slice(separator + 2).trim();
    }
  }
  return { meta, body: source.slice(match[0].length) };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

const wordStyle = `
  body { font-family: Carlito, Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.45; color: #1f1f1f; }
  h1 { font-size: 20pt; font-weight: 600; margin: 0 0 14pt; color: #1f3864; }
  h2 { font-size: 14pt; font-weight: 600; margin: 18pt 0 6pt; color: #1f3864; }
  h3 { font-size: 12pt; font-weight: 600; margin: 14pt 0 4pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10pt; }
  th, td { border: 1px solid #8c8c8c; padding: 4pt 6pt; text-align: left; vertical-align: top; }
  th { background: #d9e2f3; }
  code { font-family: Consolas, monospace; font-size: 10pt; }
  blockquote { margin: 8pt 0; padding: 4pt 10pt; border-left: 3px solid #8c8c8c; color: #404040; }
`;

const wikiStyle = `
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #172b4d; }
  .crumbs { font-size: 9pt; color: #5e6c84; margin-bottom: 12pt; }
  h1 { font-size: 18pt; font-weight: 500; margin: 0 0 12pt; }
  h2 { font-size: 13pt; font-weight: 600; margin: 16pt 0 6pt; }
  h3 { font-size: 11pt; font-weight: 600; margin: 12pt 0 4pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9.5pt; }
  th, td { border: 1px solid #c1c7d0; padding: 5pt 7pt; text-align: left; vertical-align: top; }
  th { background: #f4f5f7; }
  blockquote { margin: 8pt 0; padding: 6pt 10pt; background: #deebff; }
`;

function toHtml(meta: FrontMatter, body: string): string {
  const isWiki = meta.source === "wiki";
  const crumbs = isWiki
    ? `<div class="crumbs">${escapeHtml(meta.path ?? "")}</div>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(meta.title ?? "")}</title>
<style>@page { size: A4; margin: 22mm 20mm; } ${isWiki ? wikiStyle : wordStyle}</style>
</head><body>${crumbs}${marked.parse(body, { async: false, breaks: true })}</body></html>`;
}

async function main() {
  const only = process.argv[2];
  const files = (await readdir(documentsDir))
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !only || file.startsWith(only))
    .sort();

  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const file of files) {
    const { meta, body } = splitFrontMatter(
      await readFile(path.join(documentsDir, file), "utf8"),
    );
    await page.setContent(toHtml(meta, body));
    await page.pdf({
      path: path.join(documentsDir, file.replace(/\.md$/, ".pdf")),
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="font-size:8pt;color:#777;width:100%;padding:0 20mm;display:flex;justify-content:space-between"><span>${escapeHtml(meta.title ?? "")}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    });
    console.log(`Rendered ${file}`);
  }
  await browser.close();
}

await main();
