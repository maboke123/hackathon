import { calculatePayslip } from "../payroll";
import type {
  Benefits,
  Department,
  Employee,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  Payslip,
} from "../types";
import {
  JOINT_COMMITTEES,
  cities,
  companyCars,
  departmentDefinitions,
  nameGroups,
  type NameGroup,
  type Position,
} from "./catalog";
import {
  REFERENCE_DATE,
  REFERENCE_YEAR,
  addDays,
  addWorkdays,
  nextWorkday,
  yearsBetween,
} from "./dates";
import { createRandom, type Random } from "./random";

export type SeedData = {
  departments: Department[];
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  payslips: Payslip[];
};

const MEAL_VOUCHER_VALUE = 10;
const ECO_CHEQUES_YEARLY = 250;
const HOME_WORK_ALLOWANCE = 84;
const REFERENCE_MONTH = Number(REFERENCE_DATE.slice(5, 7));

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "");
}

function pickNameGroup(random: Random): NameGroup {
  const total = nameGroups.reduce((sum, group) => sum + group.weight, 0);
  let roll = random.next() * total;
  for (const group of nameGroups) {
    roll -= group.weight;
    if (roll < 0) {
      return group;
    }
  }
  return random.pick(nameGroups);
}

function vacationNote(random: Random, startDate: string): string {
  const month = Number(startDate.slice(5, 7));
  if (month === 7 || month === 8) {
    return "Zomervakantie met het gezin";
  }
  if (month === 12) {
    return "Kerstvakantie";
  }
  if (month === 10 || month === 11) {
    return random.pick([
      "Herfstvakantie",
      "Citytrip Lissabon",
      "Verbouwing thuis",
    ]);
  }
  if (month === 3 || month === 4) {
    return random.pick(["Paasvakantie", "Lang weekend Ardennen"]);
  }
  return random.pick(["Lang weekend Ardennen", "Skivakantie", "Verhuis"]);
}

