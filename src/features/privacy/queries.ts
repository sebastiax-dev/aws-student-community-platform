import { executePrivacyQuery, requirePrivacyQueryData } from "@/features/privacy/request";
import type { LegalAcceptance, LegalDocument, LegalDocumentType, RequiredLegalDocuments } from "@/features/privacy/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";

type LegalDocumentRow = Database["public"]["Tables"]["legal_documents"]["Row"];
type LegalDocumentSelection = Pick<LegalDocumentRow,
  | "content"
  | "document_type"
  | "effective_at"
  | "id"
  | "is_current"
  | "published_at"
  | "review_status"
  | "status"
  | "summary"
  | "title"
  | "version"
>;

const legalDocumentSelection = "content, document_type, effective_at, id, is_current, published_at, review_status, status, summary, title, version" as const;

function toLegalDocument(row: LegalDocumentSelection): LegalDocument {
  return {
    content: row.content,
    documentType: row.document_type,
    effectiveAt: row.effective_at,
    id: row.id,
    isCurrent: row.is_current,
    publishedAt: row.published_at,
    reviewStatus: row.review_status,
    status: row.status,
    summary: row.summary,
    title: row.title,
    version: row.version,
  };
}

export async function getCurrentLegalDocument(documentType: LegalDocumentType): Promise<LegalDocument | null> {
  const supabase = await createSupabaseServerClient();
  const result = await executePrivacyQuery("getCurrentLegalDocument", () => supabase
    .from("legal_documents")
    .select(legalDocumentSelection)
    .eq("document_type", documentType)
    .eq("is_current", true)
    .eq("status", "PUBLISHED")
    .maybeSingle());

  return result.data === null ? null : toLegalDocument(result.data);
}

export async function getCurrentRequiredLegalDocuments(): Promise<RequiredLegalDocuments | null> {
  const supabase = await createSupabaseServerClient();
  const result = await executePrivacyQuery("getCurrentRequiredLegalDocuments", () => supabase
    .from("legal_documents")
    .select(legalDocumentSelection)
    .in("document_type", ["PRIVACY_NOTICE", "TERMS_OF_USE"])
    .eq("is_current", true)
    .eq("status", "PUBLISHED"));
  const documents = requirePrivacyQueryData("getCurrentRequiredLegalDocuments", result.data).map(toLegalDocument);
  const privacy = documents.find((document) => document.documentType === "PRIVACY_NOTICE") ?? null;
  const terms = documents.find((document) => document.documentType === "TERMS_OF_USE") ?? null;
  return privacy === null || terms === null ? null : { privacy, terms };
}

export async function listAdminLegalDocuments(): Promise<readonly LegalDocument[]> {
  const supabase = await createSupabaseServerClient();
  const result = await executePrivacyQuery("listAdminLegalDocuments", () => supabase
    .from("legal_documents")
    .select(legalDocumentSelection)
    .order("document_type")
    .order("effective_at", { ascending: false }));
  return requirePrivacyQueryData("listAdminLegalDocuments", result.data).map(toLegalDocument);
}

export async function listOwnLegalAcceptances(userId: string): Promise<readonly LegalAcceptance[]> {
  const supabase = await createSupabaseServerClient();
  const result = await executePrivacyQuery("listOwnLegalAcceptances", () => supabase
    .from("user_legal_acceptances")
    .select("accepted_at, legal_document_id, source")
    .eq("user_id", userId)
    .order("accepted_at", { ascending: false }));
  return requirePrivacyQueryData("listOwnLegalAcceptances", result.data).map((row) => ({ acceptedAt: row.accepted_at, documentId: row.legal_document_id, source: row.source }));
}
