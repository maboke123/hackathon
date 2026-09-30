export const roles = ["colleague", "knowledge_manager"] as const;

export type Role = (typeof roles)[number];

export const roleLabels: Record<Role, string> = {
  colleague: "Colleague",
  knowledge_manager: "Knowledge manager",
};

export const roleDescriptions: Record<Role, string> = {
  colleague: "Asks questions and reviews the items assigned to them.",
  knowledge_manager: "Also sees every review queue and can reset the demo.",
};
