import type { Database } from "@/types/database.generated";

export type LegalDocumentType = Database["public"]["Enums"]["legal_document_type"];
export type LegalDocumentStatus = Database["public"]["Enums"]["legal_document_status"];
export type LegalReviewStatus = Database["public"]["Enums"]["legal_review_status"];

export type LegalDocument = Readonly<{
  content: string;
  documentType: LegalDocumentType;
  effectiveAt: string | null;
  id: string;
  isCurrent: boolean;
  publishedAt: string | null;
  reviewStatus: LegalReviewStatus;
  status: LegalDocumentStatus;
  summary: string;
  title: string;
  version: string;
}>;

export type RequiredLegalDocuments = Readonly<{
  privacy: LegalDocument;
  terms: LegalDocument;
}>;

export type LegalAcceptance = Readonly<{
  acceptedAt: string;
  documentId: string;
  source: Database["public"]["Enums"]["legal_acceptance_source"];
}>;

export const legalDocumentTypeLabels: Readonly<Record<LegalDocumentType, string>> = {
  COOKIE_NOTICE: "Cookies",
  PRIVACY_NOTICE: "Privacidad",
  TERMS_OF_USE: "Términos de uso",
};

export const legalReviewStatusLabels: Readonly<Record<LegalReviewStatus, string>> = {
  APPROVED: "Aprobado",
  PENDING_REVIEW: "Revisión pendiente",
};
