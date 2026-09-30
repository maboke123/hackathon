ALTER TABLE "departments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "employees" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "leave_balances" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "leave_requests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payslips" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "departments" CASCADE;--> statement-breakpoint
DROP TABLE "employees" CASCADE;--> statement-breakpoint
DROP TABLE "leave_balances" CASCADE;--> statement-breakpoint
DROP TABLE "leave_requests" CASCADE;--> statement-breakpoint
DROP TABLE "payslips" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'colleague';--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "employee_id";--> statement-breakpoint
UPDATE "users" SET "role" = 'colleague';
