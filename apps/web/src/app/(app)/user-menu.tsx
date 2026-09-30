"use client";

import { LogOutIcon, RotateCcwIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import { signOut } from "../(auth)/actions";
import { ResetDemoDialog } from "./reset-demo-dialog";

type UserMenuProps = {
  name: string;
  email: string;
  roleLabel: string;
};

export function UserMenu({ name, email, roleLabel }: UserMenuProps) {
  const [pending, startTransition] = useTransition();
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="lg" className="gap-2 px-1.5">
            <Avatar size="sm">
              <AvatarFallback className="text-xs">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">{name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
            <span className="text-foreground font-medium">{name}</span>
            <span className="text-muted-foreground">{email}</span>
            <span className="text-muted-foreground">{roleLabel}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setResetOpen(true)}>
            <RotateCcwIcon strokeWidth={1.5} />
            Reset demo data
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onSelect={() => startTransition(() => signOut())}
          >
            <LogOutIcon strokeWidth={1.5} />
            {pending ? "Logging out" : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} />
    </>
  );
}
