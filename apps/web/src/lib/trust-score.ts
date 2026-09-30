import type { Colleague, KnowledgeItem } from "@/lib/data/types";

export type TrustLevel = "high" | "medium" | "low";

export type TrustFactor = {
  label: string;
  points: number;
  max: number;
  note: string;
};

export type TrustScore = {
  value: number;
  level: TrustLevel;
  factors: TrustFactor[];
  /** Deductions and caps that apply on top of the factors. */
  penalties: string[];
};

export type TrustInput = {
  item: KnowledgeItem;
  owner: Colleague | null;
  successor: Colleague | null;
  hasTeam: boolean;
  supportCount: number;
  parentChanged: boolean;
  possiblyReplaced: boolean;
  openConflict: boolean;
  /** Review tasks the owner decided in the last year, and how many on time. */
  ownerRecord: { onTime: number; total: number } | null;
  monthsSinceCheck: number | null;
};

const DISPUTED_CAP = 40;

export const trustLevelLabels: Record<TrustLevel, string> = {
  high: "High trust",
  medium: "Medium trust",
  low: "Low trust",
};

function ownerFactor(input: TrustInput): TrustFactor {
  const { owner, successor, hasTeam } = input;
  const base = { label: "Owner", max: 30 };
  if (owner?.status === "active") {
    return { ...base, points: 30, note: `${owner.name} vouches for it.` };
  }
  if (owner && successor?.status === "active") {
    return {
      ...base,
      points: 12,
      note: `${owner.name} left. ${successor.name} took over but has not confirmed it.`,
    };
  }
  if (hasTeam) {
    return { ...base, points: 6, note: "No owner. Only a team is known." };
  }
  return { ...base, points: 0, note: "Nobody vouches for it." };
}

function checkFactor(input: TrustInput): TrustFactor {
  const base = { label: "Checked", max: 25 };
  const months = input.monthsSinceCheck;
  if (months === null) {
    return { ...base, points: 0, note: "Never checked. Edits do not count." };
  }
  if (input.parentChanged) {
    return {
      ...base,
      points: 5,
      note: "The rule it is based on changed after the last check.",
    };
  }
  if (months <= 6) {
    return { ...base, points: 25, note: `Checked ${months} months ago.` };
  }
  if (months <= 12) {
    return { ...base, points: 15, note: `Checked ${months} months ago.` };
  }
  return { ...base, points: 5, note: `Last checked ${months} months ago.` };
}

function evidenceFactor(input: TrustInput): TrustFactor {
  const count = input.supportCount;
  return {
    label: "Confirmed by records",
    max: 15,
    points: count >= 2 ? 15 : count === 1 ? 10 : 0,
    note:
      count > 0
        ? `${count} ${count === 1 ? "call, chat or email agrees" : "calls, chats or emails agree"}.`
        : "No call, chat or email confirms it yet.",
  };
}

function locationFactor(input: TrustInput): TrustFactor {
  const base = { label: "Official location", max: 10 };
  switch (input.item.sourceSystem) {
    case "sharepoint":
      return { ...base, points: 10, note: "On a team or legal site." };
    case "wiki":
      return { ...base, points: 8, note: "On the team wiki." };
    case "onedrive":
      return { ...base, points: 2, note: "A personal OneDrive copy." };
    default:
      return { ...base, points: 5, note: "Outside the document sites." };
  }
}

function labelFactor(input: TrustInput): TrustFactor {
  const { item } = input;
  const scoped = Boolean(item.country || item.customerId);
  const topical = item.keywords.length > 0;
  return {
    label: "Labels",
    max: 10,
    points: (scoped ? 5 : 0) + (topical ? 5 : 0),
    note:
      scoped && topical
        ? "Scope and topic are labelled."
        : scoped
          ? "Scope is labelled, topic is not."
          : topical
            ? "Topic is labelled, scope is not."
            : "No scope or topic labels.",
  };
}

function upkeepFactor(input: TrustInput): TrustFactor {
  const base = { label: "Owner upkeep", max: 10 };
  const { owner, ownerRecord } = input;
  if (owner?.status !== "active") {
    return { ...base, points: 0, note: "No active owner to keep it current." };
  }
  if (!ownerRecord || ownerRecord.total === 0) {
    return { ...base, points: 5, note: "No review history yet." };
  }
  const share = ownerRecord.onTime / ownerRecord.total;
  if (share >= 0.8) {
    return {
      ...base,
      points: 10,
      note: "The owner keeps documents up to date.",
    };
  }
  if (share >= 0.5) {
    return {
      ...base,
      points: 6,
      note: "The owner usually reviews on time.",
    };
  }
  return { ...base, points: 2, note: "Reviews by the owner often run late." };
}

export function trustScore(input: TrustInput): TrustScore {
  const factors = [
    ownerFactor(input),
    checkFactor(input),
    evidenceFactor(input),
    locationFactor(input),
    labelFactor(input),
    upkeepFactor(input),
  ];
  let value = factors.reduce((sum, factor) => sum + factor.points, 0);
  const penalties: string[] = [];

  if (input.item.status === "draft") {
    value -= 25;
    penalties.push("Draft, not approved for customers: minus 25.");
  }
  if (input.possiblyReplaced) {
    value -= 15;
    penalties.push("Possibly replaced by a newer document: minus 15.");
  }
  if (input.openConflict && value > DISPUTED_CAP) {
    value = DISPUTED_CAP;
    penalties.push(
      `Another source disagrees: at most ${DISPUTED_CAP} until the owner decides.`,
    );
  }
  value = Math.max(0, Math.min(100, value));

  return {
    value,
    level: value >= 75 ? "high" : value >= 50 ? "medium" : "low",
    factors,
    penalties,
  };
}
