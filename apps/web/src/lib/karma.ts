import type {
  KarmaEvent,
  ReviewItem,
  ReviewKind,
  ReviewSource,
} from "./data/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS,
  );
}

/** Someone waiting on a call gets an answer in days, a routine check in weeks. */
export const dueDays: Record<ReviewSource, number> = {
  request: 2,
  conflict_check: 5,
  parent_change: 7,
  usage: 7,
  schedule: 14,
};

export const basePoints: Record<ReviewKind, number> = {
  conflict: 25,
  parent_changed: 20,
  no_owner: 15,
  stale: 10,
  suggested_link: 5,
  suggested_label: 5,
};

const REQUEST_BONUS = 5;

export type Reward = {
  points: number;
  base: number;
  onTimeBonus: number;
  requestBonus: number;
  onTime: boolean;
};

/** Karma only ever goes up: a late decision still counts, it just earns no bonus. */
export function rewardFor(
  review: Pick<ReviewItem, "kind" | "source" | "dueAt">,
  resolvedOn: string,
): Reward {
  const base = basePoints[review.kind];
  const onTime = resolvedOn <= review.dueAt;
  const onTimeBonus = onTime ? Math.ceil(base / 2) : 0;
  const requestBonus =
    onTime && review.source === "request" ? REQUEST_BONUS : 0;
  return {
    points: base + onTimeBonus + requestBonus,
    base,
    onTimeBonus,
    requestBonus,
    onTime,
  };
}

export const levels = [
  { name: "New owner", from: 0 },
  { name: "Contributor", from: 50 },
  { name: "Reliable owner", from: 150 },
  { name: "Trusted owner", from: 300 },
  { name: "Knowledge steward", from: 600 },
] as const;

export type KarmaSummary = {
  points: number;
  level: (typeof levels)[number];
  next: (typeof levels)[number] | null;
  progress: number;
  pointsToday: number;
  decisions: number;
  onTime: number;
  /** Share of decisions in the last 12 months made before the deadline. Input for owner trust later. */
  onTimeRate: number | null;
  streak: number;
  open: number;
  overdue: number;
};

export function summarizeKarma(
  events: KarmaEvent[],
  openReviews: Pick<ReviewItem, "dueAt">[],
  on: string = today(),
): KarmaSummary {
  const points = events.reduce((total, event) => total + event.points, 0);
  const levelIndex = levels.findLastIndex((level) => points >= level.from);
  const level = levels[Math.max(levelIndex, 0)] ?? levels[0];
  const next = levels[levelIndex + 1] ?? null;
  const progress = next ? (points - level.from) / (next.from - level.from) : 1;

  const yearAgo = addDays(on, -365);
  const recent = events.filter(
    (event) => event.createdAt.slice(0, 10) >= yearAgo,
  );
  const onTime = recent.filter((event) => event.onTime).length;

  const newestFirst = [...events].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const firstLate = newestFirst.findIndex((event) => !event.onTime);

  return {
    points,
    level,
    next,
    progress,
    pointsToday: events
      .filter((event) => event.createdAt.slice(0, 10) === on)
      .reduce((total, event) => total + event.points, 0),
    decisions: recent.length,
    onTime,
    onTimeRate: recent.length > 0 ? onTime / recent.length : null,
    streak: firstLate === -1 ? newestFirst.length : firstLate,
    open: openReviews.length,
    overdue: openReviews.filter((review) => review.dueAt < on).length,
  };
}
