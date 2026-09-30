import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/session";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = {
  title: "Add a document",
};

export default async function NewDocumentPage() {
  await requireUser();

  return (
    <>
      <PageHeader
        eyebrow="Step 1 of 3"
        title="Add a document"
        description="We label it, compare it with every document on the same topic and flag values that disagree. You decide how it relates before anyone else sees it."
      />
      <UploadForm />
    </>
  );
}
