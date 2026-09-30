"use client";

import { EllipsisIcon } from "lucide-react";
import { useState, useTransition } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { assignReview, decideReview } from "./actions";

export type TaskOutcome = { id: string; label: string; hint: string };

export type ColleagueOption = { id: string; name: string; jobTitle: string };

/** Runs a decision and shows the karma it earned. */
export function useDecide(reviewId: string, onDone?: () => void) {
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<string | null>(null);

  function decide(outcomeId: string) {
    setChosen(outcomeId);
    startTransition(async () => {
      const result = await decideReview({ reviewId, outcome: outcomeId });
      if (result.status === "success") {
        toast.success(`+${result.points ?? 0} karma`, {
          description: result.bonus
            ? `${result.message} ${result.bonus} of it for deciding on time.`
            : result.message,
        });
        onDone?.();
      } else {
        toast.error(result.message);
      }
      setChosen(null);
    });
  }

  return { decide, pending, chosen };
}

function AssignDialog({
  reviewId,
  colleagues,
  open,
  onOpenChange,
}: {
  reviewId: string;
  colleagues: ColleagueOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [colleagueId, setColleagueId] = useState("");
  const [pending, startTransition] = useTransition();

  function assign() {
    startTransition(async () => {
      const result = await assignReview({ reviewId, colleagueId });
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
          <DialogTitle>Assign to someone else</DialogTitle>
          <DialogDescription>
            The task moves to their queue with the same deadline. Handing on
            earns no karma, deciding does.
          </DialogDescription>
        </DialogHeader>
        <label htmlFor={`assign-${reviewId}`} className="text-sm font-medium">
          Colleague
        </label>
        <NativeSelect
          id={`assign-${reviewId}`}
          value={colleagueId}
          onChange={(event) => setColleagueId(event.target.value)}
          className="w-full"
        >
          <NativeSelectOption value="" disabled>
            Pick a colleague
          </NativeSelectOption>
          {colleagues.map((colleague) => (
            <NativeSelectOption key={colleague.id} value={colleague.id}>
              {colleague.name}, {colleague.jobTitle}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={assign} disabled={pending || !colleagueId}>
            {pending ? "Assigning" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TaskActions({
  reviewId,
  outcomes,
  colleagues,
}: {
  reviewId: string;
  outcomes: TaskOutcome[];
  colleagues: ColleagueOption[];
}) {
  const { decide, pending, chosen } = useDecide(reviewId);
  const [assigning, setAssigning] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {outcomes.map((outcome, index) => (
        <Tooltip key={outcome.id}>
          <TooltipTrigger asChild>
            <Button
              variant={index === 0 ? "default" : "outline"}
              disabled={pending}
              onClick={() => decide(outcome.id)}
            >
              {pending && chosen === outcome.id ? "Saving" : outcome.label}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{outcome.hint}</TooltipContent>
        </Tooltip>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More actions">
            <EllipsisIcon strokeWidth={1.5} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setAssigning(true)}>
            Assign to someone else
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AssignDialog
        reviewId={reviewId}
        colleagues={colleagues}
        open={assigning}
        onOpenChange={setAssigning}
      />
    </div>
  );
}

export function PickUpButton({
  reviewId,
  colleagueId,
}: {
  reviewId: string;
  colleagueId: string;
}) {
  const [pending, startTransition] = useTransition();

  function pickUp() {
    startTransition(async () => {
      const result = await assignReview({ reviewId, colleagueId });
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Button variant="outline" onClick={pickUp} disabled={pending}>
      {pending ? "Picking up" : "Pick up"}
    </Button>
  );
}
