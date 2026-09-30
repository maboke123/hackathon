"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resetDemoData } from "./actions";

type ResetDemoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ResetDemoDialog({ open, onOpenChange }: ResetDemoDialogProps) {
  const [pending, startTransition] = useTransition();

  function reset() {
    startTransition(async () => {
      const result = await resetDemoData();
      if (result.status === "success") {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset demo data?</DialogTitle>
          <DialogDescription>
            Documents, links and review queues go back to the start of the demo:
            open conflicts, a rule change, documents without an owner and
            suggested labels. Everything changed since is removed. Accounts
            stay.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep data</Button>
          </DialogClose>
          <Button onClick={reset} disabled={pending}>
            {pending ? "Resetting" : "Reset data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
