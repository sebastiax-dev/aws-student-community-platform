import { executeAdminQuery, requireAdminQueryData } from "@/features/admin/request";
import { getPublicSiteImageUrl } from "@/features/admin/media";
import type { AdminAttendanceRow, AdminUserSummary, BrandingContent, SiteContent, SocialLink, TeamMember } from "@/features/admin/types";
import { brandingContentSchema, communityContentSchema, contactContentSchema, footerContentSchema, homeContentSchema } from "@/features/admin/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.generated";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";

type SettingKey = "branding" | "community" | "contact" | "footer" | "home";

type SettingRow = Readonly<{
  key: string;
  value: Json;
}>;

const settingKeys: readonly SettingKey[] = ["home", "community", "footer", "contact", "branding"];

function requireSetting(rows: readonly SettingRow[], key: SettingKey): Json {
  const row = rows.find((candidate) => candidate.key === key);
  if (row === undefined) {
    throw new Error(`Required site setting is missing: key=${key}`);
  }
  return row.value;
}

function parseBrandingContent(value: Json, supabase: SupabaseClient<Database>): BrandingContent {
  const parsedBranding = brandingContentSchema.parse(value);
  return {
    brandName: parsedBranding.brandName,
    logoImagePath: parsedBranding.logoImagePath,
    logoImageUrl: getPublicSiteImageUrl(supabase, parsedBranding.logoImagePath),
  };
}

function parseSiteContent(rows: readonly SettingRow[], supabase: SupabaseClient<Database>): SiteContent {
  return {
    branding: parseBrandingContent(requireSetting(rows, "branding"), supabase),
    community: communityContentSchema.parse(requireSetting(rows, "community")),
    contact: contactContentSchema.parse(requireSetting(rows, "contact")),
    footer: footerContentSchema.parse(requireSetting(rows, "footer")),
    home: homeContentSchema.parse(requireSetting(rows, "home")),
  };
}

function toTeamMember(row: Database["public"]["Tables"]["team_members"]["Row"], supabase: SupabaseClient<Database>): TeamMember {
  return {
    ...row,
    image_public_url: row.image_path === null ? row.image_url : getPublicSiteImageUrl(supabase, row.image_path),
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  const supabase = await createSupabaseServerClient();
  const result = await executeAdminQuery("getSiteContent", () => supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [...settingKeys]));
  return parseSiteContent(requireAdminQueryData("getSiteContent", result.data), supabase);
}

export async function getSiteBranding(): Promise<BrandingContent> {
  const supabase = await createSupabaseServerClient();
  const result = await executeAdminQuery("getSiteBranding", () => supabase
    .from("site_settings")
    .select("key, value")
    .eq("key", "branding")
    .single());
  const setting = requireAdminQueryData("getSiteBranding", result.data);
  return parseBrandingContent(setting.value, supabase);
}

function toSocialLink(row: Database["public"]["Tables"]["social_links"]["Row"], supabase: SupabaseClient<Database>): SocialLink {
  return {
    ...row,
    icon_image_url: getPublicSiteImageUrl(supabase, row.icon_image_path),
  };
}

export async function listAdminUsers(search: string): Promise<readonly AdminUserSummary[]> {
  const supabase = await createSupabaseServerClient();
  const result = await executeAdminQuery("listAdminUsers", () => supabase.rpc("admin_list_users", { p_search: search.trim() }));
  return requireAdminQueryData("listAdminUsers", result.data);
}

export async function listAdminAttendance(search: string, eventId: string | null): Promise<readonly AdminAttendanceRow[]> {
  const supabase = await createSupabaseServerClient();
  const result = await executeAdminQuery("listAdminAttendance", () => eventId === null
    ? supabase.rpc("admin_list_attendance", { p_search: search.trim() })
    : supabase.rpc("admin_list_attendance", { p_event_id: eventId, p_search: search.trim() }));
  return requireAdminQueryData("listAdminAttendance", result.data);
}

export async function listAdminSocialLinks(): Promise<readonly SocialLink[]> {
  const supabase = await createSupabaseServerClient();
  const result = await executeAdminQuery("listAdminSocialLinks", () => supabase
    .from("social_links")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true }));
  return requireAdminQueryData("listAdminSocialLinks", result.data).map((row) => toSocialLink(row, supabase));
}

export async function listPublicSocialLinks(): Promise<readonly SocialLink[]> {
  const supabase = await createSupabaseServerClient();
  const result = await executeAdminQuery("listPublicSocialLinks", () => supabase
    .from("social_links")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true }));
  return requireAdminQueryData("listPublicSocialLinks", result.data).map((row) => toSocialLink(row, supabase));
}

export async function listAdminTeamMembers(): Promise<readonly TeamMember[]> {
  const supabase = await createSupabaseServerClient();
  const result = await executeAdminQuery("listAdminTeamMembers", () => supabase
    .from("team_members")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true }));
  return requireAdminQueryData("listAdminTeamMembers", result.data).map((row) => toTeamMember(row, supabase));
}

export async function listPublicTeamMembers(): Promise<readonly TeamMember[]> {
  const supabase = await createSupabaseServerClient();
  const result = await executeAdminQuery("listPublicTeamMembers", () => supabase
    .from("team_members")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true }));
  return requireAdminQueryData("listPublicTeamMembers", result.data).map((row) => toTeamMember(row, supabase));
}