function randomDate(random: Random, fromYear: number, toYear: number): string {
  const year = random.int(fromYear, toYear);
  const month = String(random.int(1, 12)).padStart(2, "0");
  const day = String(random.int(1, 28)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildBenefits(
  random: Random,
  position: Position,
  isStudentOrFlexi: boolean,
): Benefits {
  if (isStudentOrFlexi) {
    return {
      mealVoucherValue: 0,
      ecoChequesYearly: 0,
      hospitalInsurance: false,
      groupInsurance: false,
      companyCar: null,
      mobilityBudgetYearly: null,
      homeWorkAllowanceMonthly: 0,
    };
  }

  const entitledToCar = position.companyCar === true;
  const choosesMobilityBudget = entitledToCar && random.chance(0.2);

  return {
    mealVoucherValue: MEAL_VOUCHER_VALUE,
    ecoChequesYearly: ECO_CHEQUES_YEARLY,
    hospitalInsurance: true,
    groupInsurance: position.statute === "bediende",
    companyCar:
      entitledToCar && !choosesMobilityBudget ? random.pick(companyCars) : null,
    mobilityBudgetYearly: choosesMobilityBudget
      ? random.int(9, 14) * 1000
      : null,
    homeWorkAllowanceMonthly: position.homeWork ? HOME_WORK_ALLOWANCE : 0,
  };
}

function buildEmployees(random: Random): {
  departments: Department[];
  employees: Employee[];
} {
  const departments: Department[] = [];
  const employees: Employee[] = [];
  const usedNames = new Set<string>();
  let sequence = 1;
  let directorId: string | null = null;

  for (const definition of departmentDefinitions) {
    let leadId: string | null = null;

    for (const position of definition.positions) {
      for (let index = 0; index < position.count; index += 1) {
        let nameGroup = pickNameGroup(random);
        let firstName = random.pick(nameGroup.firstNames);
        let lastName = random.pick(nameGroup.lastNames);
        while (usedNames.has(`${firstName} ${lastName}`)) {
          nameGroup = pickNameGroup(random);
          firstName = random.pick(nameGroup.firstNames);
          lastName = random.pick(nameGroup.lastNames);
        }
        usedNames.add(`${firstName} ${lastName}`);

        const employeeNumber = String(1000 + sequence);
        const id = `emp-${employeeNumber}`;
        sequence += 1;

        const isLead = position.lead === true && index === 0;
        const isSenior = isLead || position.salary[0] > 5000;
        const isStudent = position.contractType === "student";
        const birthDate = isStudent
          ? randomDate(random, 2004, 2007)
          : randomDate(random, isSenior ? 1968 : 1972, isSenior ? 1988 : 2003);
        const earliestStart = Math.max(
          Number(birthDate.slice(0, 4)) + 21,
          2008,
        );
        const startDate = nextWorkday(
          position.contractType
            ? randomDate(random, REFERENCE_YEAR - 1, REFERENCE_YEAR - 1)
            : randomDate(random, earliestStart, REFERENCE_YEAR - 1),
        );

        const contractType: Employee["contractType"] =
          position.contractType ??
          (!isLead &&
          yearsBetween(startDate, REFERENCE_DATE) < 2 &&
          random.chance(0.6)
            ? "bepaalde_duur"
            : "onbepaalde_duur");
        const isStudentOrFlexi =
          contractType === "student" || contractType === "flexi_job";

        const ftePercentage = isStudentOrFlexi
          ? random.pick([20, 40])
          : isLead
            ? 100
            : random.pick([100, 100, 100, 100, 100, 80, 80, 50]);

        const seniority = Math.min(
          yearsBetween(startDate, REFERENCE_DATE) / 15,
          1,
        );
        const [minSalary, maxSalary] = position.salary;
        const fullTimeSalary =
          minSalary +
          (maxSalary - minSalary) * (seniority * 0.7 + random.next() * 0.3);
        const grossMonthlySalary =
          Math.round((fullTimeSalary * ftePercentage) / 100 / 5) * 5;

        const hasLeft = !isLead && random.chance(0.06);
        const endDate = hasLeft
          ? nextWorkday(
              `${REFERENCE_YEAR}-0${random.int(3, 8)}-${random.int(10, 28)}`,
            )
          : contractType === "bepaalde_duur"
            ? `${REFERENCE_YEAR}-12-31`
            : null;

        const managerId: string | null = isLead ? directorId : leadId;

        employees.push({
          id,
          employeeNumber,
          firstName,
          lastName,
          email: `${slug(firstName)}.${slug(lastName)}@havenkaai.example`,
          language: random.chance(0.05) ? "en" : nameGroup.language,
          birthDate,
          city: random.pick(cities),
          departmentId: definition.id,
          jobTitle: isStudentOrFlexi
            ? `${position.jobTitle} (${contractType === "student" ? "jobstudent" : "flexi"})`
            : position.jobTitle,
          managerId,
          statute: position.statute,
          jointCommittee: JOINT_COMMITTEES[position.statute],
          contractType,
          startDate,
          endDate,
          status: hasLeft ? "left" : "active",
          ftePercentage,
          grossMonthlySalary,
          benefits: buildBenefits(random, position, isStudentOrFlexi),
        });

        if (isLead) {
          leadId = id;
          directorId ??= id;
        }
      }
    }

    departments.push({
      id: definition.id,
      name: definition.name,
      costCenter: definition.costCenter,
      managerId: leadId,
    });
  }

  return { departments, employees };
}

const leaveNotes: Partial<Record<LeaveType, readonly string[]>> = {
  klein_verlet: [
    "Huwelijk van broer",
    "Begrafenis grootmoeder",
    "Communie dochter",
  ],
  ziekte: [
    "Griep, doktersattest bezorgd",
    "Rugklachten",
    "Ingreep in het ziekenhuis",
  ],
  educatief_verlof: [
    "Opleiding heftruck attest",
    "Cursus Excel gevorderd",
    "Opleiding ADR",
  ],
};

function buildLeave(
  random: Random,
  employees: Employee[],
): { leaveRequests: LeaveRequest[]; leaveBalances: LeaveBalance[] } {
  const leaveRequests: LeaveRequest[] = [];
  const leaveBalances: LeaveBalance[] = [];
  let sequence = 1;

  for (const employee of employees) {
    const isStudentOrFlexi =
      employee.contractType === "student" ||
      employee.contractType === "flexi_job";
    if (employee.status === "left" || isStudentOrFlexi) {
      continue;
    }

    const fte = employee.ftePercentage / 100;
    const entitlements: Partial<Record<LeaveType, number>> = {
      wettelijke_vakantie: Math.round(20 * fte),
      adv: employee.ftePercentage === 100 ? 12 : 0,
    };

    const requestCount = random.int(3, 6);
    const used: Partial<Record<LeaveType, number>> = {};

    for (let index = 0; index < requestCount; index += 1) {
      const roll = random.next();
      const type: LeaveType =
        roll < 0.55
          ? "wettelijke_vakantie"
          : roll < 0.75 && entitlements.adv
            ? "adv"
            : roll < 0.9
              ? "ziekte"
              : roll < 0.95
                ? "klein_verlet"
                : "educatief_verlof";

      const days =
        type === "wettelijke_vakantie"
          ? random.pick([1, 2, 3, 5, 5, 10])
          : type === "ziekte"
            ? random.pick([1, 2, 3, 5])
            : 1;

      const entitlement = entitlements[type];
      if (entitlement !== undefined && (used[type] ?? 0) + days > entitlement) {
        continue;
      }

      const isFuture = type !== "ziekte" && random.chance(0.35);
      const startDate = nextWorkday(
        isFuture
          ? addDays(REFERENCE_DATE, random.int(2, 85))
          : addDays(`${REFERENCE_YEAR}-01-05`, random.int(0, 255)),
      );
      const endDate = addWorkdays(startDate, days);
      const status: LeaveRequest["status"] =
        type === "ziekte"
          ? "approved"
          : isFuture
            ? random.pick(["pending", "pending", "approved"])
            : random.pick([
                "approved",
                "approved",
                "approved",
                "approved",
                "rejected",
              ]);

      used[type] = (used[type] ?? 0) + (status === "rejected" ? 0 : days);

      const notes = leaveNotes[type];
      leaveRequests.push({
        id: `lr-${String(sequence).padStart(4, "0")}`,
        employeeId: employee.id,
        type,
        startDate,
        endDate,
        days,
        status,
        requestedAt:
          type === "ziekte"
            ? startDate
            : isFuture
              ? addDays(REFERENCE_DATE, -random.int(1, 45))
              : addDays(startDate, -random.int(7, 60)),
        decidedBy: status === "pending" ? null : employee.managerId,
        note: !random.chance(0.6)
          ? null
          : type === "wettelijke_vakantie"
            ? vacationNote(random, startDate)
            : notes
              ? random.pick(notes)
              : null,
      });
      sequence += 1;
    }

    for (const [type, entitled] of Object.entries(entitlements) as [
      LeaveType,
      number,
    ][]) {
      if (entitled === 0) {
        continue;
      }
      const own = leaveRequests.filter(
        (request) =>
          request.employeeId === employee.id && request.type === type,
      );
      const taken = own
        .filter(
          (request) =>
            request.status === "approved" &&
            request.startDate <= REFERENCE_DATE,
        )
        .reduce((total, request) => total + request.days, 0);
      const planned = own
        .filter(
          (request) =>
            (request.status === "approved" || request.status === "pending") &&
            request.startDate > REFERENCE_DATE,
        )
        .reduce((total, request) => total + request.days, 0);

      leaveBalances.push({
        employeeId: employee.id,
        year: REFERENCE_YEAR,
        type,
        entitled,
        taken,
        planned,
        remaining: entitled - taken - planned,
      });
    }
  }

  leaveRequests.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return { leaveRequests, leaveBalances };
}

function buildPayslips(employees: Employee[]): Payslip[] {
  const payslips: Payslip[] = [];

  for (const employee of employees) {
    for (let month = 1; month <= REFERENCE_MONTH; month += 1) {
      const period = `${REFERENCE_YEAR}-${String(month).padStart(2, "0")}`;
      const startedAfter = employee.startDate.slice(0, 7) > period;
      const leftBefore =
        employee.status === "left" &&
        employee.endDate !== null &&
        employee.endDate.slice(0, 7) < period;
      if (startedAfter || leftBefore) {
        continue;
      }
      payslips.push(calculatePayslip(employee, REFERENCE_YEAR, month));
    }
  }

  return payslips;
}

export function buildSeedData(seed = 2026): SeedData {
  const random = createRandom(seed);
  const { departments, employees } = buildEmployees(random);
  const { leaveRequests, leaveBalances } = buildLeave(random, employees);
  const payslips = buildPayslips(employees);

  return { departments, employees, leaveRequests, leaveBalances, payslips };
}
