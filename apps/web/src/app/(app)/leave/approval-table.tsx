import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { leaveTypeLabels } from "@/lib/data/labels";
import { formatDate, formatNumber } from "@/lib/format";
import type { LeaveRequestWithEmployee } from "@/lib/leave";
import { DecisionButtons } from "./leave-request-buttons";

export function ApprovalTable({
  requests,
}: {
  requests: LeaveRequestWithEmployee[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead className="text-right">Days</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>
            <span className="sr-only">Decision</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">
                  {request.employee.firstName} {request.employee.lastName}
                </span>
                <span className="text-muted-foreground">
                  {request.employee.jobTitle}
                </span>
              </div>
            </TableCell>
            <TableCell>{leaveTypeLabels[request.type]}</TableCell>
            <TableCell>{formatDate(request.startDate)}</TableCell>
            <TableCell>{formatDate(request.endDate)}</TableCell>
            <TableCell className="text-right font-mono">
              {formatNumber(request.days)}
            </TableCell>
            <TableCell className="text-muted-foreground max-w-56 truncate">
              {request.note ?? ""}
            </TableCell>
            <TableCell>
              <DecisionButtons requestId={request.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
