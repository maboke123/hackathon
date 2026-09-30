# Hackathon SD Worx

Demo app, slide decks and promo videos for the SD Worx hackathon, all sharing one design system.

## Getting started

Requires Node 22 or newer and pnpm 10 (`corepack enable`).

```sh
pnpm install
pnpm dev
```

| Command                                      | What it does                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm dev`                                   | Web app on http://localhost:3000, design system reference on `/design-system` |
| `pnpm slides`                                | Slide deck dev server with presenter mode                                     |
| `pnpm slides:export`                         | Export the deck to PDF                                                        |
| `pnpm videos`                                | Remotion Studio                                                               |
| `pnpm videos:render`                         | Render the promo video to `videos/out`                                        |
| `pnpm lint`, `pnpm typecheck`, `pnpm format` | Quality checks                                                                |

## Layout

| Path                     | Contents                                   |
| ------------------------ | ------------------------------------------ |
| `apps/web`               | Next.js demo app                           |
| `packages/design-system` | Tokens, fonts, logo assets and `DESIGN.md` |
| `slides`                 | Slidev decks                               |
| `videos`                 | Remotion promo videos                      |
| `docs/context.md`        | Challenge, idea and decisions              |
| `AGENTS.md`              | Instructions for AI coding agents          |
