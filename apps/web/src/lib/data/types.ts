import { z } from "zod";

const isoDate = z.iso.date();

export const languageSchema = z.enum(["nl", "fr", "en"]);
export const statuteSchema = z.enum(["bediende", "arbeider"]);
export const contractTypeSchema = z.enum([
  "onbepaalde_duur",
  "bepaalde_duur",
  "student",
  "flexi_job",
]);
export const employmentStatusSchema = z.enum(["active", "on_leave", "left"]);

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  legalForm: z.string(),
  enterpriseNumber: z.string(),
  sector: z.string(),
  address: z.object({
    street: z.string(),
    postalCode: z.string(),
    city: z.string(),
    country: z.string(),
  }),
  weeklyHours: z.number(),
});

export const departmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  costCenter: z.string(),
  managerId: z.string().nullable(),
});

export const benefitsSchema = z.object({
  mealVoucherValue: z.number(),
  ecoChequesYearly: z.number(),
  hospitalInsurance: z.boolean(),
  groupInsurance: z.boolean(),
  companyCar: z
    .object({
      model: z.string(),
      fuel: z.enum(["electric", "hybrid", "petrol"]),
      monthlyBenefitInKind: z.number(),
    })
    .nullable(),
  mobilityBudgetYearly: z.number().nullable(),
  homeWorkAllowanceMonthly: z.number(),
});

export const employeeSchema = z.object({
  id: z.string(),
  employeeNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  language: languageSchema,
  birthDate: isoDate,
  city: z.string(),
  departmentId: z.string(),
  jobTitle: z.string(),
  managerId: z.string().nullable(),
  statute: statuteSchema,
  jointCommittee: z.string(),
  contractType: contractTypeSchema,
  startDate: isoDate,
  endDate: isoDate.nullable(),
  status: employmentStatusSchema,
  ftePercentage: z.number().min(10).max(100),
  grossMonthlySalary: z.number(),
  benefits: benefitsSchema,
});

export const leaveTypeSchema = z.enum([
  "wettelijke_vakantie",
  "adv",
  "ziekte",
  "klein_verlet",
  "ouderschapsverlof",
  "tijdskrediet",
  "educatief_verlof",
]);
export const leaveStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const leaveRequestSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  type: leaveTypeSchema,
  startDate: isoDate,
  endDate: isoDate,
  days: z.number().positive(),
  status: leaveStatusSchema,
  requestedAt: isoDate,
  decidedBy: z.string().nullable(),
  note: z.string().nullable(),
});

export const leaveBalanceSchema = z.object({
  employeeId: z.string(),
  year: z.number().int(),
  type: leaveTypeSchema,
  entitled: z.number(),
  taken: z.number(),
  planned: z.number(),
  remaining: z.number(),
});

export const payslipSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  paymentDate: isoDate,
  workedDays: z.number(),
  grossSalary: z.number(),
  socialSecurityEmployee: z.number(),
  taxableSalary: z.number(),
  withholdingTax: z.number(),
  mealVoucherCount: z.number(),
  mealVoucherEmployeeContribution: z.number(),
  homeWorkAllowance: z.number(),
  netSalary: z.number(),
  socialSecurityEmployer: z.number(),
  totalEmployerCost: z.number(),
});

export const newLeaveRequestSchema = leaveRequestSchema.pick({
  employeeId: true,
  type: true,
  startDate: true,
  endDate: true,
  days: true,
  note: true,
});

export type Language = z.infer<typeof languageSchema>;
export type Statute = z.infer<typeof statuteSchema>;
export type ContractType = z.infer<typeof contractTypeSchema>;
export type EmploymentStatus = z.infer<typeof employmentStatusSchema>;
export type Company = z.infer<typeof companySchema>;
export type Department = z.infer<typeof departmentSchema>;
export type Benefits = z.infer<typeof benefitsSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type LeaveType = z.infer<typeof leaveTypeSchema>;
export type LeaveStatus = z.infer<typeof leaveStatusSchema>;
export type LeaveRequest = z.infer<typeof leaveRequestSchema>;
export type LeaveBalance = z.infer<typeof leaveBalanceSchema>;
export type Payslip = z.infer<typeof payslipSchema>;
export type NewLeaveRequest = z.infer<typeof newLeaveRequestSchema>;
