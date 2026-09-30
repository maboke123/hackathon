// Parses the raw knowledge corpus into src/lib/data/seed/corpus.generated.json.
// Only reads what the source systems carry. The answer key is never used here.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const corpusDir = path.join(root, "src/lib/data/seed/knowledge");
const outFile = path.join(root, "src/lib/data/seed/corpus.generated.json");

type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  country: string;
  location: string;
  languages: string[];
  status: string;
  startDate: string;
  endDate?: string;
  successor?: string;
};

type Item = {
  id: string;
  kind: "document" | "email" | "call" | "meeting" | "chat" | "ticket";
  title: string;
  body: string;
  filePath: string;
  pdfPath: string | null;
  sourceSystem: string;
  location: string;
  language: string;
  country: string | null;
  customerId: string | null;
  teamId: string | null;
  jointCommittee: string | null;
  ownerId: string | null;
  authorId: string | null;
  createdAt: string;
  modifiedAt: string;
  modifiedById: string | null;
  lastCheckedAt: string | null;
  nextReviewAt: string | null;
  status: "active" | "draft";
};

type Link = {
  fromId: string;
  toId: string;
  type: "answered_with";
  reason: string;
};

const readJson = <T,>(file: string): T =>
  JSON.parse(readFileSync(path.join(corpusDir, file), "utf8")) as T;
const readText = (file: string) =>
  readFileSync(path.join(corpusDir, file), "utf8");
const list = (dir: string) =>
  readdirSync(path.join(corpusDir, dir))
    .sort()
    .map((name) => `${dir}/${name}`);
const itemId = (file: string) =>
  path.basename(file).split("-").slice(0, 2).join("-");

const people = readJson<Person[]>("people.json");
const customers = readJson<{ id: string; name: string }[]>("customers.json");

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const teamId = (name: string) => `team-${slug(name)}`;

const teams = [...new Set(people.map((person) => person.team))].map((name) => ({
  id: teamId(name),
  name,
}));

const colleagues = people.map((person) => ({
  id: person.id,
  name: person.name,
  email: person.email,
  jobTitle: person.role,
  teamId: teamId(person.team),
  country: person.country,
  location: person.location,
  languages: person.languages,
  status:
    person.status === "service-account" ? "service_account" : person.status,
  startDate: person.startDate,
  endDate: person.endDate ?? null,
  successorId: person.successor ?? null,
}));

const byEmail = (email: string | undefined) =>
  email
    ? (people.find(
        (person) => person.email.toLowerCase() === email.trim().toLowerCase(),
      ) ?? null)
    : null;
const nameIn = (text: string) =>
  people.find((person) => text.includes(person.name)) ?? null;
const emailIn = (text: string) => byEmail(text.match(/[\w.+-]+@[\w.-]+/)?.[0]);

const siteTeams: Record<string, string> = {
  "Legal-BE": "Legal knowledge centre Belgium",
  "Legal-NL": "Legal knowledge centre Netherlands",
  "CS-Belgium": "Customer service Belgium (SME)",
  "Enterprise-Accounts": "Enterprise accounts",
  "Payroll-ES": "Managed payroll Spain",
  "Reward-BE": "Reward products Belgium",
  "implementation-de": "Implementation Germany",
};
const siteCountries: Record<string, string> = {
  "Legal-BE": "BE",
  "CS-Belgium": "BE",
  "Staffing-BE": "BE",
  "Reward-BE": "BE",
  "Legal-NL": "NL",
  "Payroll-ES": "ES",
  "implementation-de": "DE",
};
const chatTeams: Record<string, string> = {
  "CS Belgium": "Customer service Belgium (SME)",
  "Legal Belgium": "Legal knowledge centre Belgium",
  "Veldra account team": "Enterprise accounts",
};

const stopwords: Record<string, string[]> = {
  nl: [
    "de",
    "het",
    "een",
    "en",
    "van",
    "voor",
    "niet",
    "wordt",
    "zijn",
    "dat",
    "je",
    "ik",
  ],
  fr: [
    "le",
    "la",
    "les",
    "des",
    "pour",
    "est",
    "une",
    "du",
    "et",
    "au",
    "vous",
  ],
  en: ["the", "and", "of", "for", "is", "to", "with", "you", "we", "this"],
  de: ["der", "die", "und", "das", "nicht", "mit", "für", "ist", "wir", "sie"],
  es: ["el", "los", "las", "del", "para", "que", "por", "con", "una", "se"],
};
function detectLanguage(text: string): string {
  const words = text.toLowerCase().split(/[^a-zà-ÿ]+/);
  let best = "en";
  let bestCount = 0;
  for (const [language, list] of Object.entries(stopwords)) {
    const set = new Set(list);
    const count = words.filter((word) => set.has(word)).length;
    if (count > bestCount) {
      best = language;
      bestCount = count;
    }
  }
  return best;
}

