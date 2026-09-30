"use client";

import { ClipboardCheckIcon, MailIcon, MessageSquareIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { requestCheck } from "./actions";

export type PersonMenuTarget = {
  name: string;
  detail: string;
  email: string | null;
};

export function PersonMenu({
  person,
  itemId,
  itemTitle,
  question,
}: {
  person: PersonMenuTarget;
  itemId?: string;
  itemTitle?: string;
  question?: string;
}) {
  const [pending, startTransition] = useTransition();

  function askForCheck() {
    if (!itemId) return;
    startTransition(async () => {
      const result = await requestCheck({ itemId, question: question ?? "" });
      if (result.status === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-primary font-medium underline-offset-4 hover:underline">
        {person.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="text-foreground font-medium">{person.name}</span>
          <span className="text-muted-foreground">{person.detail}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {person.email ? (
          <>
            <DropdownMenuItem asChild>
              <a href={`mailto:${person.email}`}>
                <MailIcon strokeWidth={1.5} />
                Email {person.email}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(person.email)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageSquareIcon strokeWidth={1.5} />
                Chat in Teams
              </a>
            </DropdownMenuItem>
          </>
        ) : null}
        {itemId ? (
          <DropdownMenuItem disabled={pending} onSelect={askForCheck}>
            <ClipboardCheckIcon strokeWidth={1.5} />
            {pending
              ? "Sending"
              : `Ask to check ${itemTitle ? `"${itemTitle}"` : "this document"}`}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
