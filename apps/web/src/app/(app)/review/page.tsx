import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, PageSection } from "@/components/page-header";
import { Stat, Stats } from "@/components/stats";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import {
  type Colleague,
  getRepository,
  type KarmaEvent,
  type KnowledgeItem,
  type KnowledgeLink,
  type ReviewItem,
  reviewKindLabels,
  reviewKindSchema,
  reviewSourceLabels,
  sourceSystemLabels,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import {
  basePoints,
  daysBetween,
  type KarmaSummary,
  rewardFor,
  summarizeKarma,
  today,
} from "@/lib/karma";
import { outcomesFor } from "@/lib/review";
import { cn } from "@/lib/utils";
import {
  type DocumentOption,
  PeriodicCheckButton,
  RequestReviewDialog,
} from "./queue-tools";
import {
  type ColleagueOption,
  DocumentsSheet,
  PickUpButton,
  TaskActions,
  type TaskDocument,
} from "./task-actions";

export const metadata: Metadata = {
  title: "Review",
};

type Context = {
  on: string;
  items: Map<string, KnowledgeItem>;
  links: Map<string, KnowledgeLink>;
  colleagues: Map<string, Colleague>;
  colleagueOptions: ColleagueOption[];
};

function dueLabel(dueAt: string, on: string) {
  const days = daysBetween(on, dueAt);
  if (days < 0) {
    const late = -days;
    return {
      text: `${late} ${late === 1 ? "day" : "days"} overdue`,
      tone: "late" as const,
    };
  }
  if (days === 0) return { text: "Due today", tone: "soon" as const };
  if (days === 1) return { text: "Due tomorrow", tone: "soon" as const };
  if (days <= 3) return { text: `Due in ${days} days`, tone: "soon" as const };
  return { text: `Due ${formatDate(dueAt)}`, tone: "normal" as const };
}

function toDocument(
  item: KnowledgeItem,
  context: Context,
  highlight: string | null,
): TaskDocument {
  const owner = item.ownerId ? context.colleagues.get(item.ownerId) : null;
  return {
    id: item.id,
    title: item.title,
    highlight,
    body: item.body,
    facts: [
      {
        label: "Owner",
        value: owner
          ? `${owner.name}${owner.status === "active" ? "" : " (left)"}`
          : "None",
      },
      {
        label: "Last checked",
        value: item.lastCheckedAt ? formatDate(item.lastCheckedAt) : "Never",
      },
      {
        label: "Where",
        value: `${sourceSystemLabels[item.sourceSystem]}, ${item.location}`,
      },
      {
        label: "Modified",
        value: formatDate(item.modifiedAt.slice(0, 10)),
      },
    ],
  };
}

function TaskRow({
  review,
  context,
  mode,
  colleagueId,
}: {
  review: ReviewItem;
  context: Context;
  mode: "mine" | "team";
  colleagueId: string;
}) {
  const [itemId, ...relatedIds] = review.itemIds;
  const item = itemId ? context.items.get(itemId) : undefined;
  if (!item) return null;
  const link = review.linkId
    ? (context.links.get(review.linkId) ?? null)
    : null;
  const related = relatedIds
    .map((id) => context.items.get(id))
    .filter((entry): entry is KnowledgeItem => entry !== undefined);
  const requester = review.requestedById
    ? context.colleagues.get(review.requestedById)
    : undefined;
  const due = dueLabel(review.dueAt, context.on);
  const reward = rewardFor(review, context.on);
  const bonus = reward.onTimeBonus + reward.requestBonus;
  const documents = [
    toDocument(item, context, null),
    ...related.map((entry) =>
      toDocument(entry, context, link?.evidence ?? null),
    ),
  ];

  return (
    <li className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-8">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge
              variant={review.kind === "conflict" ? "destructive" : "secondary"}
            >
              {reviewKindLabels[review.kind]}
            </Badge>
            <span className="text-muted-foreground">
              {reviewSourceLabels[review.source]}
              {requester ? ` by ${requester.name}` : ""}
            </span>
          </div>
          <h3 className="text-lg leading-snug">{item.title}</h3>
          <p className="text-muted-foreground max-w-2xl text-sm">
            {review.trigger}
          </p>
          {related.length > 0 ? (
            <p className="text-sm">
              <span className="text-muted-foreground">
                {review.kind === "conflict" ? "Disagrees with " : "Linked to "}
              </span>
              {related.map((entry) => entry.title).join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-row flex-wrap items-baseline gap-x-3 gap-y-1 whitespace-nowrap sm:flex-col sm:items-end sm:text-right">
          <span
            className={cn(
              "text-sm font-medium",
              due.tone === "late" && "text-destructive",
              due.tone === "soon" && "text-warning-foreground",
            )}
          >
            {due.text}
          </span>
          <span className="font-heading text-primary text-lg font-semibold tabular-nums">
            +{reward.points} karma
          </span>
          <span className="text-muted-foreground basis-full text-xs sm:basis-auto">
            {bonus > 0
              ? `Includes ${bonus} for deciding on time`
              : "Late decisions still count"}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {mode === "mine" ? (
          <TaskActions
            reviewId={review.id}
            outcomes={outcomesFor(review, link)}
            colleagues={context.colleagueOptions}
          />
        ) : (
          <PickUpButton reviewId={review.id} colleagueId={colleagueId} />
        )}
        <DocumentsSheet title={item.title} documents={documents} />
      </div>
    </li>
  );
}

function KarmaPanel({ summary }: { summary: KarmaSummary }) {
  return (
    <Stats>
      <Stat
        label="Karma"
        value={summary.points}
        detail={
          <span className="flex flex-col gap-2 pt-1">
            <span className="text-foreground font-medium">
              {summary.level.name}
            </span>
            <Progress
              value={Math.round(summary.progress * 100)}
              aria-label={`Progress to ${summary.next?.name ?? "the top level"}`}
              className="h-1.5"
            />
            <span>
              {summary.next
                ? `${summary.next.from - summary.points} to ${summary.next.name}`
                : "Highest level"}
            </span>
          </span>
        }
      />
      <Stat
        label="On time"
        value={
          summary.onTimeRate === null
            ? "0"
            : `${Math.round(summary.onTimeRate * 100)}%`
        }
        detail={
          summary.onTimeRate === null
            ? "No decisions yet. Decide before the deadline to start."
            : `${summary.onTime} of ${summary.decisions} decisions in the last 12 months`
        }
      />
      <Stat
        label="Streak"
        value={summary.streak}
        detail="Decisions on time in a row"
      />
      <Stat
        label="Open"
        value={summary.open}
        detail={
          summary.overdue > 0 ? (
            <span className="text-destructive">{summary.overdue} overdue</span>
          ) : summary.open > 0 ? (
            "None overdue"
          ) : (
            "Queue clear"
          )
        }
      />
    </Stats>
  );
}

function History({ events }: { events: KarmaEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No karma yet"
        description="Decide on a task in your queue and it shows up here."
      />
    );
  }
  return (
    <ul className="divide-y rounded-lg border">
      {events.map((event) => (
        <li
          key={event.id}
          className="grid grid-cols-[4rem_1fr_auto] items-baseline gap-4 px-5 py-3 text-sm"
        >
          <span className="font-heading text-primary font-semibold tabular-nums">
            +{event.points}
          </span>
          <span>{event.reason}</span>
          <span className="text-muted-foreground text-right">
            {formatDate(event.createdAt.slice(0, 10))}
            {event.onTime ? ", on time" : ", late"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function sortByDue(reviews: ReviewItem[]) {
  return [...reviews].sort(
    (a, b) =>
      a.dueAt.localeCompare(b.dueAt) ||
      Number(b.source === "request") - Number(a.source === "request") ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

export default async function ReviewPage() {
  const user = await requireUser();
  const colleague = await getCurrentColleague();

  if (!colleague) {
    return (
      <>
        <PageHeader eyebrow="Your queue" title="Review" />
        <EmptyState
          title="No queue for this account"
          description="This account is not linked to a colleague. Log in with one of the demo accounts to see a queue."
        />
      </>
    );
  }

  const repository = getRepository();
  const [items, links, colleagues, mine, teamInbox, events] = await Promise.all(
    [
      repository.listItems(),
      repository.listLinks(),
      repository.listColleagues(),
      repository.listReviewItems({ assigneeId: colleague.id, status: "open" }),
      repository.listReviewItems({
        assigneeTeamId: colleague.teamId,
        status: "open",
      }),
      repository.listKarmaEvents(colleague.id),
    ],
  );

  const on = today();
  const context: Context = {
    on,
    items: new Map(items.map((item) => [item.id, item])),
    links: new Map(links.map((link) => [link.id, link])),
    colleagues: new Map(colleagues.map((person) => [person.id, person])),
    colleagueOptions: colleagues
      .filter(
        (person) => person.status === "active" && person.id !== colleague.id,
      )
      .map(({ id, name, jobTitle }) => ({ id, name, jobTitle })),
  };
  const summary = summarizeKarma(events, mine, on);
  const queue = sortByDue(mine);
  const inbox = sortByDue(teamInbox.filter((review) => !review.assigneeId));
  const team = await repository.listTeams();
  const teamName =
    team.find((entry) => entry.id === colleague.teamId)?.name ?? "your team";

  const documentOptions: DocumentOption[] = items
    .filter((item) => item.kind === "document" && item.status !== "retired")
    .map((item) => ({
      id: item.id,
      title: item.title,
      owner: item.ownerId
        ? (context.colleagues.get(item.ownerId)?.name ?? null)
        : null,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <>
      <PageHeader
        eyebrow="Your queue"
        title="Review"
        description="Documents you own that need a decision. Every decision takes one click and earns karma, with a bonus for deciding before the deadline."
      >
        <RequestReviewDialog documents={documentOptions} />
      </PageHeader>

      <KarmaPanel summary={summary} />

      <Tabs defaultValue="queue" className="mb-10 mt-10 gap-6">
        <TabsList
          variant="line"
          className="w-full justify-start gap-4 border-b pb-1"
        >
          <TabsTrigger value="queue" className="flex-none">
            To do
            <span className="text-muted-foreground tabular-nums">
              {queue.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex-none">
            Team inbox
            <span className="text-muted-foreground tabular-nums">
              {inbox.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-none">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          {queue.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {queue.map((review) => (
                <TaskRow
                  key={review.id}
                  review={review}
                  context={context}
                  mode="mine"
                  colleagueId={colleague.id}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title={
                summary.pointsToday > 0
                  ? `Queue clear. You earned ${summary.pointsToday} karma today.`
                  : "Nothing to decide"
              }
              description={
                inbox.length > 0
                  ? `Your documents are checked and have no open conflicts. ${teamName} has ${inbox.length} ${inbox.length === 1 ? "task" : "tasks"} nobody picked up yet.`
                  : "Your documents are checked and have no open conflicts."
              }
            />
          )}
        </TabsContent>

        <TabsContent value="team" className="flex flex-col gap-4">
          <p className="text-muted-foreground max-w-2xl text-sm">
            Tasks for {teamName} without a person: the document has no active
            owner and no successor. Pick one up to move it to your queue.
          </p>
          {inbox.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {inbox.map((review) => (
                <TaskRow
                  key={review.id}
                  review={review}
                  context={context}
                  mode="team"
                  colleagueId={colleague.id}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Team inbox is empty"
              description="Every task for your team has a person on it."
            />
          )}
        </TabsContent>

        <TabsContent value="history">
          <History events={events} />
        </TabsContent>
      </Tabs>

      <PageSection
        title="How karma works"
        description="Karma makes the invisible work of keeping knowledge right visible to you. It only goes up, only you see it, and there is no ranking."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead className="text-right">Decision</TableHead>
              <TableHead className="text-right">On time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviewKindSchema.options.map((kind) => (
              <TableRow key={kind}>
                <TableCell>{reviewKindLabels[kind]}</TableCell>
                <TableCell className="text-right tabular-nums">
                  +{basePoints[kind]}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  +{basePoints[kind] + Math.ceil(basePoints[kind] / 2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-muted-foreground max-w-2xl text-sm">
          A request from a colleague waiting on a call is due in two days and
          earns 5 extra when you make it. Handing a task on earns nothing,
          retiring or rejecting counts the same as confirming.
        </p>
      </PageSection>

      {user.role === "knowledge_manager" ? (
        <PageSection
          title="Periodic check"
          description="Puts a document in its owner's queue when the review date is within two weeks, when it was used in a customer answer since its last check, or when a conflict has nobody on it. Documents without an owner are skipped. In production this runs every night."
          action={<PeriodicCheckButton />}
        />
      ) : null}
    </>
  );
}
