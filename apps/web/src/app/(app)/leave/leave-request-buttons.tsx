"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form-state";
import { cancelLeave, decideLeave } from "./actions";

function useLeaveAction() {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<FormState>) {
    startTransition(async () => {
      const result = await action();
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return { pending, run };
}

export function DecisionButtons({ requestId }: { requestId: string }) {
  const { pending, run } = useLeaveAction();

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => run(() => decideLeave(requestId, "approved"))}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => decideLeave(requestId, "rejected"))}
      >
        Reject
      </Button>
    </div>
  );
}

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const { pending, run } = useLeaveAction();

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => run(() => cancelLeave(requestId))}
    >
      Cancel request
    </Button>
  );
}
