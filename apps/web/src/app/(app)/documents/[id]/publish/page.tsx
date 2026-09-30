import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DocumentBody } from "@/components/document-body";
import { PageHeader, PageSection } from "@/components/page-header";
import { getCurrentColleague, requireUser } from "@/lib/auth/session";
import {
  countryLabels,
  documentTypeLabels,
  getRepository,
  languageLabels,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import { allowedRelations, canManageUpload, findRelated } from "@/lib/upload";
import { isReadableDiff, wordDiff } from "@/lib/word-diff";
import { type LabelField, LabelsForm } from "./labels-form";
import { PublishForm, type RelatedView } from "./publish-form";

export const metadata: Metadata = {
  title: "Check and publish",
};

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

export default async function PublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const colleague = await getCurrentColleague();
  const { id } = await params;
  const repository = getRepository();
  const item = await repository.getItem(id);
  if (!item || !canManageUpload(item, colleague, user.role)) notFound();
  if (item.status !== "draft") redirect(`/documents/${item.id}`);

  const [colleagues, teams, customers, related] = await Promise.all([
    repository.listColleagues(),
    repository.listTeams(),
    repository.listCustomers(),
    findRelated(item),
  ]);
  const people = new Map(colleagues.map((person) => [person.id, person]));
  const suggested = item.labelStatus !== "labelled";
  const guessed = (found: boolean, reason: string) =>
    found
      ? suggested
        ? reason
        : "Confirmed by you."
      : "Could not tell from the text. Pick one.";

  const fields: LabelField[] = [
    {
      name: "title",
      label: "Title",
      value: item.title,
      options: null,
      hint: "Taken from the first heading of the file.",
    },
    {
      name: "subject",
      label: "Topic",
      value: item.subject,
      options: null,
      hint: guessed(
        item.subject !== item.title,
        "Recognised from the title and the first paragraphs.",
      ),
    },
    {
      name: "ownerId",
      label: "Owner",
      value: item.ownerId ?? "",
      options: colleagues
        .filter((person) => person.status === "active")
        .map((person) => ({ value: person.id, label: person.name })),
      hint: suggested
        ? "You uploaded it. Pick someone else if they will keep it correct."
        : "Confirmed by you.",
    },
    {
      name: "teamId",
      label: "Team",
      value: item.teamId ?? "",
      options: teams.map((team) => ({ value: team.id, label: team.name })),
      hint: guessed(Boolean(item.teamId), "The owner's team."),
    },
    {
      name: "country",
      label: "Country",
      value: item.country ?? "",
      options: [
        { value: "", label: "All countries" },
        ...toOptions(countryLabels),
      ],
      hint: guessed(
        Boolean(item.country),
        "From the team and the countries named in the text.",
      ),
    },
    {
      name: "customerId",
      label: "Customer",
      value: item.customerId ?? "",
      options: [
        { value: "", label: "All customers" },
        ...customers.map((customer) => ({
          value: customer.id,
          label: customer.name,
        })),
      ],
      hint: item.customerId
        ? "The text names this customer."
        : "No customer named, so it applies to every customer.",
    },
    {
      name: "documentType",
      label: "Type",
      value: item.documentType,
      options: toOptions(documentTypeLabels),
      hint: suggested ? "From the owning team." : "Confirmed by you.",
    },
    {
      name: "language",
      label: "Language",
      value: item.language,
      options: toOptions(languageLabels),
      hint: suggested
        ? "Detected from common words in the text."
        : "Confirmed by you.",
    },
  ];

  const views: RelatedView[] = related.map((entry) => {
    const owner = entry.owner;
    const asked =
      owner?.status === "active"
        ? owner
        : owner?.successorId
          ? people.get(owner.successorId)
          : undefined;
    const diff = entry.conflict
      ? wordDiff(entry.conflict.theirs, entry.conflict.mine)
      : null;
    return {
      id: entry.item.id,
      title: entry.item.title,
      ownerName: asked?.status === "active" ? asked.name : null,
      meta: [
        owner
          ? `Owner ${owner.name}${owner.status === "active" ? "" : " (left)"}`
          : "No owner",
        entry.item.lastCheckedAt
          ? `checked ${formatDate(entry.item.lastCheckedAt)}`
          : "never checked",
        entry.item.country
          ? countryLabels[entry.item.country]
          : "all countries",
        entry.item.status === "draft" ? "draft" : null,
      ]
        .filter(Boolean)
        .join(", "),
      reason: entry.reason,
      suggestion: entry.suggestion,
      allowed: allowedRelations(entry),
      conflict: entry.conflict
        ? {
            ...entry.conflict,
            diff: diff && isReadableDiff(diff) ? diff : null,
          }
        : null,
    };
  });
  return (
    <>
      <PageHeader
        eyebrow="Step 2 of 3, draft"
        title={item.title}
        description="Check the labels, settle the conflicts and link it to what is already there. Only you can see this draft until you publish."
      />

      <PageSection
        title="Labels"
        description={
          suggested
            ? "Suggested from the text, the file name and your team. Correct what is wrong and save, related documents are then checked again."
            : "Saved. Related documents below use these labels."
        }
      >
        <LabelsForm itemId={item.id} fields={fields} />
      </PageSection>

      <PublishForm itemId={item.id} related={views} />

      <PageSection title="Text" description={item.location}>
        <div className="max-h-[32rem] overflow-y-auto rounded-lg border p-6">
          <DocumentBody
            body={item.body}
            passage={null}
            scrollToPassage={false}
          />
        </div>
      </PageSection>
    </>
  );
}
