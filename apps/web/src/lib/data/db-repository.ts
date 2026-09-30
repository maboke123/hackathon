import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  type SQL,
  sql,
} from "drizzle-orm";
import type { Database } from "@/lib/db";
import {
  departments,
  employees,
  leaveBalances,
  leaveRequests,
  payslips,
} from "@/lib/db/schema";
import type { DataRepository } from "./repository";
import { buildSeedData } from "./seed/build";
import { company } from "./seed/company";
import { REFERENCE_DATE } from "./seed/dates";
import { newLeaveRequestSchema } from "./types";

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export function createDbRepository(db: Database): DataRepository {
  return {
    async getCompany() {
      return company;
    },

    async listDepartments() {
      return db.select().from(departments).orderBy(asc(departments.name));
    },

    async listEmployees(filter = {}) {
      const search = filter.search?.trim();
      const conditions: (SQL | undefined)[] = [
        filter.departmentId
          ? eq(employees.departmentId, filter.departmentId)
          : undefined,
        filter.status ? eq(employees.status, filter.status) : undefined,
        filter.managerId
          ? eq(employees.managerId, filter.managerId)
          : undefined,
        search
          ? ilike(
              sql`${employees.firstName} || ' ' || ${employees.lastName} || ' ' || ${employees.jobTitle} || ' ' || ${employees.employeeNumber}`,
              `%${escapeLike(search)}%`,
            )
          : undefined,
      ];

      return db
        .select()
        .from(employees)
        .where(and(...conditions))
        .orderBy(asc(employees.lastName), asc(employees.firstName));
    },

    async getEmployee(id) {
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, id));
      return employee ?? null;
    },

    async getEmployeeByEmail(email) {
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(sql`lower(${employees.email})`, email.trim().toLowerCase()));
      return employee ?? null;
    },

    async listLeaveRequests(filter = {}) {
      const conditions: (SQL | undefined)[] = [
        filter.employeeId
          ? eq(leaveRequests.employeeId, filter.employeeId)
          : undefined,
        filter.managerId
          ? inArray(
              leaveRequests.employeeId,
              db
                .select({ id: employees.id })
                .from(employees)
                .where(eq(employees.managerId, filter.managerId)),
            )
          : undefined,
        filter.status ? eq(leaveRequests.status, filter.status) : undefined,
        filter.from ? gte(leaveRequests.endDate, filter.from) : undefined,
        filter.to ? lte(leaveRequests.startDate, filter.to) : undefined,
      ];

      return db
        .select()
        .from(leaveRequests)
        .where(and(...conditions))
        .orderBy(desc(leaveRequests.startDate), asc(leaveRequests.id));
    },

    async getLeaveRequest(id) {
      const [request] = await db
        .select()
        .from(leaveRequests)
        .where(eq(leaveRequests.id, id));
      return request ?? null;
    },

    async listLeaveBalances(employeeId) {
      return db
        .select()
        .from(leaveBalances)
        .where(eq(leaveBalances.employeeId, employeeId))
        .orderBy(desc(leaveBalances.year), asc(leaveBalances.type));
    },

    async createLeaveRequest(input) {
      const parsed = newLeaveRequestSchema.parse(input);

      return db.transaction(async (tx) => {
        const [request] = await tx
          .insert(leaveRequests)
          .values({
            ...parsed,
            id: `lr-${crypto.randomUUID().slice(0, 8)}`,
            status: "pending",
            requestedAt: REFERENCE_DATE,
            decidedBy: null,
          })
          .returning();
        if (!request) {
          throw new Error("Could not create the leave request.");
        }

        await tx
          .update(leaveBalances)
          .set({
            planned: sql`${leaveBalances.planned} + ${request.days}`,
            remaining: sql`${leaveBalances.remaining} - ${request.days}`,
          })
          .where(
            and(
              eq(leaveBalances.employeeId, request.employeeId),
              eq(leaveBalances.type, request.type),
              eq(leaveBalances.year, Number(request.startDate.slice(0, 4))),
            ),
          );

        return request;
      });
    },

    async decideLeaveRequest(id, status, decidedBy) {
      return db.transaction(async (tx) => {
        const [current] = await tx
          .select()
          .from(leaveRequests)
          .where(eq(leaveRequests.id, id))
          .for("update");
        if (!current) {
          return null;
        }

        const [request] = await tx
          .update(leaveRequests)
          .set({ status, decidedBy })
          .where(eq(leaveRequests.id, id))
          .returning();

        const wasCounted =
          current.status === "pending" || current.status === "approved";
        const isCounted = status === "approved";
        if (wasCounted && !isCounted) {
          await tx
            .update(leaveBalances)
            .set({
              planned: sql`${leaveBalances.planned} - ${current.days}`,
              remaining: sql`${leaveBalances.remaining} + ${current.days}`,
            })
            .where(
              and(
                eq(leaveBalances.employeeId, current.employeeId),
                eq(leaveBalances.type, current.type),
                eq(leaveBalances.year, Number(current.startDate.slice(0, 4))),
              ),
            );
        }

        return request ?? null;
      });
    },

    async listPayslips(filter = {}) {
      return db
        .select()
        .from(payslips)
        .where(
          and(
            filter.employeeId
              ? eq(payslips.employeeId, filter.employeeId)
              : undefined,
            filter.period ? eq(payslips.period, filter.period) : undefined,
          ),
        )
        .orderBy(desc(payslips.period), asc(payslips.employeeId));
    },

    async reset() {
      const seed = buildSeedData();

      await db.transaction(async (tx) => {
        await tx.delete(payslips);
        await tx.delete(leaveBalances);
        await tx.delete(leaveRequests);
        await tx.delete(employees);
        await tx.delete(departments);

        await tx.insert(departments).values(seed.departments);
        await tx.insert(employees).values(seed.employees);
        await tx.insert(leaveRequests).values(seed.leaveRequests);
        await tx.insert(leaveBalances).values(seed.leaveBalances);
        await tx.insert(payslips).values(seed.payslips);
      });
    },
  };
}
