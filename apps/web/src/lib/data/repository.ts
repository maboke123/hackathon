import type {
  Company,
  Department,
  Employee,
  EmploymentStatus,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  NewLeaveRequest,
  Payslip,
} from "./types";

export type EmployeeFilter = {
  departmentId?: string;
  status?: EmploymentStatus;
  managerId?: string;
  search?: string;
};

export type LeaveRequestFilter = {
  employeeId?: string;
  managerId?: string;
  status?: LeaveStatus;
  from?: string;
  to?: string;
};

export type PayslipFilter = {
  employeeId?: string;
  period?: string;
};

export interface DataRepository {
  getCompany(): Promise<Company>;
  listDepartments(): Promise<Department[]>;
  listEmployees(filter?: EmployeeFilter): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | null>;
  getEmployeeByEmail(email: string): Promise<Employee | null>;
  listLeaveRequests(filter?: LeaveRequestFilter): Promise<LeaveRequest[]>;
  getLeaveRequest(id: string): Promise<LeaveRequest | null>;
  listLeaveBalances(employeeId: string): Promise<LeaveBalance[]>;
  createLeaveRequest(input: NewLeaveRequest): Promise<LeaveRequest>;
  decideLeaveRequest(
    id: string,
    status: Extract<LeaveStatus, "approved" | "rejected" | "cancelled">,
    decidedBy: string,
  ): Promise<LeaveRequest | null>;
  listPayslips(filter?: PayslipFilter): Promise<Payslip[]>;
  reset(): Promise<void>;
}
