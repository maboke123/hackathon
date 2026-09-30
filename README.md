# Hackathon SD Worx

Demo app, slide decks and promo videos for the SD Worx hackathon, all sharing one design system.

## Getting started

Requires Node 22 or newer and pnpm 10 (`corepack enable`).

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000 and log in with one of the demo accounts. No database or environment variables are needed: without `DATABASE_URL` the app runs an in-memory Postgres (PGlite) that starts from the sample data on every restart.

| Command                                      | What it does                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm dev`                                   | Web app on http://localhost:3000, design system reference on `/design-system` |
| `pnpm db:generate`                           | Create a migration after changing `apps/web/src/lib/db/schema.ts`             |
| `pnpm db:studio`                             | Browse the database in Drizzle Studio (needs `DATABASE_URL`)                  |
| `pnpm slides`                                | Slide deck dev server with presenter mode                                     |
| `pnpm slides:export`                         | Export the deck to PDF                                                        |
| `pnpm videos`                                | Remotion Studio                                                               |
| `pnpm videos:render`                         | Render the promo video to `videos/out`                                        |
| `pnpm lint`, `pnpm typecheck`, `pnpm format` | Quality checks                                                                |

## Demo accounts

The login page has a button per account. The password for all three is `havenkaai-demo`.

| Role     | Email                            | Sees                                              |
| -------- | -------------------------------- | ------------------------------------------------- |
| HR       | inge.claes@havenkaai.example     | Every employee, every leave request, company cost |
| Manager  | julien.lambert@havenkaai.example | Their team of 21 and their leave requests         |
| Employee | youssef.benali@havenkaai.example | Their own leave and payslips                      |

Signing up with the email of any other employee in the dataset links the account to that employee and gives it the matching role.

### Adding accounts

- **Any account:** sign up on `/signup`. An employee email from the dataset gets that person's data and role. Any other email gets an account without data.
- **Another one-click account:** add an employee id to `employeeIds` in `apps/web/src/lib/auth/demo-accounts.ts`. Employee number 1030 on the Employees page is id `emp-1030`. The button appears right away and the account is created on its first login.
- **Roles** come from the data: HR department is `hr`, anyone with direct reports is `manager`, everyone else is `employee`. They are set when the account is created. To change the role of an existing account on a real Postgres, update `users.role` in the database, for example with `pnpm db:studio`.
- **New people** go in the seed (`apps/web/src/lib/data/seed`). Restart, then sign up with their email or add them to `employeeIds`.

## Security

- Passwords are hashed with scrypt and a random salt per password (Better Auth). The database never contains a readable password.
- Sessions live in an `HttpOnly`, `SameSite=Lax` cookie that is signed with `BETTER_AUTH_SECRET`, and marked `Secure` when `BETTER_AUTH_URL` starts with `https://`.
- Every page and Server Action checks the session and the role on the server. Hiding a button is never the only protection.
- Login allows 5 wrong passwords per email and 20 per network address in 10 minutes. Sign-up allows 10 accounts per network address in 10 minutes.
- The site is a public demo: anyone can log in as HR with the demo buttons, and sign-up does not verify email addresses. Only use the synthetic data.

## Environment variables

Set them in `apps/web/.env.local` locally, or in the hosting panel in production.

| Name                 | Development                  | Production                                                                                   |
| -------------------- | ---------------------------- | -------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Optional, in-memory if empty | Postgres connection string, for example `postgres://user:password@postgres:5432/app`         |
| `BETTER_AUTH_SECRET` | Optional                     | Required. Generate with `openssl rand -base64 32`                                            |
| `BETTER_AUTH_URL`    | Optional                     | Required. The exact URL people open, including `https://`. It decides if cookies are secure. |

To use a real Postgres locally, start one with Docker and point the app at it:

```sh
docker run -d --name hackathon-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:17-alpine
# apps/web/.env.local
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
```

## How the web app is built

| Path (in `apps/web`)     | What                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `src/app/(auth)`         | Login and sign-up pages with their Server Actions                                                   |
| `src/app/(app)`          | Pages behind login: overview, leave, employees, payslips. The layout holds the header               |
| `src/app/(app)/leave`    | Reference feature: reads in the page, writes in `actions.ts`, form and buttons as client components |
| `src/lib/data`           | Types, seed and the repository. All data access goes through `getRepository()`                      |
| `src/lib/db`             | Drizzle schema and connection (Postgres or PGlite)                                                  |
| `drizzle`                | Generated SQL migrations, applied on startup                                                        |
| `src/lib/auth`           | Better Auth config, roles, demo accounts and `requireUser` / `requireRole`                          |
| `src/instrumentation.ts` | Runs migrations, loads the seed and creates demo accounts when the server starts                    |
| `src/proxy.ts`           | Sends visitors without a session cookie to `/login`                                                 |

A new feature usually needs three files next to each other: a `page.tsx` that calls `requireUser()` and reads through the repository, an `actions.ts` with Server Actions that check the user and validate input with zod, and a client component for the form. Copy `src/app/(app)/leave` as a starting point.

## Deployment

Every push to `main` builds the `Dockerfile` and deploys it to the team VPS. The container needs:

1. A Postgres database reachable from the container, with its connection string in `DATABASE_URL`. Without it the site still runs, but on an in-memory database that resets on every deploy.
2. `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` as described above.

On startup the app waits up to 30 seconds for the database, applies new migrations and loads the sample data if the database is empty. `/api/health` returns 200 only when the database answers, and the Docker health check uses it. If a variable is missing or wrong, the logs say which one.

## Layout

| Path                     | Contents                                           |
| ------------------------ | -------------------------------------------------- |
| `apps/web`               | Next.js demo app                                   |
| `packages/design-system` | Tokens, fonts, logo assets and `DESIGN.md`         |
| `slides`                 | Slidev decks                                       |
| `videos`                 | Remotion promo videos                              |
| `docs`                   | Challenge, ideas, briefings, research, sample data |
| `AGENTS.md`              | Instructions for AI coding agents                  |
