export function Stats({ children }: { children: React.ReactNode }) {
  return (
    <dl className="bg-border grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-px overflow-hidden rounded-lg border">
      {children}
    </dl>
  );
}

type StatProps = {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
};

export function Stat({ label, value, detail }: StatProps) {
  return (
    <div className="bg-background flex flex-col gap-1 p-5">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-heading text-heading text-3xl font-semibold tracking-tight">
        {value}
      </dd>
      {detail ? (
        <dd className="text-muted-foreground text-sm">{detail}</dd>
      ) : null}
    </div>
  );
}
