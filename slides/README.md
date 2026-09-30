# Slides

Decks are written in Markdown with [Slidev](https://sli.dev) and styled with the shared design system.

```sh
pnpm slides          # dev server with presenter mode
pnpm slides:export   # PDF export
```

Each deck is a Markdown file in this folder. To add a deck, copy `pitch.md` and run `pnpm --filter slides exec slidev <file>.md`.

Layouts: `cover`, `default`, `section`, `statement`, `two-cols`. An `h3` above the `h1` renders as an eyebrow label.
