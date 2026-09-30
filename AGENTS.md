# Agent instructions

## Context

This repository belongs to a team of four taking part in a hackathon themed around SD Worx (HR and payroll). It contains the demo app, the slide decks and the promo videos. Speed matters, but everything we show must look consistent and professional.

## Priorities: ship fast, polish the frontend

The jury judges what they see in the demo, so that is where our time goes.

- Ship fast. Pick the quickest approach that works and get each demo step working end to end before improving anything.
- The frontend must look finished: real corpus data, clear layout, sensible empty and loading states, and the design system followed to the letter.
- The backend only has to make the demo work. Simple queries, hand-seeded data, hard coded rules and stored AI output are fine. No caching layers, queues, background jobs, generic abstractions or premature optimisation.
- Do not refactor working backend code unless it blocks a demo step.
- The security basics below still apply (auth checks and zod validation in every Server Action), because security is 10% of the score.

## Docs

The team shares context through `docs/`. Read the relevant file before starting work.

[docs/plan.md](docs/plan.md) is the one unified document where everything about our solution lives: the problem, how it works, the data model, the pages, the demo script, the team split and open decisions. It merges all earlier concepts (the trust graph, legal knowledge that maintains itself, the demo script). Read it before any feature, slide or video work and build what it describes. New decisions about the solution go into `plan.md`, not into a separate file. When the implementation has to deviate from it, update `plan.md` first.

| File                         | What                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `docs/plan.md`               | The unified game plan: solution, data model, demo and team split. Start here.   |
| `docs/context.md`            | Challenge, our idea and decisions. Read before feature work.                    |
| `docs/challenge-briefing.md` | The SD Worx challenge brief: summary and transcript. Read before feature work.  |
| `docs/ideas.md`              | Idea backlog and scoring                                                        |
| `docs/sd-worx-briefing.md`   | SD Worx products, strategy, regulation and Belgian payroll vocabulary           |
| `docs/spott-briefing.md`     | Spott, the prize partner: product, people and how it relates to SD Worx         |
| `docs/hr-research.md`        | Independent HR and payroll research with checked figures for the pitch          |
| `docs/sample-data.md`        | The knowledge corpus and how it becomes the database                            |

- Update the docs at least every 3 to 5 prompts, so teammates who pull get the same context: the solution and team split in `plan.md`, decisions in `context.md`, ideas in `ideas.md`, dataset changes in `sample-data.md`.
- Every new Markdown file gets a row in this table, or in the repository layout if it lives outside `docs/`.
- Use the terminology and figures from the briefing, and check a figure at its source before it goes on a slide.

## Repository layout

| Path                     | What                                          | Stack                                                                                               |
| ------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `apps/web`               | Demo / proof of concept app                   | Next.js (App Router), TypeScript strict, Tailwind v4, shadcn/ui, Better Auth, Drizzle with Postgres |
| `packages/design-system` | Shared tokens, fonts, logo assets, guidelines | CSS variables, Tailwind v4 theme                                                                    |
| `slides`                 | Slide decks                                   | Slidev (Markdown + Vue layouts)                                                                     |
| `videos`                 | Promo videos                                  | Remotion (React)                                                                                    |
| `docs`                   | Context, ideas, decisions                     | Markdown                                                                                            |

Package manager is pnpm. Do not use npm or yarn.

## Commands

```sh
pnpm install
pnpm dev             # web app on http://localhost:3000
pnpm slides          # slide deck dev server
pnpm videos          # Remotion Studio
pnpm videos:render   # render the promo to videos/out
pnpm slides:export   # export the deck to PDF
pnpm lint
pnpm typecheck
pnpm format
pnpm db:generate     # create a migration after changing src/lib/db/schema.ts
pnpm db:studio       # browse the database (needs DATABASE_URL)
```

Run `pnpm lint` and `pnpm typecheck` before declaring work finished.

## Design system

Read `packages/design-system/DESIGN.md` before building any UI, slide or video scene. The short version:

- Use semantic tokens (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-inverse`). Never hard code hex values in components.
- Blue is the only interactive colour. Red and yellow are accents for the logo mark, charts and small highlights.
- Headings use `font-heading` (Hanken Grotesk 600), body uses Inter. Sentence case everywhere.
- Flat surfaces with borders. Radius 8px for controls and cards. Shadows only for floating elements.
- Left aligned layouts with generous white space.
- In the web app, use the shadcn/ui components in `apps/web/src/components/ui` and add new ones with `pnpm dlx shadcn@latest add <name>` from `apps/web`. Do not hand write a component that shadcn already offers.
- Logo components are in `apps/web/src/components/brand`. Logo files are in `packages/design-system/assets`.
- If a token is missing, add it to `packages/design-system/src/tokens.css` (and `tokens.ts` when it is a raw palette colour) instead of using a one-off value.

## Data

The app uses a synthetic knowledge corpus of SD Worx documents, emails, calls, meetings, chats and tickets, documented in `docs/sample-data.md`.

- Read and write data only through `getRepository()` from `@/lib/data`. Do not import the seed files directly. `@/lib/data` is server only: client components import labels and types from `@/lib/data/labels` and `@/lib/data/types`.
- Data lives in Postgres through Drizzle (`src/lib/db`). Without `DATABASE_URL` it runs in memory (PGlite) and resets on restart. Migrations and the seed run automatically on startup.
- Schema changes: update `types.ts`, `src/lib/db/schema.ts`, the seed and `db-repository.ts`, then run `pnpm db:generate` and commit the new migration in `apps/web/drizzle`. Never edit a migration that is already on `main`.
- The raw corpus is in `src/lib/data/seed/knowledge`. After changing it, run `pnpm --filter web knowledge:build` and commit `corpus.generated.json`. `ground-truth.json` is the answer key for tests, never app data.
- Payroll figures are simplified. Label them as simulated in the UI and in slides.
- Extend the dataset in `apps/web/src/lib/data` (types, seed, repository) instead of hard coding sample records in components.

## Auth and server code

- Better Auth handles accounts and sessions (`src/lib/auth`). Users have a role (`colleague`, `knowledge_manager`) and a `colleagueId` linking them to the corpus. Only the assignee of a review item may resolve it.
- Every page that shows user data calls `requireUser()` or `requireRole(...)` from `@/lib/auth/session`. `src/proxy.ts` only redirects visitors without a session cookie and is not a security check.
- Every Server Action checks the user and validates its input with zod before touching data, even when the UI already hides the action. Return a `FormState` (`src/lib/form-state.ts`) and call `revalidatePath` for the pages that show the changed data.
- Reads happen in Server Components. Writes go through Server Actions in an `actions.ts` next to the page. Use route handlers only for auth, webhooks or streaming.
- `src/app/(app)/overview` shows the pattern: page, `actions.ts`, a button with a toast. Forms use `useActionState` with `FormState`.
- Better Auth only rate limits requests to `/api/auth`. Calls from server actions skip that, so any new action that checks a password or creates accounts uses `createRateLimit` from `@/lib/rate-limit`.
- The deployed site is public and anyone can log in as a knowledge manager with the demo buttons. Never add real personal data (real CVs, payslips, contact details). If real data is ever needed, first remove the demo accounts and require a verified email or company login.

## No AI slop

Everything a jury sees (app, slides, videos, README) must look like it was made by a careful designer and written by a person.

Writing:

- Never use em dashes. Use a comma, a full stop or parentheses.
- No filler or hype phrases ("unlock", "seamless", "supercharge", "elevate", "in today's fast paced world").
- No emoji in UI, slides or videos.
- Short, concrete sentences. Prefer numbers and specific examples.

Visuals:

- No coloured or glowing drop shadows, and no shadow or scale change on hover. Hover changes background or border colour only.
- No gradients on backgrounds, text or buttons.
- No glassmorphism, blur cards or floating blobs.
- No purple accents.
- No sparkle icons or "AI powered" badges as decoration.
- Do not centre everything or wrap everything in rounded cards.
- No oversized border radius or pill shaped buttons.
- Use realistic HR and payroll sample data, not lorem ipsum or "John Doe".

## Code style

- TypeScript strict. No `any`, no `@ts-ignore`, no non-null assertions unless there is no alternative.
- Validate external data (API responses, form input, environment variables) with zod.
- Server Components by default. Add `"use client"` only where interactivity requires it.
- Comments: only write a comment when it is absolutely necessary to explain something the code cannot express. Remove comments that restate the code. Comments generated by scaffolding tools may stay.
- Keep it simple. This is a hackathon: no speculative abstractions, no unused configuration.
- Never commit secrets. Environment variables go in `.env.local`, with names documented in `.env.example`.

## Git

- Run `git pull --rebase` at the start of every prompt, before reading docs or changing files, so you work on the latest context from the team.
- Commit and `git push` at the end of every prompt that changed files, so teammates get your changes and doc updates straight away. If the push is rejected, pull with rebase, resolve conflicts and push again.
- Commit messages are a single short conventional commit line, for example `feat: add payslip overview`.
- No commit body, no bullet lists and no trailers.
- No `Co-authored-by`, no session links and no other references to AI tools in commits or pull requests.

## Slides and videos

- Slides: one Markdown file per deck in `slides/`, layouts `cover`, `default`, `section`, `statement`, `two-cols`. At most one idea per slide and at most five bullets.
- Videos: 1920x1080 at 30 fps, compositions in `videos/src/compositions`. Audio files go in `videos/public/audio`.
