import "server-only";
import type { CurrentUser } from "@/lib/auth/session";
import { type Employee, getRepository, type LeaveRequest } from "@/lib/data";

export type LeaveRequestWithEmployee = LeaveRequest & { employee: Employee };

export function canDecideLeave(
  user: CurrentUser,
  request: LeaveRequest,
  requester: Employee,
): boolean {
  if (request.status !== "pending" || !user.employeeId) {
    return false;
  }
  if (request.employeeId === user.employeeId) {
    return false;
  }
  return (
    user.role === "hr" ||
    (user.role === "manager" && requester.managerId === user.employeeId)
  );
}

export async function listApprovalQueue(
  user: CurrentUser,
): Promise<LeaveRequestWithEmployee[]> {
  if (!user.employeeId || user.role === "employee") {
    return [];
  }

  const repository = getRepository();
  const scope = user.role === "hr" ? {} : { managerId: user.employeeId };
  const [requests, employees] = await Promise.all([
    repository.listLeaveRequests({ status: "pending", ...scope }),
    repository.listEmployees(scope),
  ]);
  const employeesById = new Map(
    employees.map((employee) => [employee.id, employee]),
  );

  return requests
    .flatMap((request) => {
      const employee = employeesById.get(request.employeeId);
      return employee && canDecideLeave(user, request, employee)
        ? [{ ...request, employee }]
        : [];
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
