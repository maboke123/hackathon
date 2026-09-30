import type { Employee, Payslip } from "./types";
import { lastWorkdayOfMonth, workdaysInMonth } from "./seed/dates";

export const PAYROLL_RATES = {
  socialSecurityEmployee: 0.1307,
  socialSecurityEmployer: 0.25,
  studentSolidarityEmployee: 0.0271,
  studentSolidarityEmployer: 0.0542,
  flexiJobEmployer: 0.28,
  arbeiderBaseMultiplier: 1.08,
  mealVoucherEmployeeContribution: 1.09,
  professionalExpenseRate: 0.3,
  professionalExpenseMaxYearly: 5930,
  taxFreeAllowanceYearly: 10910,
  taxBrackets: [
    { upTo: 16320, rate: 0.25 },
    { upTo: 28800, rate: 0.4 },
    { upTo: 49840, rate: 0.45 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.5 },
  ],
} as const;

const round = (value: number): number => Math.round(value * 100) / 100;

function progressiveTax(amount: number): number {
  let tax = 0;
  let lower = 0;
  for (const bracket of PAYROLL_RATES.taxBrackets) {
    if (amount <= lower) {
      break;
    }
    tax += (Math.min(amount, bracket.upTo) - lower) * bracket.rate;
    lower = bracket.upTo;
  }
  return tax;
}

export function estimateMonthlyWithholdingTax(taxableSalary: number): number {
  const yearly = taxableSalary * 12;
  const expenses = Math.min(
    yearly * PAYROLL_RATES.professionalExpenseRate,
    PAYROLL_RATES.professionalExpenseMaxYearly,
  );
  const tax =
    progressiveTax(yearly - expenses) -
    progressiveTax(PAYROLL_RATES.taxFreeAllowanceYearly);
  return round(Math.max(tax, 0) / 12);
}

export function calculatePayslip(
  employee: Employee,
  year: number,
  month: number,
): Payslip {
  const period = `${year}-${String(month).padStart(2, "0")}`;
  const fte = employee.ftePercentage / 100;
  const workedDays = Math.round(workdaysInMonth(year, month) * fte);
  const grossSalary = employee.grossMonthlySalary;

  const contributionBase =
    employee.statute === "arbeider" &&
    employee.contractType !== "student" &&
    employee.contractType !== "flexi_job"
      ? grossSalary * PAYROLL_RATES.arbeiderBaseMultiplier
      : grossSalary;
  const isStudent = employee.contractType === "student";
  const isFlexiJob = employee.contractType === "flexi_job";

  const employeeRate = isFlexiJob
    ? 0
    : isStudent
      ? PAYROLL_RATES.studentSolidarityEmployee
      : PAYROLL_RATES.socialSecurityEmployee;
  const employerRate = isFlexiJob
    ? PAYROLL_RATES.flexiJobEmployer
    : isStudent
      ? PAYROLL_RATES.studentSolidarityEmployer
      : PAYROLL_RATES.socialSecurityEmployer;

  const socialSecurityEmployee = round(contributionBase * employeeRate);
  const taxableSalary = round(grossSalary - socialSecurityEmployee);
  const withholdingTax =
    isStudent || isFlexiJob ? 0 : estimateMonthlyWithholdingTax(taxableSalary);

  const mealVoucherCount =
    employee.benefits.mealVoucherValue > 0 ? workedDays : 0;
  const mealVoucherEmployeeContribution = round(
    mealVoucherCount * PAYROLL_RATES.mealVoucherEmployeeContribution,
  );
  const homeWorkAllowance = employee.benefits.homeWorkAllowanceMonthly;

  const netSalary = round(
    taxableSalary -
      withholdingTax -
      mealVoucherEmployeeContribution +
      homeWorkAllowance,
  );

  const socialSecurityEmployer = round(contributionBase * employerRate);
  const mealVoucherEmployerCost =
    mealVoucherCount *
    Math.max(
      employee.benefits.mealVoucherValue -
        PAYROLL_RATES.mealVoucherEmployeeContribution,
      0,
    );
  const totalEmployerCost = round(
    grossSalary +
      socialSecurityEmployer +
      mealVoucherEmployerCost +
      homeWorkAllowance,
  );

  return {
    id: `pay-${employee.employeeNumber}-${period}`,
    employeeId: employee.id,
    period,
    paymentDate: lastWorkdayOfMonth(year, month),
    workedDays,
    grossSalary,
    socialSecurityEmployee,
    taxableSalary,
    withholdingTax,
    mealVoucherCount,
    mealVoucherEmployeeContribution,
    homeWorkAllowance,
    netSalary,
    socialSecurityEmployer,
    totalEmployerCost,
  };
}
