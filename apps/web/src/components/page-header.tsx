type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-6 pb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3">
        {eyebrow ? (
          <p className="text-primary text-sm font-medium uppercase tracking-[0.08em]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-4xl leading-[1.1]">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl">{description}</p>
        ) : null}
      </div>
      {children}
    </header>
  );
}

type PageSectionProps = {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageSection({
  title,
  description,
  action,
  children,
}: PageSectionProps) {
  return (
    <section className="flex flex-col gap-6 border-t py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl">{title}</h2>
          {description ? (
            <p className="text-muted-foreground max-w-2xl text-sm">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
