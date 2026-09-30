import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function InfoButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <InfoIcon strokeWidth={1.5} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[70vh] w-96 max-w-[calc(100vw-2rem)] gap-4 overflow-y-auto p-4"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-[0.08em]">
        {title}
      </h3>
      {children}
    </div>
  );
}
