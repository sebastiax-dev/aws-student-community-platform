"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAuthenticatedUserId } from "@/features/auth/session";
import { executeEventQuery } from "@/features/events/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const profileNameSchema = z.string().trim().min(2).max(80);

export async function updateDashboardProfileAction(formData: FormData): Promise<never> {
  const userId = await getAuthenticatedUserId();
  if (userId === null) {
    redirect("/login?next=/dashboard/perfil");
  }

  const parsedDisplayName = profileNameSchema.safeParse(formData.get("displayName"));
  if (!parsedDisplayName.success) {
    redirect("/dashboard/perfil?error=invalid_display_name");
  }

  const supabase = await createSupabaseServerClient();
  await executeEventQuery("updateDashboardProfile", () => supabase
    .from("profiles")
    .update({ display_name: parsedDisplayName.data })
    .eq("id", userId)
    .select("id")
    .single());
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/perfil");
  redirect("/dashboard/perfil?status=updated");
}