function detectCustomer(text: string): string | null {
  const found = customers.filter((customer) =>
    text.includes(customer.name.split(" ")[0] ?? customer.name),
  );
  return found.length === 1 ? (found[0]?.id ?? null) : null;
}

const months: Record<string, number> = {
  januari: 1,
  january: 1,
  janvier: 1,
  enero: 1,
  februari: 2,
  february: 2,
  février: 2,
  febrero: 2,
  maart: 3,
  march: 3,
  mars: 3,
  marzo: 3,
  april: 4,
  avril: 4,
  abril: 4,
  mei: 5,
  may: 5,
  mai: 5,
  mayo: 5,
  juni: 6,
  june: 6,
  juin: 6,
  junio: 6,
  juli: 7,
  july: 7,
  juillet: 7,
  julio: 7,
  augustus: 8,
  august: 8,
  août: 8,
  agosto: 8,
  september: 9,
  septembre: 9,
  septiembre: 9,
  oktober: 10,
  october: 10,
  octobre: 10,
  octubre: 10,
  november: 11,
  novembre: 11,
  noviembre: 11,
  december: 12,
  décembre: 12,
  diciembre: 12,
};
const pad = (value: number) => String(value).padStart(2, "0");

function parseDate(text: string): string | null {
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = text.match(/\b(\d{2})-(\d{2})-(\d{4})\b/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const long = text.match(/\b(\d{1,2}) ([a-zéû]+) (\d{4})\b/i);
  const longMonth = long ? months[long[2]?.toLowerCase() ?? ""] : undefined;
  if (long && longMonth)
    return `${long[3]}-${pad(longMonth)}-${pad(Number(long[1]))}`;
  const monthYear = text.match(/\b([a-zéû]+) (\d{4})\b/i);
  const month = monthYear
    ? months[monthYear[1]?.toLowerCase() ?? ""]
    : undefined;
  if (monthYear && month) return `${monthYear[2]}-${pad(month)}-01`;
  return null;
}

const latest = (dates: (string | null)[]) =>
  dates
    .filter((date): date is string => date !== null)
    .sort()
    .at(-1) ?? null;

function frontMatter(text: string): {
  meta: Record<string, string>;
  body: string;
} {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, body: text };
  const meta: Record<string, string> = {};
  for (const line of (match[1] ?? "").split("\n")) {
    const index = line.indexOf(":");
    if (index > 0) {
      meta[line.slice(0, index).trim()] = line
        .slice(index + 1)
        .trim()
        .replace(/^"(.*)"$/, "$1");
    }
  }
  return { meta, body: text.slice(match[0].length) };
}

const ownerPattern =
  /^(?:\|\s*)?(?:eigenaar|owner|responsable|account owner|sd worx owner|implementation lead)\s*[:|]/i;
const reviewPattern = /review|nagekeken|reviewed|revis|vérifi/i;

function parseDocument(
  file: string,
  meta: Record<string, string>,
  body: string,
): Item {
  const lines = body.split("\n");
  const ownerLine = lines.find((line) => ownerPattern.test(line.trim()));
  const owner = ownerLine ? nameIn(ownerLine) : null;
  const authorLine = lines.find((line) =>
    /author|auteur|door\s*\|/i.test(line),
  );
  const firstVersionRow = lines.find(
    (line) =>
      line.trim().startsWith("|") &&
      /\|\s*(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})\s*\|/.test(line) &&
      nameIn(line),
  );
  const author =
    (authorLine ? nameIn(authorLine) : null) ??
    (firstVersionRow ? nameIn(firstVersionRow) : null) ??
    byEmail(meta.modifiedBy);

  const tableChecks = lines
    .filter((line) => line.trim().startsWith("|"))
    .filter(
      (line) =>
        nameIn(line) ||
        reviewPattern.test(line) ||
        /^\|\s*\d+\.\d+\s*\|/.test(line.trim()),
    )
    .map((line) => {
      const cells = line.split("|").map((cell) => cell.trim());
      const dateCell = cells.find((cell) =>
        /^(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})$/.test(cell),
      );
      return dateCell ? parseDate(dateCell) : null;
    });
  const lineChecks = lines
    .map((line) =>
      line.match(
        /(?:last reviewed|laatst nagekeken|last (?:status )?update|dernière vérification|última revisión)\s*:?\s*([^.(\n]+)/i,
      ),
    )
    .map((match) => (match?.[1] ? parseDate(match[1]) : null));
  const nextReview = body.match(
    /(?:volgende review|next review)\s*:?\s*([^.\n]+)/i,
  );

  const location = meta.path ?? "";
  const site =
    location.match(/^\/sites\/([^/]+)/)?.[1] ??
    location.match(/^\/([^/]+)/)?.[1] ??
    "";
  const personal = location.startsWith("/personal/")
    ? byEmail(meta.modifiedBy)
    : null;
  const team = siteTeams[site] ?? personal?.team ?? null;
  const pdf = file.replace(/\.(md|csv)$/, ".pdf");

  return {
    id: itemId(file),
    kind: "document",
    title: meta.title ?? path.basename(file),
    body: body.trim(),
    filePath: file,
    pdfPath: existsSync(path.join(corpusDir, pdf)) ? pdf : null,
    sourceSystem: meta.source ?? "sharepoint",
    location,
    language: detectLanguage(body),
    country: siteCountries[site] ?? null,
    customerId: detectCustomer(location),
    teamId: team ? teamId(team) : null,
    jointCommittee:
      (meta.title ?? "").match(/\bPC\s?(\d{3}(?:\.\d{2})?)/)?.[1] ?? null,
    ownerId: owner?.id ?? null,
    authorId:
      author?.status === "service-account" ? null : (author?.id ?? null),
    createdAt: meta.created ?? "",
    modifiedAt: meta.modified ?? meta.created ?? "",
    modifiedById: byEmail(meta.modifiedBy)?.id ?? null,
    lastCheckedAt: latest([...tableChecks, ...lineChecks]),
    nextReviewAt: nextReview?.[1] ? parseDate(nextReview[1]) : null,
    status: /draft/i.test(`${meta.title} ${location}`) ? "draft" : "active",
  };
}

