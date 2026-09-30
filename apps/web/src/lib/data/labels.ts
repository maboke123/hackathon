import type {
  ColleagueStatus,
  ItemKind,
  ItemStatus,
  Language,
  LinkStatus,
  LinkType,
  ReviewKind,
  SourceSystem,
} from "./types";

export const itemKindLabels: Record<ItemKind, string> = {
  document: "Document",
  email: "Email",
  call: "Call",
  meeting: "Meeting",
  chat: "Chat",
  ticket: "Ticket",
  answer: "Answer",
};

export const sourceSystemLabels: Record<SourceSystem, string> = {
  sharepoint: "SharePoint",
  onedrive: "OneDrive",
  wiki: "Wiki",
  outlook: "Outlook",
  teams: "Teams",
  telephony: "Phone",
  service_desk: "Service desk",
};

export const itemStatusLabels: Record<ItemStatus, string> = {
  active: "Active",
  draft: "Draft",
  retired: "Retired",
};

export const languageLabels: Record<Language, string> = {
  nl: "Dutch",
  fr: "French",
  en: "English",
  de: "German",
  es: "Spanish",
};

export const linkTypeLabels: Record<LinkType, string> = {
  supersedes: "Replaces",
  contradicts: "Contradicts",
  variant_of: "Variant of",
  duplicate_of: "Copy of",
  supports: "Supports",
  based_on: "Based on",
  answered_with: "Answered with",
};

export const linkStatusLabels: Record<LinkStatus, string> = {
  suggested: "Suggested",
  confirmed: "Confirmed",
  rejected: "Rejected",
};

export const reviewKindLabels: Record<ReviewKind, string> = {
  conflict: "Conflict",
  parent_changed: "Parent changed",
  stale: "Not checked",
  no_owner: "No owner",
  suggested_link: "Suggested link",
  suggested_label: "Suggested label",
};

export const colleagueStatusLabels: Record<ColleagueStatus, string> = {
  active: "Active",
  left: "Left",
  service_account: "Service account",
};
