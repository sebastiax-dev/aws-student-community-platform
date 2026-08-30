"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AuthorizationError } from "@/features/auth/errors";
import { getAdminUserId } from "@/features/auth/session";
import { AdminMediaValidationError, deleteSiteImage, parseOptionalSiteImage, uploadSiteImage } from "@/features/admin/media";
import { executeAdminQuery } from "@/features/admin/request";
import { attendanceSchema, brandingContentSchema, certificationTotalSchema, communityContentSchema, contactContentSchema, footerContentSchema, homeContentSchema, identifierSchema, pointAdjustmentSchema, roleSchema, socialLinkSchema, teamMemberSchema } from "@/features/admin/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.generated";

async function requireAdmin(operation: string): Promise<string> {
  const adminUserId = await getAdminUserId();
  if (adminUserId === null) {
    throw new AuthorizationError(operation, "ADMIN");
  }
  return adminUserId;
}

function requireIdentifier(value: string, operation: string): string {
  const result = identifierSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid UUID supplied to admin operation: operation=${operation}, identifier=${value}`);
  }
  return result.data;
}

async function updateSetting(key: "branding" | "community" | "contact" | "footer" | "home", value: Json, operation: string): Promise<void> {
  const adminUserId = await requireAdmin(operation);
  const supabase = await createSupabaseServerClient();
  await executeAdminQuery(operation, () => supabase
    .from("site_settings")
    .update({ updated_by: adminUserId, value })
    .eq("key", key)
    .select("key")
    .single());
}

function parseSiteImageOrRedirect(formData: FormData, fieldName: string, errorPath: string): File | null {
  try {
    return parseOptionalSiteImage(formData, fieldName);
  } catch (error) {
    if (error instanceof AdminMediaValidationError) {
      redirect(`${errorPath}?error=invalid_image`);
    }
    throw error;
  }
}

async function removeUploadedSiteImageAfterFailure(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, imagePath: string | null, error: unknown): Promise<never> {
  if (imagePath === null) {
    throw error;
  }
  try {
    await deleteSiteImage(supabase, imagePath);
  } catch (cleanupError) {
    throw new AggregateError([error, cleanupError], `Site media update and cleanup both failed: path=${imagePath}`);
  }
  throw error;
}

export async function updateHomeContentAction(formData: FormData): Promise<never> {
  const result = homeContentSchema.safeParse({
    description: formData.get("description"),
    eyebrow: formData.get("eyebrow"),
    primaryCtaHref: formData.get("primaryCtaHref"),
    primaryCtaLabel: formData.get("primaryCtaLabel"),
    secondaryCtaHref: formData.get("secondaryCtaHref"),
    secondaryCtaLabel: formData.get("secondaryCtaLabel"),
    titleAccent: formData.get("titleAccent"),
    titleLead: formData.get("titleLead"),
    titleSuffix: formData.get("titleSuffix"),
  });
  if (!result.success) {
    redirect("/dashboard/admin/contenido?error=invalid_home");
  }
  await updateSetting("home", result.data, "updateHomeContent");
  revalidatePath("/");
  redirect("/dashboard/admin/contenido?status=home_updated");
}

export async function updateInstitutionalContentAction(formData: FormData): Promise<never> {
  const communityResult = communityContentSchema.safeParse({
    activeMembers: formData.get("activeMembers"),
    certificatesIssued: formData.get("certificatesIssued"),
    description: formData.get("communityDescription"),
    eventsPerCycle: formData.get("eventsPerCycle"),
    projectsDeveloped: formData.get("projectsDeveloped"),
    title: formData.get("communityTitle"),
  });
  const footerResult = footerContentSchema.safeParse({ institutionalName: formData.get("institutionalName"), tagline: formData.get("tagline") });
  if (!communityResult.success || !footerResult.success) {
    redirect("/dashboard/admin/contenido?error=invalid_institutional");
  }
  await updateSetting("community", communityResult.data, "updateCommunityContent");
  await updateSetting("footer", footerResult.data, "updateFooterContent");
  revalidatePath("/");
  revalidatePath("/eventos");
  redirect("/dashboard/admin/contenido?status=institutional_updated");
}

export async function updateContactContentAction(formData: FormData): Promise<never> {
  const result = contactContentSchema.safeParse({
    generalEmail: formData.get("generalEmail"),
    location: formData.get("location"),
    officeHours: formData.get("officeHours"),
    phone: formData.get("phone"),
    privacyEmail: formData.get("privacyEmail"),
    whatsapp: formData.get("whatsapp"),
  });
  if (!result.success) {
    redirect("/dashboard/admin/contacto?error=invalid_contact");
  }
  await updateSetting("contact", result.data, "updateContactContent");
  revalidatePath("/", "layout");
  redirect("/dashboard/admin/contacto?status=contact_updated");
}

export async function updateFooterContentAction(formData: FormData): Promise<never> {
  const result = footerContentSchema.safeParse({
    institutionalName: formData.get("institutionalName"),
    tagline: formData.get("tagline"),
  });
  if (!result.success) {
    redirect("/dashboard/admin/contacto?error=invalid_institutional");
  }
  await updateSetting("footer", result.data, "updateFooterContent");
  revalidatePath("/", "layout");
  redirect("/dashboard/admin/contacto?status=institutional_updated");
}

export async function updateBrandingAction(formData: FormData): Promise<never> {
  const errorPath = "/dashboard/admin/contenido";
  const image = parseSiteImageOrRedirect(formData, "logoImage", errorPath);
  const removeLogo = formData.get("removeLogo") === "on";
  if (image !== null && removeLogo) {
    redirect(`${errorPath}?error=conflicting_logo_change`);
  }

  const adminUserId = await requireAdmin("updateBranding");
  const supabase = await createSupabaseServerClient();
  const currentResult = await executeAdminQuery("getBrandingBeforeUpdate", () => supabase
    .from("site_settings")
    .select("value")
    .eq("key", "branding")
    .single());
  if (currentResult.data === null) {
    throw new Error("Branding configuration is missing from site_settings.");
  }
  const currentBranding = brandingContentSchema.parse(currentResult.data.value);
  const brandNameResult = brandingContentSchema.shape.brandName.safeParse(formData.get("brandName"));
  if (!brandNameResult.success) {
    redirect(`${errorPath}?error=invalid_branding`);
  }
  const newImagePath = image === null ? (removeLogo ? "" : currentBranding.logoImagePath) : await uploadSiteImage(supabase, "branding", "logo", image);

  try {
    await executeAdminQuery("updateBranding", () => supabase
      .from("site_settings")
      .update({ updated_by: adminUserId, value: { brandName: brandNameResult.data, logoImagePath: newImagePath } })
      .eq("key", "branding")
      .select("key")
      .single());
  } catch (error) {
    await removeUploadedSiteImageAfterFailure(supabase, image === null ? null : newImagePath, error);
  }

  if (currentBranding.logoImagePath.length > 0 && currentBranding.logoImagePath !== newImagePath) {
    await deleteSiteImage(supabase, currentBranding.logoImagePath);
  }
  revalidatePath("/", "layout");
  redirect("/dashboard/admin/contenido?status=branding_updated");
}

function parseSocialLink(formData: FormData): ReturnType<typeof socialLinkSchema.safeParse> {
  return socialLinkSchema.safeParse({
    active: formData.get("active") === "on",
    icon: formData.get("icon"),
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder"),
    url: formData.get("url"),
  });
}

export async function createSocialLinkAction(formData: FormData): Promise<never> {
  const result = parseSocialLink(formData);
  if (!result.success) {
    redirect("/dashboard/admin/contacto?error=invalid_social");
  }
  const image = parseSiteImageOrRedirect(formData, "iconImage", "/dashboard/admin/contacto");
  const adminUserId = await requireAdmin("createSocialLink");
  const supabase = await createSupabaseServerClient();
  const socialLinkId = crypto.randomUUID();
  const imagePath = image === null ? null : await uploadSiteImage(supabase, "social-icons", socialLinkId, image);
  try {
    await executeAdminQuery("createSocialLink", () => supabase.from("social_links").insert({
      active: result.data.active,
      icon: result.data.icon,
      icon_image_path: imagePath,
      id: socialLinkId,
      name: result.data.name,
      sort_order: result.data.sortOrder,
      updated_by: adminUserId,
      url: result.data.url,
    }));
  } catch (error) {
    await removeUploadedSiteImageAfterFailure(supabase, imagePath, error);
  }
  revalidatePath("/", "layout");
  redirect("/dashboard/admin/contacto?status=social_created");
}

export async function updateSocialLinkAction(socialLinkId: string, formData: FormData): Promise<never> {
  const id = requireIdentifier(socialLinkId, "updateSocialLink");
  const result = parseSocialLink(formData);
  if (!result.success) {
    redirect("/dashboard/admin/contacto?error=invalid_social");
  }
  const image = parseSiteImageOrRedirect(formData, "iconImage", "/dashboard/admin/contacto");
  const adminUserId = await requireAdmin("updateSocialLink");
  const supabase = await createSupabaseServerClient();
  const currentResult = await executeAdminQuery("getSocialLinkBeforeUpdate", () => supabase
    .from("social_links")
    .select("icon_image_path")
    .eq("id", id)
    .single());
  if (currentResult.data === null) {
    throw new Error(`Social link does not exist: id=${id}`);
  }
  const newImagePath = image === null ? currentResult.data.icon_image_path : await uploadSiteImage(supabase, "social-icons", id, image);
  try {
    await executeAdminQuery("updateSocialLink", () => supabase.from("social_links").update({
      active: result.data.active,
      icon: result.data.icon,
      icon_image_path: newImagePath,
      name: result.data.name,
      sort_order: result.data.sortOrder,
      updated_by: adminUserId,
      url: result.data.url,
    }).eq("id", id));
  } catch (error) {
    await removeUploadedSiteImageAfterFailure(supabase, image === null ? null : newImagePath, error);
  }
  if (image !== null && currentResult.data.icon_image_path !== null) {
    await deleteSiteImage(supabase, currentResult.data.icon_image_path);
  }
  revalidatePath("/", "layout");
  redirect("/dashboard/admin/contacto?status=social_updated");
}

export async function deleteSocialLinkAction(socialLinkId: string): Promise<never> {
  const id = requireIdentifier(socialLinkId, "deleteSocialLink");
  await requireAdmin("deleteSocialLink");
  const supabase = await createSupabaseServerClient();
  const currentResult = await executeAdminQuery("getSocialLinkBeforeDelete", () => supabase
    .from("social_links")
    .select("icon_image_path")
    .eq("id", id)
    .single());
  if (currentResult.data === null) {
    throw new Error(`Social link does not exist: id=${id}`);
  }
  await executeAdminQuery("deleteSocialLink", () => supabase.from("social_links").delete().eq("id", id));
  if (currentResult.data.icon_image_path !== null) {
    await deleteSiteImage(supabase, currentResult.data.icon_image_path);
  }
  revalidatePath("/", "layout");
  redirect("/dashboard/admin/contacto?status=social_deleted");
}

function parseTeamMember(formData: FormData): ReturnType<typeof teamMemberSchema.safeParse> {
  return teamMemberSchema.safeParse({
    active: formData.get("active") === "on",
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    name: formData.get("name"),
    roleTitle: formData.get("roleTitle"),
    sortOrder: formData.get("sortOrder"),
  });
}

export async function createTeamMemberAction(formData: FormData): Promise<never> {
  const result = parseTeamMember(formData);
  if (!result.success) {
    redirect("/dashboard/admin/contenido?error=invalid_team_member");
  }
  const adminUserId = await requireAdmin("createTeamMember");
  const supabase = await createSupabaseServerClient();
  await executeAdminQuery("createTeamMember", () => supabase.from("team_members").insert({
    active: result.data.active,
    description: result.data.description,
    image_url: result.data.imageUrl.length === 0 ? null : result.data.imageUrl,
    name: result.data.name,
    role_title: result.data.roleTitle,
    sort_order: result.data.sortOrder,
    updated_by: adminUserId,
  }));
  revalidatePath("/");
  redirect("/dashboard/admin/contenido?status=team_member_created");
}

export async function updateTeamMemberAction(teamMemberId: string, formData: FormData): Promise<never> {
  const id = requireIdentifier(teamMemberId, "updateTeamMember");
  const result = parseTeamMember(formData);
  if (!result.success) {
    redirect("/dashboard/admin/contenido?error=invalid_team_member");
  }
  const adminUserId = await requireAdmin("updateTeamMember");
  const supabase = await createSupabaseServerClient();
  await executeAdminQuery("updateTeamMember", () => supabase.from("team_members").update({
    active: result.data.active,
    description: result.data.description,
    image_url: result.data.imageUrl.length === 0 ? null : result.data.imageUrl,
    name: result.data.name,
    role_title: result.data.roleTitle,
    sort_order: result.data.sortOrder,
    updated_by: adminUserId,
  }).eq("id", id));
  revalidatePath("/");
  redirect("/dashboard/admin/contenido?status=team_member_updated");
}

export async function deleteTeamMemberAction(teamMemberId: string): Promise<never> {
  const id = requireIdentifier(teamMemberId, "deleteTeamMember");
  await requireAdmin("deleteTeamMember");
  const supabase = await createSupabaseServerClient();
  await executeAdminQuery("deleteTeamMember", () => supabase.from("team_members").delete().eq("id", id));
  revalidatePath("/");
  redirect("/dashboard/admin/contenido?status=team_member_deleted");
}

export async function setUserRoleAction(userId: string, formData: FormData): Promise<never> {
  const id = requireIdentifier(userId, "setUserRole");
  const role = roleSchema.safeParse(formData.get("role"));
  if (!role.success) {
    redirect("/dashboard/admin/usuarios?error=invalid_role");
  }
  await requireAdmin("setUserRole");
  const supabase = await createSupabaseServerClient();
  await executeAdminQuery("setUserRole", () => supabase.rpc("admin_set_user_role", { p_role: role.data, p_user_id: id }));
  revalidatePath("/dashboard/admin/usuarios");
  redirect("/dashboard/admin/usuarios?status=role_updated");
}

export async function setAdminAttendanceAction(eventId: string, userId: string, formData: FormData): Promise<never> {
  const parsedEventId = requireIdentifier(eventId, "setAdminAttendance");
  const parsedUserId = requireIdentifier(userId, "setAdminAttendance");
  const attendance = attendanceSchema.safeParse(formData.get("attended"));
  if (!attendance.success) {
    redirect("/dashboard/admin/asistencias?error=invalid_attendance");
  }
  await requireAdmin("setAdminAttendance");
  const supabase = await createSupabaseServerClient();
  await executeAdminQuery("setAdminAttendance", () => supabase.rpc("set_event_attendance", {
    p_attended: attendance.data === "true",
    p_event_id: parsedEventId,
    p_user_id: parsedUserId,
  }));
  revalidatePath("/dashboard/admin/asistencias");
  revalidatePath("/dashboard/admin/certificaciones");
  revalidatePath("/dashboard");
  redirect("/dashboard/admin/asistencias?status=attendance_updated");
}

export async function setCertificationTotalAction(userId: string, formData: FormData): Promise<never> {
  const id = requireIdentifier(userId, "setCertificationTotal");
  const total = certificationTotalSchema.safeParse(formData.get("total"));
  if (!total.success) {
    redirect("/dashboard/admin/certificaciones?error=invalid_total");
  }
  await requireAdmin("setCertificationTotal");
  const supabase = await createSupabaseServerClient();
  await executeAdminQuery("setCertificationTotal", () => supabase.rpc("admin_set_certification_total", { p_total: total.data, p_user_id: id }));
  revalidatePath("/dashboard/admin/certificaciones");
  revalidatePath("/dashboard");
  redirect("/dashboard/admin/certificaciones?status=certifications_updated");
}

export async function adjustUserPointsAction(userId: string, formData: FormData): Promise<never> {
  const id = requireIdentifier(userId, "adjustUserPoints");
  const adjustment = pointAdjustmentSchema.safeParse({ points: formData.get("points"), reason: formData.get("reason") });
  if (!adjustment.success) {
    redirect("/dashboard/admin/puntos?error=invalid_adjustment");
  }
  await requireAdmin("adjustUserPoints");
  const supabase = await createSupabaseServerClient();
  await executeAdminQuery("adjustUserPoints", () => supabase.rpc("admin_adjust_user_points", {
    p_points: adjustment.data.points,
    p_reason: adjustment.data.reason,
    p_user_id: id,
  }));
  revalidatePath("/dashboard/admin/puntos");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/progreso");
  redirect("/dashboard/admin/puntos?status=points_adjusted");
}
