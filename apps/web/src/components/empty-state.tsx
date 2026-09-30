import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

type EmptyStateProps = {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
};

export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <Empty className="flex-none items-start rounded-lg border p-6 text-left">
      <EmptyHeader className="max-w-xl items-start text-left">
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {children ? (
        <EmptyContent className="items-start">{children}</EmptyContent>
      ) : null}
    </Empty>
  );
}
