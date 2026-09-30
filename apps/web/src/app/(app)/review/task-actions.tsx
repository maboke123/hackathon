"use client";

import { EllipsisIcon, FileTextIcon } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { assignReview, decideReview } from "./actions";

export type TaskDocument = {
  id: string;
  title: string;
  facts: { label: string; value: string }[];
  body: string;
  highlight: string | null;
};

export type TaskOutcome = { id: string; label: string; hint: string };

export type ColleagueOption = { id: string; name: string; jobTitle: string };

function Highlighted({
  body,
  highlight,
}: {
  body: string;
  highlight: string | null;
}) {
  const at = highlight ? body.indexOf(highlight) : -1;
  if (!highlight || at === -1) {
    return <>{body}</>;
  }
  return (
    <>
      {body.slice(0, at)}
      <mark className="bg-warning/30 text-foreground rounded-sm">
        {highlight}
      </mark>
      {body.slice(at + highlight.length)}
    </>
  );
}

export function DocumentsSheet({
  title,
  documents,
}: {
  title: string;
  documents: TaskDocument[];
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost">
          <FileTextIcon strokeWidth={1.5} data-icon="inline-start" />
          {documents.length > 1 ? "Compare sources" : "Read document"}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {documents.length > 1
              ? "Both sources as they are stored. The passage that disagrees is marked."
              : "The document as it is stored today."}
          </SheetDescription>
        </SheetHeader>
        {documents.map((document) => (
          <section
            key={document.id}
            className="flex flex-col gap-4 border-b p-4"
          >
            <h3 className="text-base">{document.title}</h3>
            <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-1 text-sm">
              {document.facts.map((fact) => (
                <div key={fact.label} className="contents">
                  <dt className="text-muted-foreground">{fact.label}</dt>
                  <dd className="break-all">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <div className="bg-muted/50 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border p-4 text-sm leading-relaxed">
              <Highlighted
                body={document.body}
                highlight={document.highlight}
              />
            </div>
          </section>
        ))}
      </SheetContent>
    </Sheet>
  );
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
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  function decide(outcome: TaskOutcome) {
    setChosen(outcome.id);
    startTransition(async () => {
      const result = await decideReview({ reviewId, outcome: outcome.id });
      if (result.status === "success") {
        toast.success(`+${result.points ?? 0} karma`, {
          description: result.bonus
            ? `${result.message} ${result.bonus} of it for deciding on time.`
            : result.message,
        });
      } else {
        toast.error(result.message);
      }
      setChosen(null);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {outcomes.map((outcome, index) => (
        <Tooltip key={outcome.id}>
          <TooltipTrigger asChild>
            <Button
              variant={index === 0 ? "default" : "outline"}
              disabled={pending}
              onClick={() => decide(outcome)}
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
