import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { LeaveStatusBadge } from "@/components/leave-status-badge";
import { NotLinked } from "@/components/not-linked";
import { PageHeader, PageSection } from "@/components/page-header";
import { Stat, Stats } from "@/components/stats";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentEmployee, requireUser } from "@/lib/auth/session";
import {
  getRepository,
  leaveTypeLabels,
  REFERENCE_DATE,
  REFERENCE_YEAR,
} from "@/lib/data";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPeriod,
} from "@/lib/format";
import { listApprovalQueue } from "@/lib/leave";
import { ApprovalTable } from "../leave/approval-table";
import { ResetDemoButton } from "./reset-demo-button";

export const metadata: Metadata = {
  title: "Overview",
};

const CURRENT_PERIOD = REFERENCE_DATE.slice(0, 7);
const APPROVAL_PREVIEW = 5;

async function TeamSection({ managerId }: { managerId: string }) {
  const repository = getRepository();
  const [team, absent] = await Promise.all([
    repository.listEmployees({ managerId, status: "active" }),
    repository.listLeaveRequests({
      managerId,
      status: "approved",
      from: REFERENCE_DATE,
      to: REFERENCE_DATE,
    }),
  ]);

  return (
    <PageSection
      title="Your team"
      action={
        <Button asChild variant="outline">
          <Link href="/employees">View team</Link>
        </Button>
      }
    >
      <Stats>
        <Stat label="Team members" value={team.length} detail="Active" />
        <Stat
          label="Absent today"
          value={absent.length}
          detail="Approved leave"
        />
      </Stats>
    </PageSection>
  );
}

async function CompanySection() {
  const repository = getRepository();
  const [employees, pending, absent, payslips] = await Promise.all([
    repository.listEmployees({ status: "active" }),
    repository.listLeaveRequests({ status: "pending" }),
    repository.listLeaveRequests({
      status: "approved",
      from: REFERENCE_DATE,
      to: REFERENCE_DATE,
    }),
    repository.listPayslips({ period: CURRENT_PERIOD }),
  ]);
  const employerCost = payslips.reduce(
    (total, payslip) => total + payslip.totalEmployerCost,
    0,
  );

  return (
    <PageSection
      title="Company"
      action={
        <Button asChild variant="outline">
          <Link href="/employees">View employees</Link>
        </Button>
      }
    >
      <Stats>
        <Stat label="Active employees" value={employees.length} />
        <Stat
          label="Pending requests"
          value={pending.length}
          detail="All departments"
        />
        <Stat
          label="Absent today"
          value={absent.length}
          detail="Approved leave"
        />
        <Stat
          label={`Employer cost ${formatPeriod(CURRENT_PERIOD)}`}
          value={formatCurrency(employerCost)}
          detail="Simulated"
        />
      </Stats>
    </PageSection>
  );
}

export default async function OverviewPage() {
  const user = await requireUser();
  const employee = await getCurrentEmployee();
  const repository = getRepository();
  const company = await repository.getCompany();

  if (!employee) {
    return (
      <>
        <PageHeader eyebrow={company.name} title={`Welcome, ${user.name}`} />
        <NotLinked />
      </>
    );
  }

  const [departments, balances, currentRequests, payslips, approvals] =
    await Promise.all([
      repository.listDepartments(),
      repository.listLeaveBalances(employee.id),
      repository.listLeaveRequests({
        employeeId: employee.id,
        from: REFERENCE_DATE,
      }),
      repository.listPayslips({ employeeId: employee.id }),
      listApprovalQueue(user),
    ]);
  const department = departments.find(
    (item) => item.id === employee.departmentId,
  );
  const vacation = balances.find(
    (balance) =>
      balance.year === REFERENCE_YEAR && balance.type === "wettelijke_vakantie",
  );
  const latestPayslip = payslips[0];
  const upcoming = currentRequests
    .filter(
      (request) =>
        request.status === "pending" || request.status === "approved",
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const openRequests = upcoming.filter(
    (request) => request.status === "pending",
  );

  return (
    <>
      <PageHeader
        eyebrow={company.name}
        title={`Welcome, ${employee.firstName}`}
        description={`${employee.jobTitle}${department ? `, ${department.name}` : ""}. Figures as of ${formatDate(REFERENCE_DATE)}.`}
      />

      <Stats>
        <Stat
          label="Vacation days left"
          value={vacation ? formatNumber(vacation.remaining) : "None"}
          detail={
            vacation
              ? `of ${formatNumber(vacation.entitled)} in ${REFERENCE_YEAR}`
              : "No vacation balance"
          }
        />
        <Stat
          label="Open requests"
          value={openRequests.length}
          detail="Waiting for approval"
        />
        {latestPayslip ? (
          <Stat
            label={`Net pay ${formatPeriod(latestPayslip.period)}`}
            value={formatCurrency(latestPayslip.netSalary)}
            detail={`Simulated, paid ${formatDate(latestPayslip.paymentDate)}`}
          />
        ) : null}
      </Stats>

      {approvals.length > 0 ? (
        <PageSection
          title="Waiting for your approval"
          description={`${approvals.length} ${approvals.length === 1 ? "request" : "requests"}, soonest first.`}
          action={
            <Button asChild variant="outline">
              <Link href="/leave">Review all</Link>
            </Button>
          }
        >
          <ApprovalTable requests={approvals.slice(0, APPROVAL_PREVIEW)} />
        </PageSection>
      ) : null}

      <PageSection
        title="Upcoming leave"
        action={
          <Button asChild variant="outline">
            <Link href="/leave">Request leave</Link>
          </Button>
        }
      >
        {upcoming.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{leaveTypeLabels[request.type]}</TableCell>
                  <TableCell>{formatDate(request.startDate)}</TableCell>
                  <TableCell>{formatDate(request.endDate)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(request.days)}
                  </TableCell>
                  <TableCell>
                    <LeaveStatusBadge status={request.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No leave planned"
            description={`Nothing booked after ${formatDate(REFERENCE_DATE)}.`}
          />
        )}
      </PageSection>

      {user.role === "manager" ? <TeamSection managerId={employee.id} /> : null}
      {user.role === "hr" ? <CompanySection /> : null}

      {user.role === "hr" ? (
        <PageSection
          title="Demo data"
          description="Restore the original dataset before a demo run."
        >
          <div>
            <ResetDemoButton />
          </div>
        </PageSection>
      ) : null}
    </>
  );
}
