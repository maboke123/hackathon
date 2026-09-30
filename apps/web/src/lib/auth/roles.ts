export const roles = ["employee", "manager", "hr"] as const;

export type Role = (typeof roles)[number];

export const roleLabels: Record<Role, string> = {
  employee: "Employee",
  manager: "Manager",
  hr: "HR",
};

export const roleDescriptions: Record<Role, string> = {
  employee: "Requests leave and sees their own payslips.",
  manager: "Also approves leave for their team.",
  hr: "Sees every employee and approves any request.",
};
