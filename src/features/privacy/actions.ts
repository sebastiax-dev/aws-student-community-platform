"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthorizationError } from "@/features/auth/errors";
import { getAdminUserId, getAuthenticatedUserId } from "@/features/auth/session";
import { executePrivacyQuery } from "@/features/privacy/request";
import { parseApprovalReference, parseLegalDocumentInput } from "@/features/privacy/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const documentIdSchema = z.uuid();

async function requireAdmin(operation: string): Promise<string> {
  const userId = await getAdminUserId();
  if (userId === null) {
    throw new AuthorizationError(operation, "ADMIN");
  }
  return userId;
}

function revalidateLegalPaths(): void {
  revalidatePath("/cookies");
  revalidatePath("/privacidad");
  revalidatePath("/registro");
  revalidatePath("/terminos");
  revalidatePath("/dashboard/privacidad");
  revalidatePath("/dashboard/admin/legal");
}

export async function createLegalDocumentAction(formData: FormData): Promise<never> {
  const parsedInput = parseLegalDocumentInput(formData);
  if (!parsedInput.success) {
    redirect("/dashboard/admin/legal?error=invalid_document");
  }

  await requireAdmin("createLegalDocument");
  const supabase = await createSupabaseServerClient();
  await executePrivacyQuery("createLegalDocument", () => supabase.rpc("create_legal_document", {
    p_content: parsedInput.data.content,
    p_document_type: parsedInput.data.documentType,
    p_effective_at: new Date(`${parsedInput.data.effectiveAt}T00:00:00Z`).toISOString(),
    p_summary: parsedInput.data.summary,
    p_title: parsedInput.data.title,
    p_version: parsedInput.data.version,
  }));

  revalidateLegalPaths();
  redirect("/dashboard/admin/legal?status=draft_created");
}

export async function approveAndPublishLegalDocumentAction(documentId: string, formData: FormData): Promise<never> {
  const parsedDocumentId = documentIdSchema.safeParse(documentId);
  const parsedApprovalReference = parseApprovalReference(formData);
  if (!parsedDocumentId.success || !parsedApprovalReference.success) {
    redirect("/dashboard/admin/legal?error=invalid_approval");
  }

  await requireAdmin("approveAndPublishLegalDocument");
  const supabase = await createSupabaseServerClient();
  await executePrivacyQuery("approveAndPublishLegalDocument", () => supabase.rpc("approve_and_publish_legal_document", {
    p_approval_reference: parsedApprovalReference.data,
    p_document_id: parsedDocumentId.data,
  }));

  revalidateLegalPaths();
  redirect("/dashboard/admin/legal?status=document_published");
}

export async function acceptCurrentLegalDocumentsAction(): Promise<never> {
  const userId = await getAuthenticatedUserId();
  if (userId === null) {
    redirect("/login?next=/dashboard/privacidad");
  }

  const supabase = await createSupabaseServerClient();
  await executePrivacyQuery("acceptCurrentLegalDocuments", () => supabase.rpc("accept_current_legal_documents"));
  revalidatePath("/dashboard/privacidad");
  redirect("/dashboard/privacidad?status=accepted");
}
