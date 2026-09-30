"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import {
  countWorkdays,
  getRepository,
  leaveTypeLabels,
  leaveTypeSchema,
  REFERENCE_DATE,
} from "@/lib/data";
import { type FormState, invalidField, invalidForm } from "@/lib/form-state";
import { formatDays } from "@/lib/format";
import { canDecideLeave } from "@/lib/leave";

const requestLeaveSchema = z.object({
  type: leaveTypeSchema.exclude(["ziekte"], { error: "Choose a leave type." }),
  startDate: z.iso.date("Pick a start date."),
  endDate: z.iso.date("Pick an end date."),
  note: z.string().trim().max(200, "Keep the note under 200 characters."),
});

const idSchema = z.string().min(1);
const decisionSchema = z.enum(["approved", "rejected"]);

function revalidateLeave() {
  revalidatePath("/leave");
  revalidatePath("/overview");
}

export async function requestLeave(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (!user.employeeId) {
    return {
      status: "error",
      message: "Your account is not linked to an employee.",
    };
  }

  const values = {
    type: String(formData.get("type") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    note: String(formData.get("note") ?? ""),
  };
  const parsed = requestLeaveSchema.safeParse(values);
  if (!parsed.success) {
    return invalidForm(parsed.error, values);
  }

  const { type, startDate, endDate, note } = parsed.data;
  if (startDate < REFERENCE_DATE) {
    return invalidField("startDate", "Leave can't start in the past.", values);
  }
  if (endDate < startDate) {
    return invalidField("endDate", "Pick an end date after the start.", values);
  }
  const days = countWorkdays(startDate, endDate);
  if (days === 0) {
    return invalidField("endDate", "This period has no working days.", values);
  }

  const repository = getRepository();
  const balance = (await repository.listLeaveBalances(user.employeeId)).find(
    (item) => item.type === type && item.year === Number(startDate.slice(0, 4)),
  );
  if (balance && balance.remaining < days) {
    return invalidField(
      "type",
      `Only ${formatDays(balance.remaining)} left for ${leaveTypeLabels[type]}.`,
      values,
    );
  }

  await repository.createLeaveRequest({
    employeeId: user.employeeId,
    type,
    startDate,
    endDate,
    days,
    note: note || null,
  });
  revalidateLeave();

  return {
    status: "success",
    message: `Request for ${formatDays(days)} sent for approval.`,
  };
}

export async function decideLeave(
  requestId: string,
  decision: "approved" | "rejected",
): Promise<FormState> {
  const user = await requireUser();
  const input = z
    .object({ id: idSchema, status: decisionSchema })
    .safeParse({ id: requestId, status: decision });
  if (!input.success) {
    return { status: "error", message: "Invalid request." };
  }
  const { id, status } = input.data;

  const repository = getRepository();
  const request = await repository.getLeaveRequest(id);
  const requester = request
    ? await repository.getEmployee(request.employeeId)
    : null;
  if (
    !request ||
    !requester ||
    !user.employeeId ||
    !canDecideLeave(user, request, requester)
  ) {
    return { status: "error", message: "You can't decide on this request." };
  }

  await repository.decideLeaveRequest(id, status, user.employeeId);
  revalidateLeave();

  return {
    status: "success",
    message: `${status === "approved" ? "Approved" : "Rejected"} leave for ${requester.firstName} ${requester.lastName}.`,
  };
}

export async function cancelLeave(requestId: string): Promise<FormState> {
  const user = await requireUser();
  const input = idSchema.safeParse(requestId);
  if (!input.success) {
    return { status: "error", message: "Invalid request." };
  }
  const id = input.data;

  const repository = getRepository();
  const request = await repository.getLeaveRequest(id);
  if (
    !request ||
    !user.employeeId ||
    request.employeeId !== user.employeeId ||
    request.status !== "pending"
  ) {
    return { status: "error", message: "This request can't be cancelled." };
  }

  await repository.decideLeaveRequest(id, "cancelled", user.employeeId);
  revalidateLeave();

  return { status: "success", message: "Request cancelled." };
}
