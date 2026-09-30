import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
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
import { getRepository, REFERENCE_YEAR } from "@/lib/data";
import { formatCurrency, formatDate, formatPeriod } from "@/lib/format";

export const metadata: Metadata = {
  title: "Payslips",
};

export default async function PayslipsPage() {
  await requireUser();
  const employee = await getCurrentEmployee();

  if (!employee) {
    return (
      <>
        <PageHeader title="Payslips" />
        <NotLinked />
      </>
    );
  }

  const payslips = await getRepository().listPayslips({
    employeeId: employee.id,
  });
  const netToDate = payslips.reduce((total, item) => total + item.netSalary, 0);
  const employerCostToDate = payslips.reduce(
    (total, item) => total + item.totalEmployerCost,
    0,
  );

  return (
    <>
      <PageHeader
        eyebrow="Simulated figures"
        title="Payslips"
        description="Calculated with a simplified Belgian payroll model. The amounts look realistic but are not legally correct."
      />

      <Stats>
        <Stat
          label="Gross monthly salary"
          value={formatCurrency(employee.grossMonthlySalary)}
          detail={`${employee.ftePercentage}% FTE, ${employee.jointCommittee}`}
        />
        <Stat
          label={`Net pay ${REFERENCE_YEAR}`}
          value={formatCurrency(netToDate)}
          detail={`${payslips.length} payslips so far`}
        />
        <Stat
          label={`Employer cost ${REFERENCE_YEAR}`}
          value={formatCurrency(employerCostToDate)}
          detail="Gross, social security and benefits"
        />
      </Stats>

      <PageSection title="All payslips">
        {payslips.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Paid on</TableHead>
                <TableHead className="text-right">Worked days</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Social security</TableHead>
                <TableHead className="text-right">Withholding tax</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">
                    {formatPeriod(payslip.period)}
                  </TableCell>
                  <TableCell>{formatDate(payslip.paymentDate)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {payslip.workedDays}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(payslip.grossSalary)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(payslip.socialSecurityEmployee)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(payslip.withholdingTax)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(payslip.netSalary)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No payslips yet"
            description="Payslips appear after the first payroll run."
          />
        )}
      </PageSection>
    </>
  );
}
