import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { share, type TeamSummary } from "@/lib/trust-summary";

export function TeamSummaryTable({ summaries }: { summaries: TeamSummary[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">Documents</TableHead>
          <TableHead className="text-right">Active owner</TableHead>
          <TableHead className="text-right">Checked in 12 months</TableHead>
          <TableHead className="text-right">Open conflicts</TableHead>
          <TableHead className="text-right">Open reviews</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {summaries.map((summary) => (
          <TableRow key={summary.team.id}>
            <TableCell className="font-medium">{summary.team.name}</TableCell>
            <TableCell className="text-right tabular-nums">
              {summary.documents}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {share(summary.owned, summary.documents)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {share(summary.checked, summary.documents)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {summary.conflicts}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {summary.open}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
