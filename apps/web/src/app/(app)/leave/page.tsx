import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { LeaveStatusBadge } from "@/components/leave-status-badge";
import { NotLinked } from "@/components/not-linked";
import { PageHeader, PageSection } from "@/components/page-header";
import { Stat, Stats } from "@/components/stats";
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
  leaveTypeSchema,
  REFERENCE_DATE,
  REFERENCE_YEAR,
} from "@/lib/data";
import { formatDate, formatDays, formatNumber } from "@/lib/format";
import { listApprovalQueue } from "@/lib/leave";
import { ApprovalTable } from "./approval-table";
import { CancelRequestButton } from "./leave-request-buttons";
import { LeaveRequestForm } from "./leave-request-form";

export const metadata: Metadata = {
  title: "Leave",
};

const requestableTypes = leaveTypeSchema.options
  .filter((type) => type !== "ziekte")
  .map((type) => ({ value: type, label: leaveTypeLabels[type] }));

export default async function LeavePage() {
  const user = await requireUser();
  const employee = await getCurrentEmployee();

  if (!employee) {
    return (
      <>
        <PageHeader title="Leave" />
        <NotLinked />
      </>
    );
  }

  const repository = getRepository();
  const [balances, requests, approvals] = await Promise.all([
    repository.listLeaveBalances(employee.id),
    repository.listLeaveRequests({ employeeId: employee.id }),
    listApprovalQueue(user),
  ]);
  const currentBalances = balances
    .filter((balance) => balance.year === REFERENCE_YEAR)
    .sort(
      (a, b) =>
        leaveTypeSchema.options.indexOf(a.type) -
        leaveTypeSchema.options.indexOf(b.type),
    );

  return (
    <>
      <PageHeader
        eyebrow={`Leave year ${REFERENCE_YEAR}`}
        title="Leave"
        description="Request days off and follow up on your requests. Managers approve requests from their team, HR can approve any request."
      />

      {user.role !== "employee" ? (
        <PageSection
          title="Waiting for your approval"
          description={
            approvals.length > 0
              ? `${approvals.length} ${approvals.length === 1 ? "request" : "requests"}, soonest first.`
              : undefined
          }
        >
          {approvals.length > 0 ? (
            <ApprovalTable requests={approvals} />
          ) : (
            <EmptyState
              title="Nothing to approve"
              description="New requests from your team show up here."
            />
          )}
        </PageSection>
      ) : null}

      <PageSection title="Your balance">
        {currentBalances.length > 0 ? (
          <Stats>
            {currentBalances.map((balance) => (
              <Stat
                key={balance.type}
                label={leaveTypeLabels[balance.type]}
                value={formatDays(balance.remaining)}
                detail={`left of ${formatNumber(balance.entitled)}, ${formatNumber(balance.taken)} taken, ${formatNumber(balance.planned)} planned`}
              />
            ))}
          </Stats>
        ) : (
          <EmptyState
            title="No leave balance"
            description="Students and flexi-jobs don't build up vacation days."
          />
        )}
      </PageSection>

      <PageSection
        title="Request leave"
        description="Working days are counted automatically. Weekends are skipped."
      >
        <LeaveRequestForm
          leaveTypes={requestableTypes}
          minDate={REFERENCE_DATE}
        />
      </PageSection>

      <PageSection title="Your requests">
        {requests.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
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
                  <TableCell className="text-muted-foreground max-w-56 truncate">
                    {request.note ?? ""}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === "pending" ? (
                      <CancelRequestButton requestId={request.id} />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No requests yet"
            description="Requests you send appear here with their status."
          />
        )}
      </PageSection>
    </>
  );
}
