import { cn } from "@/lib/utils";
import {
  type TrustLevel,
  type TrustScore,
  trustLevelLabels,
} from "@/lib/trust-score";

const levelColors: Record<TrustLevel, string> = {
  high: "bg-success",
  medium: "bg-warning",
  low: "bg-destructive",
};

export function TrustBadge({
  trust,
  className,
}: {
  trust: TrustScore;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-2 py-0.5 text-sm",
        className,
      )}
      title={`Trust score ${trust.value} of 100`}
    >
      <span
        aria-hidden
        className={cn("size-2 rounded-full", levelColors[trust.level])}
      />
      <span className="font-medium tabular-nums">{trust.value}</span>
      <span className="text-muted-foreground">
        {trustLevelLabels[trust.level]}
      </span>
    </span>
  );
}

export function TrustBreakdown({ trust }: { trust: TrustScore }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-baseline gap-2">
        <span className="font-heading text-2xl font-semibold tabular-nums">
          {trust.value}
        </span>
        <span className="text-muted-foreground">
          of 100, {trustLevelLabels[trust.level].toLowerCase()}
        </span>
      </p>
      <ul className="flex flex-col gap-2.5">
        {trust.factors.map((factor) => (
          <li key={factor.label} className="flex flex-col gap-1">
            <span className="flex justify-between gap-3 text-sm">
              <span className="font-medium">{factor.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {factor.points} / {factor.max}
              </span>
            </span>
            <span className="bg-muted h-1 overflow-hidden rounded">
              <span
                className={cn(
                  "block h-full",
                  factor.points === factor.max
                    ? "bg-success"
                    : factor.points === 0
                      ? "bg-destructive"
                      : "bg-primary",
                )}
                style={{ width: `${(factor.points / factor.max) * 100}%` }}
              />
            </span>
            <span className="text-muted-foreground text-sm">{factor.note}</span>
          </li>
        ))}
      </ul>
      {trust.penalties.length > 0 ? (
        <ul className="text-destructive flex flex-col gap-1 text-sm">
          {trust.penalties.map((penalty) => (
            <li key={penalty}>{penalty}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
