import { Badge } from "@/components/ui/badge";
import { leaveStatusLabels } from "@/lib/data/labels";
import type { LeaveStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<LeaveStatus, string> = {
  pending: "bg-warning/20 text-foreground",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "border-border text-muted-foreground bg-transparent",
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <Badge className={cn(statusStyles[status])}>
      {leaveStatusLabels[status]}
    </Badge>
  );
}
