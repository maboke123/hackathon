import {
  type AnyPgColumn,
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
// drizzle-kit loads this file outside Next.js, so imports are relative.
import { roles } from "../auth/roles";
import type {
  Benefits,
  ContractType,
  EmploymentStatus,
  Language,
  LeaveStatus,
  LeaveType,
  Statute,
} from "../data/types";

const money = () => numeric({ precision: 10, scale: 2, mode: "number" });
const dayCount = () => numeric({ precision: 5, scale: 1, mode: "number" });

export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: text(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: text({ enum: roles }).default("employee").notNull(),
  // No foreign key: reset() replaces employees but keeps their ids.
  employeeId: text(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text().primaryKey(),
    expiresAt: timestamp().notNull(),
    token: text().notNull().unique(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp(),
    refreshTokenExpiresAt: timestamp(),
    scope: text(),
    password: text(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

export const departments = pgTable("departments", {
  id: text().primaryKey(),
  name: text().notNull(),
  costCenter: text().notNull(),
  managerId: text(),
});

export const employees = pgTable(
  "employees",
  {
    id: text().primaryKey(),
    employeeNumber: text().notNull().unique(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text().notNull().unique(),
    language: text().$type<Language>().notNull(),
    birthDate: date().notNull(),
    city: text().notNull(),
    departmentId: text()
      .notNull()
      .references(() => departments.id),
    jobTitle: text().notNull(),
    managerId: text().references((): AnyPgColumn => employees.id),
    statute: text().$type<Statute>().notNull(),
    jointCommittee: text().notNull(),
    contractType: text().$type<ContractType>().notNull(),
    startDate: date().notNull(),
    endDate: date(),
    status: text().$type<EmploymentStatus>().notNull(),
    ftePercentage: integer().notNull(),
    grossMonthlySalary: money().notNull(),
    benefits: jsonb().$type<Benefits>().notNull(),
  },
  (table) => [
    index("employees_department_id_idx").on(table.departmentId),
    index("employees_manager_id_idx").on(table.managerId),
  ],
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: text().primaryKey(),
    employeeId: text()
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    type: text().$type<LeaveType>().notNull(),
    startDate: date().notNull(),
    endDate: date().notNull(),
    days: dayCount().notNull(),
    status: text().$type<LeaveStatus>().notNull(),
    requestedAt: date().notNull(),
    decidedBy: text().references(() => employees.id),
    note: text(),
  },
  (table) => [
    index("leave_requests_employee_id_idx").on(table.employeeId),
    index("leave_requests_status_idx").on(table.status),
  ],
);

export const leaveBalances = pgTable(
  "leave_balances",
  {
    employeeId: text()
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    year: integer().notNull(),
    type: text().$type<LeaveType>().notNull(),
    entitled: dayCount().notNull(),
    taken: dayCount().notNull(),
    planned: dayCount().notNull(),
    remaining: dayCount().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.employeeId, table.year, table.type] }),
  ],
);

export const payslips = pgTable(
  "payslips",
  {
    id: text().primaryKey(),
    employeeId: text()
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    period: text().notNull(),
    paymentDate: date().notNull(),
    workedDays: integer().notNull(),
    grossSalary: money().notNull(),
    socialSecurityEmployee: money().notNull(),
    taxableSalary: money().notNull(),
    withholdingTax: money().notNull(),
    mealVoucherCount: integer().notNull(),
    mealVoucherEmployeeContribution: money().notNull(),
    homeWorkAllowance: money().notNull(),
    netSalary: money().notNull(),
    socialSecurityEmployer: money().notNull(),
    totalEmployerCost: money().notNull(),
  },
  (table) => [
    unique("payslips_employee_period_unique").on(
      table.employeeId,
      table.period,
    ),
    index("payslips_period_idx").on(table.period),
  ],
);
