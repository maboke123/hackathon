# Hackathon context

## What we know

- Event: Tectonic Hackathon, SD Worx track (HR and payroll services provider, headquartered in Belgium).
- Round: preselection on 30 September 2026, 18:00 to 23:00. We attend in Leuven.
- Next round: 16 teams per track go to the final in Ghent on 20 October 2026. Prize: EUR 10,000.
- Background reading: `sd-worx-briefing.md` (track owner) and `spott-briefing.md` (prize partner). Independent HR figures for the pitch: `hr-research.md`. Sample data: `sample-data.md`.
- Team: 4 people.
- Deliverables we expect: a working demo or proof of concept, a pitch deck and possibly a promo video.

## SD Worx and Spott

SD Worx gives us the challenge, but Spott sponsors the event. Spott is the prize partner and awards the EUR 10,000 to the final winner. Its people may also sit on the jury (this is not published), so our idea, demo and pitch should make sense from Spott's point of view too, not only SD Worx's.

Spott builds an AI-native ATS and CRM for recruitment agencies. Its product stops at the placement, where SD Worx takes over (contract, Dimona, payroll). Ideas that fit both sides are listed in section 8 of `spott-briefing.md`.

## Challenge

Not announced yet. Fill in once known.

## Our idea

To be decided. Candidate ideas are collected and scored in [ideas.md](ideas.md). Once we pick one, describe the problem, the target user, the solution and the demo scenario here.

## Decisions

Record important decisions here (scope, data sources, APIs, who owns what).

### 30 September 2026: database and authentication

- **Database: Postgres with Drizzle ORM.** Production uses a Postgres database set through `DATABASE_URL`. Without `DATABASE_URL` (local development, preview deploys) the app runs PGlite, an in-memory Postgres, so `pnpm dev` works without installing anything. That database resets on every restart.
- **Migrations and seed run on startup.** `src/instrumentation.ts` applies the migrations in `apps/web/drizzle`, loads the sample data when the database is empty and creates the demo accounts. Nobody runs database commands by hand.
- **Auth: Better Auth with email and password.** Sessions are stored in Postgres. There is no email verification and no password reset, because sending email needs a mail provider and a verified domain.
- **Roles come from the employee record.** When someone signs up, their work email is matched to an employee. HR staff get the `hr` role, people with direct reports get `manager`, everyone else gets `employee`. Emails that are not in the directory get an account without employee data.
- **Demo accounts** for the jury: HR manager, warehouse manager and one of their warehouse staff. The login page logs in with one click. The shared password is in the README.
- **Frontend and backend:** Server Components read data through the repository, Server Actions change data (validated with zod), and route handlers are only for auth, the health check and future webhooks. There is no separate API or backend service.
- **Not now:** Supabase (a second data and auth model next to the repository), Microsoft or Google login (needs redirect URLs per environment, add it only if the idea needs it), sending email.
- **Security model:** the site is a public demo with synthetic data only. Access rules are enforced on the server in every page and Server Action (tested by calling the actions directly as the wrong role). Login and sign-up are rate limited in `src/lib/rate-limit.ts`, because Better Auth's own limiter only covers its HTTP routes.

### 30 September 2026: security scanning

- **Scoring:** 10% of the points go to security. Aikido scans the repository at the end, and the score depends on how many of its findings we fixed. Aikido is connected to the repository, so check its dashboard and fix new findings as they appear.
- **CI (`.github/workflows/security.yml`)** runs on every pull request, on `main` and daily: `pnpm audit` (fails on high or critical), Aikido Safe Chain (blocks malware during `pnpm install`), Gitleaks (secrets in the full git history) and zizmor (weaknesses in the workflows themselves).
- **Dependabot (`.github/dependabot.yml`)** opens pull requests for security fixes only, plus weekly updates for GitHub Actions and the Docker base image.
- **Vulnerable transitive dependencies** are pinned to patched versions with `overrides` in `pnpm-workspace.yaml`. Remove an override once the parent package ships the fix.
- **Not available:** CodeQL and GitHub secret scanning are paid features for private repositories.