function headers(text: string): { head: Record<string, string>; body: string } {
  const [headPart = "", ...rest] = text.split(/\r?\n\r?\n/);
  const head: Record<string, string> = {};
  for (const line of headPart.split(/\r?\n/)) {
    const index = line.indexOf(":");
    if (index > 0)
      head[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return { head, body: rest.join("\n\n").trim() };
}

function recordItem(
  file: string,
  kind: Item["kind"],
  fields: Partial<Item> & Pick<Item, "title" | "body" | "createdAt">,
): Item {
  return {
    id: itemId(file),
    kind,
    filePath: file,
    pdfPath: null,
    sourceSystem: "",
    location: "",
    language: detectLanguage(fields.body),
    country: null,
    customerId: detectCustomer(`${fields.title}\n${fields.body}`),
    teamId: null,
    jointCommittee: null,
    ownerId: null,
    authorId: null,
    modifiedAt: fields.createdAt,
    modifiedById: null,
    lastCheckedAt: null,
    nextReviewAt: null,
    status: "active",
    ...fields,
  };
}

const personTeam = (person: Person | null) =>
  person ? teamId(person.team) : null;

const items: Item[] = [];
const links: Link[] = [];

for (const file of list("documents")) {
  if (file.endsWith(".md")) {
    const { meta, body } = frontMatter(readText(file));
    items.push(parseDocument(file, meta, body));
  } else if (file.endsWith(".csv")) {
    const meta = readJson<Record<string, string>>(
      file.replace(".csv", ".meta.json"),
    );
    items.push(parseDocument(file, meta, readText(file)));
  }
}

for (const file of list("emails")) {
  const { head, body } = headers(readText(file));
  const from = emailIn(head.From ?? "");
  items.push(
    recordItem(file, "email", {
      title: head.Subject ?? path.basename(file),
      body,
      sourceSystem: "outlook",
      location: `From ${head.From} to ${head.To}`,
      createdAt: new Date(head.Date ?? "").toISOString(),
      authorId: from?.id ?? null,
      teamId: personTeam(from),
    }),
  );
}

for (const file of list("calls")) {
  const { head, body } = headers(readText(file));
  const agent = emailIn(head.Agent ?? "");
  const caller = head.Caller?.match(/\(([^)]+)\)/)?.[1] ?? "unknown caller";
  items.push(
    recordItem(file, "call", {
      title: `Call with ${caller}, ${head.Queue}`,
      body,
      sourceSystem: "telephony",
      location: head.Queue ?? "",
      createdAt: head.Started ?? "",
      authorId: agent?.id ?? null,
      teamId: personTeam(agent),
    }),
  );
}

for (const file of list("meetings")) {
  const text = readText(file);
  const note = text.match(/NOTE\n([\s\S]*?)\n\n/)?.[1] ?? "";
  const field = (name: string) =>
    note.match(new RegExp(`^${name}: (.*)$`, "m"))?.[1] ?? "";
  const organiser = emailIn(field("Organiser"));
  const body = [...text.matchAll(/<v ([^>]+)>([\s\S]*?)<\/v>/g)]
    .map((match) => `${match[1]}: ${match[2]?.trim()}`)
    .join("\n");
  const date = field("Date").match(/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  items.push(
    recordItem(file, "meeting", {
      title: field("Meeting"),
      body,
      sourceSystem: "teams",
      location: `Teams meeting, ${field("Attendees")}`,
      createdAt: date ? `${date[1]}T${date[2]}:00+02:00` : "",
      authorId: organiser?.id ?? null,
      teamId: personTeam(organiser),
    }),
  );
}

type Chat = {
  team: string | null;
  channel: string;
  messages: {
    from: { name: string; email: string };
    createdAt: string;
    body: string;
  }[];
};
for (const file of list("chats")) {
  const chat = readJson<Chat>(file);
  const first = chat.messages[0];
  const team = chat.team ? chatTeams[chat.team] : null;
  items.push(
    recordItem(file, "chat", {
      title: chat.team
        ? `${chat.team}, ${chat.channel}`
        : `Chat between ${chat.channel}`,
      body: chat.messages
        .map(
          (message) =>
            `${message.from.name} (${message.createdAt.slice(0, 16).replace("T", " ")}): ${message.body}`,
        )
        .join("\n"),
      sourceSystem: "teams",
      location: chat.team ? `${chat.team} / ${chat.channel}` : "Direct message",
      createdAt: first?.createdAt ?? "",
      modifiedAt: chat.messages.at(-1)?.createdAt ?? "",
      authorId: byEmail(first?.from.email)?.id ?? null,
      teamId: team ? teamId(team) : personTeam(byEmail(first?.from.email)),
    }),
  );
}

type Ticket = {
  id: string;
  createdAt: string;
  channel: string;
  customer: string;
  requester: string;
  assignee: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  resolvedAt: string | null;
  resolution: string | null;
  linkedDocuments: string[];
  linkedCall: string | null;
};
for (const ticket of readJson<{ tickets: Ticket[] }>("tickets.json").tickets) {
  const id = ticket.id;
  const assignee = byEmail(ticket.assignee);
  items.push({
    ...recordItem(`${id}.json`, "ticket", {
      title: ticket.subject,
      body: [
        `Customer: ${ticket.customer}, ${ticket.requester}`,
        `Category: ${ticket.category}. Channel: ${ticket.channel}. Status: ${ticket.status}.`,
        ticket.description,
        ticket.resolution ? `Resolution: ${ticket.resolution}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      sourceSystem: "service_desk",
      location: ticket.id,
      createdAt: ticket.createdAt,
      modifiedAt: ticket.resolvedAt ?? ticket.createdAt,
      authorId: assignee?.id ?? null,
      teamId: personTeam(assignee),
      customerId: detectCustomer(ticket.customer),
    }),
    id,
    filePath: "tickets.json",
  });
  for (const documentPath of ticket.linkedDocuments) {
    const document = items.find((item) => item.location === documentPath);
    if (document) {
      links.push({
        fromId: id,
        toId: document.id,
        type: "answered_with",
        reason: "The answer to the customer relied on this document.",
      });
    }
  }
}

type AgentQuery = {
  id: string;
  askedAt: string;
  askedBy: string;
  question: string;
  results: {
    title: string;
    path: string;
    snippet: string;
    score: number;
    modified: string;
    modifiedBy: string;
  }[];
  answer: string;
  feedback: string | null;
};
const agentQueries = readJson<{ queries: AgentQuery[] }>(
  "agent-log.json",
).queries.map((query) => ({
  ...query,
  askedById: byEmail(query.askedBy)?.id ?? null,
  results: query.results.map((result) => ({
    ...result,
    itemId: items.find((item) => item.location === result.path)?.id ?? null,
  })),
}));

type RawCustomer = {
  id: string;
  name: string;
  segment: string;
  since?: string;
  headquarters?: string;
  countries?: string[];
  note?: string;
  contacts?: { name: string; role: string; email: string }[];
  entities?: { country: string; entity: string }[];
};
const customerRecords = readJson<RawCustomer[]>("customers.json").map(
  (customer) => ({
    id: customer.id,
    name: customer.name,
    segment: customer.segment,
    since: customer.since ?? null,
    headquarters: customer.headquarters ?? null,
    countries:
      customer.countries ??
      (customer.entities ?? []).map((entity) => entity.country),
    note: customer.note ?? null,
    contacts: customer.contacts ?? [],
    entities: customer.entities ?? [],
  }),
);

const corpus = {
  teams,
  colleagues,
  customers: customerRecords,
  items,
  links,
  agentQueries,
};
writeFileSync(outFile, `${JSON.stringify(corpus, null, 2)}\n`);
console.info(
  `Wrote ${items.length} items, ${links.length} links, ${colleagues.length} colleagues, ${teams.length} teams, ${agentQueries.length} agent queries.`,
);
