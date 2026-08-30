import { z } from "zod";

const legalDocumentSchema = z.object({
  content: z.string().trim().min(100).max(20000),
  documentType: z.enum(["COOKIE_NOTICE", "PRIVACY_NOTICE", "TERMS_OF_USE"]),
  effectiveAt: z.iso.date(),
  summary: z.string().trim().min(10).max(500),
  title: z.string().trim().min(5).max(160),
  version: z.string().trim().min(3).max(40),
});

const approvalReferenceSchema = z.string().trim().min(3).max(240);

export function parseLegalDocumentInput(formData: FormData): z.ZodSafeParseResult<z.infer<typeof legalDocumentSchema>> {
  return legalDocumentSchema.safeParse({
    content: formData.get("content"),
    documentType: formData.get("documentType"),
    effectiveAt: formData.get("effectiveAt"),
    summary: formData.get("summary"),
    title: formData.get("title"),
    version: formData.get("version"),
  });
}

export function parseApprovalReference(formData: FormData): z.ZodSafeParseResult<string> {
  return approvalReferenceSchema.safeParse(formData.get("approvalReference"));
}
