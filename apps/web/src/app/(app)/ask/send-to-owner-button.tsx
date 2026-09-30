"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendConflictToOwner } from "./actions";

export function SendToOwnerButton({
  linkId,
  question,
}: {
  linkId: string;
  question: string;
}) {
  const [pending, startTransition] = useTransition();

  function send() {
    startTransition(async () => {
      const result = await sendConflictToOwner({ linkId, question });
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button variant="outline" onClick={send} disabled={pending}>
      {pending ? "Sending" : "Send to their queue"}
    </Button>
  );
}
