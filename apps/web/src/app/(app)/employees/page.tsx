import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import {
  contractTypeLabels,
  employmentStatusLabels,
  getRepository,
} from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Employees",
};

const searchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  department: z.string().optional().catch(undefined),
});

export default async function EmployeesPage({
  searchParams,
}: PageProps<"/employees">) {
  const user = await requireRole("manager", "hr");
  const isHr = user.role === "hr";
  if (!isHr && !user.employeeId) {
    notFound();
  }

  const { q, department } = searchSchema.parse(await searchParams);
  const repository = getRepository();
  const [employees, departments] = await Promise.all([
    repository.listEmployees({
      search: q || undefined,
      departmentId: isHr ? department || undefined : undefined,
      managerId: isHr ? undefined : (user.employeeId ?? undefined),
    }),
    repository.listDepartments(),
  ]);
  const departmentNames = new Map(
    departments.map((item) => [item.id, item.name]),
  );
  const filtered = Boolean(q || department);

  return (
    <>
      <PageHeader
        eyebrow={isHr ? "All departments" : "Your team"}
        title={isHr ? "Employees" : "Team"}
        description={
          isHr
            ? "Everyone on the payroll, including people who left this year."
            : "The people who report to you."
        }
      />

      <Form
        action="/employees"
        className="flex flex-wrap items-center gap-3 border-t py-6"
      >
        <Input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Name, job title or employee number"
          aria-label="Search employees"
          className="w-72"
        />
        {isHr ? (
          <NativeSelect
            name="department"
            defaultValue={department ?? ""}
            aria-label="Department"
          >
            <NativeSelectOption value="">All departments</NativeSelectOption>
            {departments.map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : null}
        <Button type="submit" variant="outline">
          Search
        </Button>
        {filtered ? (
          <Button asChild variant="ghost">
            <Link href="/employees">Clear</Link>
          </Button>
        ) : null}
        <p className="text-muted-foreground ml-auto text-sm">
          {employees.length} {employees.length === 1 ? "person" : "people"}
        </p>
      </Form>

      {employees.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Job title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Contract</TableHead>
              <TableHead className="text-right">FTE</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="text-muted-foreground font-mono">
                  {employee.employeeNumber}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </span>
                    <span className="text-muted-foreground">
                      {employee.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{employee.jobTitle}</TableCell>
                <TableCell>
                  {departmentNames.get(employee.departmentId)}
                </TableCell>
                <TableCell>
                  {contractTypeLabels[employee.contractType]}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {employee.ftePercentage}%
                </TableCell>
                <TableCell>{formatDate(employee.startDate)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      employee.status === "active" ? "secondary" : "outline"
                    }
                  >
                    {employmentStatusLabels[employee.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          title="No one found"
          description="Try a different name or clear the filters."
        />
      )}
    </>
  );
}
