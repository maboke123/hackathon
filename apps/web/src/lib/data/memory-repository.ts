import type { DataRepository } from "./repository";
import { buildSeedData, type SeedData } from "./seed/build";
import { company } from "./seed/company";
import { REFERENCE_DATE } from "./seed/dates";
import { newLeaveRequestSchema, type LeaveRequest } from "./types";

export function createMemoryRepository(): DataRepository {
  let data: SeedData = buildSeedData();

  return {
    async getCompany() {
      return company;
    },

    async listDepartments() {
      return data.departments;
    },

    async listEmployees(filter = {}) {
      const search = filter.search?.trim().toLowerCase();
      return data.employees.filter(
        (employee) =>
          (!filter.departmentId ||
            employee.departmentId === filter.departmentId) &&
          (!filter.status || employee.status === filter.status) &&
          (!filter.managerId || employee.managerId === filter.managerId) &&
          (!search ||
            `${employee.firstName} ${employee.lastName} ${employee.jobTitle} ${employee.employeeNumber}`
              .toLowerCase()
              .includes(search)),
      );
    },

    async getEmployee(id) {
      return data.employees.find((employee) => employee.id === id) ?? null;
    },

    async listLeaveRequests(filter = {}) {
      return data.leaveRequests.filter(
        (request) =>
          (!filter.employeeId || request.employeeId === filter.employeeId) &&
          (!filter.status || request.status === filter.status) &&
          (!filter.from || request.endDate >= filter.from) &&
          (!filter.to || request.startDate <= filter.to),
      );
    },

    async listLeaveBalances(employeeId) {
      return data.leaveBalances.filter(
        (balance) => balance.employeeId === employeeId,
      );
    },

    async createLeaveRequest(input) {
      const parsed = newLeaveRequestSchema.parse(input);
      const request: LeaveRequest = {
        ...parsed,
        id: `lr-${crypto.randomUUID().slice(0, 8)}`,
        status: "pending",
        requestedAt: REFERENCE_DATE,
        decidedBy: null,
      };
      data.leaveRequests.push(request);

      const balance = data.leaveBalances.find(
        (item) =>
          item.employeeId === request.employeeId && item.type === request.type,
      );
      if (balance) {
        balance.planned += request.days;
        balance.remaining -= request.days;
      }

      return request;
    },

    async decideLeaveRequest(id, status, decidedBy) {
      const request = data.leaveRequests.find((item) => item.id === id);
      if (!request) {
        return null;
      }

      const wasCounted =
        request.status === "pending" || request.status === "approved";
      const isCounted = status === "approved";
      request.status = status;
      request.decidedBy = decidedBy;

      const balance = data.leaveBalances.find(
        (item) =>
          item.employeeId === request.employeeId && item.type === request.type,
      );
      if (balance && wasCounted && !isCounted) {
        balance.planned -= request.days;
        balance.remaining += request.days;
      }

      return request;
    },

    async listPayslips(filter = {}) {
      return data.payslips.filter(
        (payslip) =>
          (!filter.employeeId || payslip.employeeId === filter.employeeId) &&
          (!filter.period || payslip.period === filter.period),
      );
    },

    async reset() {
      data = buildSeedData();
    },
  };
}
