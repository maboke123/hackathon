import { EmptyState } from "@/components/empty-state";

export function NotLinked() {
  return (
    <EmptyState
      title="No employee record linked"
      description="This account uses an email that is not in the employee directory, so there is no leave or payroll data to show. Log out and use a demo account, or sign up with a work email from the directory."
    />
  );
}
