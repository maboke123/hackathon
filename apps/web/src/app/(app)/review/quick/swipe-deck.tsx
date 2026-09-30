"use client";

import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FileTextIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DocumentBody } from "@/components/document-body";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { SheetDocument } from "@/lib/document-view";
import { cn } from "@/lib/utils";
import { DocumentSheet } from "../../document-sheet";
import { decideReview } from "../actions";
import type { TaskOutcome } from "../task-actions";

export type SwipeCard = {
  reviewId: string;
  kindLabel: string;
  question: string;
  reason: string;
  confidence: number | null;
  points: number;
  yes: TaskOutcome;
  no: TaskOutcome;
  document: SheetDocument;
};

type Direction = "yes" | "no" | "skip";

const THRESHOLD = 120;
const EXIT_MS = 180;

function useCountUp(target: number) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 500;
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min((now - began) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      const value = Math.round(start + (target - start) * eased);
      from.current = value;
      setShown(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}

type Pop = { id: number; points: number; side: Direction };

const exitTransforms: Record<Direction, string> = {
  yes: "translateX(120%) rotate(12deg)",
  no: "translateX(-120%) rotate(-12deg)",
  skip: "translateY(40%)",
};

export function SwipeDeck({
  cards,
  needsFullView,
}: {
  cards: SwipeCard[];
  needsFullView: number;
}) {
  const [total] = useState(cards.length);
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<string[]>([]);
  const [earned, setEarned] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<Direction | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const start = useRef<{ x: number; id: number } | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const exiting = useRef(false);
  const wheelLock = useRef(0);
  const popId = useRef(0);
  const shownKarma = useCountUp(earned);

  const deck = cards
    .filter((card) => !handled.has(card.reviewId))
    .sort(
      (a, b) =>
        skipped.indexOf(a.reviewId) - skipped.indexOf(b.reviewId) ||
        cards.indexOf(a) - cards.indexOf(b),
    );
  const [current, next] = deck;
  const decided =
    total - cards.filter((card) => !handled.has(card.reviewId)).length;

  const finish = useCallback((card: SwipeCard, direction: Direction) => {
    setExit(direction);
    exiting.current = true;
    window.setTimeout(() => {
      exiting.current = false;
      setExit(null);
      setDx(0);
      if (direction === "skip") {
        setSkipped((order) => [
          ...order.filter((id) => id !== card.reviewId),
          card.reviewId,
        ]);
        return;
      }
      setHandled((done) => new Set(done).add(card.reviewId));
    }, EXIT_MS);
    if (direction === "skip") return;

    const id = ++popId.current;
    setPops((current) => [
      ...current,
      { id, points: card.points, side: direction },
    ]);
    window.setTimeout(
      () => setPops((current) => current.filter((pop) => pop.id !== id)),
      900,
    );
    setEarned((points) => points + card.points);

    const outcome = direction === "yes" ? card.yes : card.no;
    decideReview({ reviewId: card.reviewId, outcome: outcome.id }).then(
      (result) => {
        if (result.status === "success") {
          setEarned((points) => points + (result.points ?? 0) - card.points);
          toast.success(result.message);
          return;
        }
        setEarned((points) => points - card.points);
        toast.error(result.message);
        setHandled((done) => {
          const copy = new Set(done);
          copy.delete(card.reviewId);
          return copy;
        });
      },
    );
  }, []);

  useEffect(() => {
    const area = deckRef.current;
    if (!area || !current) return;
    let offset = 0;
    let settle = 0;

    function onWheel(event: WheelEvent) {
      if (!current || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
        return;
      }
      event.preventDefault();
      if (exiting.current || event.timeStamp < wheelLock.current) {
        wheelLock.current = event.timeStamp + 250;
        return;
      }
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        offset = 0;
        setDragging(false);
        setDx(0);
      }, 160);
      offset -= event.deltaX;
      setDragging(true);
      setDx(offset);
      if (Math.abs(offset) > THRESHOLD) {
        const direction = offset > 0 ? "yes" : "no";
        wheelLock.current = event.timeStamp + 250;
        window.clearTimeout(settle);
        offset = 0;
        setDragging(false);
        finish(current, direction);
      }
    }

    area.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.clearTimeout(settle);
      area.removeEventListener("wheel", onWheel);
    };
  }, [current, finish]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!current || exit) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.closest("input, textarea, select, [role=dialog]") ||
          target.isContentEditable)
      ) {
        return;
      }
      const direction: Direction | null =
        event.key === "ArrowRight"
          ? "yes"
          : event.key === "ArrowLeft"
            ? "no"
            : event.key === "ArrowDown"
              ? "skip"
              : null;
      if (!direction) return;
      event.preventDefault();
      finish(current, direction);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, exit, finish]);

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (exit || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a")) {
      return;
    }
    start.current = { x: event.clientX, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (start.current?.id !== event.pointerId) return;
    setDx(event.clientX - start.current.x);
  }

  function onPointerUp(event: React.PointerEvent<HTMLElement>) {
    if (start.current?.id !== event.pointerId || !current) return;
    start.current = null;
    setDragging(false);
    if (dx > THRESHOLD) finish(current, "yes");
    else if (dx < -THRESHOLD) finish(current, "no");
    else setDx(0);
  }

  const lean = dx > 40 ? "yes" : dx < -40 ? "no" : null;
  const transform = exit
    ? exitTransforms[exit]
    : `translateX(${dx}px) rotate(${dx / 30}deg)`;

  return (
    <div ref={deckRef} className="relative flex max-w-2xl flex-col gap-6 pb-10">
      {pops.map((pop) => (
        <span
          key={pop.id}
          aria-hidden
          className={cn(
            "font-heading text-primary animate-karma-rise bg-background pointer-events-none absolute top-40 z-10 rounded-lg border px-4 py-1 text-4xl font-semibold tabular-nums motion-reduce:animate-none motion-reduce:opacity-0",
            pop.side === "yes" ? "right-8" : "left-8",
          )}
        >
          +{pop.points} karma
        </span>
      ))}

      {total > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">
              {decided} of {total} decided
              {skipped.length > 0 ? `, ${skipped.length} skipped` : ""}
            </span>
            <span
              className={cn(
                "font-heading font-semibold tabular-nums transition-colors duration-200",
                shownKarma !== earned ? "text-primary" : "text-foreground",
              )}
              aria-live="polite"
            >
              +{shownKarma} karma
            </span>
          </div>
          <Progress
            value={total > 0 ? Math.round((decided / total) * 100) : 0}
            aria-label="Decisions made"
            className="h-1.5"
          />
        </div>
      ) : null}

      {current ? (
        <>
          <div className="relative">
            {next ? (
              <div
                aria-hidden
                className="bg-card absolute inset-x-3 -bottom-2 top-2 rounded-lg border"
              />
            ) : null}
            <article
              key={current.reviewId}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ transform, opacity: exit ? 0 : 1 }}
              className={cn(
                "bg-card relative flex touch-pan-y flex-col gap-5 rounded-lg border p-6",
                dragging
                  ? "cursor-grabbing select-none"
                  : "cursor-grab transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
                lean === "yes" && "border-primary",
                lean === "no" && "border-destructive",
              )}
            >
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-2 text-sm transition-opacity",
                  lean && "opacity-0",
                )}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{current.kindLabel}</Badge>
                  {current.confidence !== null ? (
                    <span className="text-muted-foreground">
                      {Math.round(current.confidence * 100)}% sure
                    </span>
                  ) : null}
                </div>
                <span className="font-heading text-primary font-semibold tabular-nums">
                  +{current.points} karma
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-2xl leading-snug">{current.question}</h2>
                <p className="text-muted-foreground text-sm">
                  {current.reason}
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border">
                <div className="flex items-start justify-between gap-4 border-b px-4 py-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium">
                      {current.document.title}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {current.document.location}
                    </span>
                  </div>
                  <DocumentSheet
                    document={current.document}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <FileTextIcon
                          strokeWidth={1.5}
                          data-icon="inline-start"
                        />
                        Open
                      </Button>
                    }
                  />
                </div>
                <div className="max-h-64 overflow-y-auto px-4 pb-4 text-sm">
                  <DocumentBody
                    body={current.document.body}
                    passage={null}
                    scrollToPassage={false}
                  />
                </div>
              </div>

              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-6 rounded-sm border-2 px-2 py-0.5 text-sm font-semibold uppercase tracking-[0.08em] transition-opacity",
                  lean === "yes" &&
                    "border-primary text-primary right-6 opacity-100",
                  lean === "no" &&
                    "border-destructive text-destructive left-6 opacity-100",
                  !lean && "opacity-0",
                )}
              >
                {lean === "no" ? current.no.label : current.yes.label}
              </span>
            </article>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 pt-2">
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                className="h-auto min-h-9 whitespace-normal py-2"
                disabled={exit !== null}
                onClick={() => finish(current, "no")}
              >
                <ArrowLeftIcon strokeWidth={1.5} data-icon="inline-start" />
                {current.no.label}
              </Button>
              <p className="text-muted-foreground text-xs">{current.no.hint}</p>
            </div>
            <Button
              variant="ghost"
              disabled={exit !== null}
              onClick={() => finish(current, "skip")}
            >
              <ArrowDownIcon strokeWidth={1.5} data-icon="inline-start" />
              Skip
            </Button>
            <div className="flex flex-col gap-1">
              <Button
                className="h-auto min-h-9 whitespace-normal py-2"
                disabled={exit !== null}
                onClick={() => finish(current, "yes")}
              >
                {current.yes.label}
                <ArrowRightIcon strokeWidth={1.5} data-icon="inline-end" />
              </Button>
              <p className="text-muted-foreground text-right text-xs">
                {current.yes.hint}
              </p>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title={
            earned > 0
              ? `All done. You earned ${earned} karma.`
              : "Nothing quick to decide"
          }
          description={
            needsFullView > 0
              ? `${needsFullView} ${needsFullView === 1 ? "task needs" : "tasks need"} a closer look, such as conflicts where you compare two sources.`
              : "Your queue is clear."
          }
        >
          <Button asChild variant={needsFullView > 0 ? "default" : "outline"}>
            <Link href="/review">Open the full queue</Link>
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
