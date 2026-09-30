import "server-only";
import { eq } from "drizzle-orm";
import { type Employee, getRepository } from "@/lib/data";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getAuth, roleForEmployee } from ".";
import type { Role } from "./roles";

// Public on purpose: anyone opening the demo can use these accounts.
export const DEMO_PASSWORD = "havenkaai-demo";

export type DemoAccount = {
  role: Role;
  employee: Employee;
};

export async function getDemoAccounts(): Promise<DemoAccount[]> {
  const repository = getRepository();
  const departments = await repository.listDepartments();
  const managerOf = (departmentId: string) =>
    departments.find((department) => department.id === departmentId)?.managerId;

  const warehouseManagerId = managerOf("dep-magazijn");
  const warehouseTeam = warehouseManagerId
    ? await repository.listEmployees({
        managerId: warehouseManagerId,
        status: "active",
      })
    : [];
  const warehouseWorker =
    warehouseTeam.find(
      (employee) =>
        employee.statute === "arbeider" &&
        employee.contractType === "onbepaalde_duur" &&
        employee.ftePercentage === 100,
    ) ?? warehouseTeam[0];

  // Add an employee id here to get another button on the login page.
  const employeeIds = [
    managerOf("dep-hr"),
    warehouseManagerId,
    warehouseWorker?.id,
  ];

  const accounts: DemoAccount[] = [];
  for (const id of employeeIds) {
    const employee = id ? await repository.getEmployee(id) : null;
    if (employee) {
      accounts.push({ employee, role: await roleForEmployee(employee) });
    }
  }
  return accounts;
}

export async function ensureDemoUser(employee: Employee): Promise<void> {
  const [existing] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, employee.email));
  if (existing) {
    return;
  }
  await getAuth().api.signUpEmail({
    body: {
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      password: DEMO_PASSWORD,
    },
  });
}
