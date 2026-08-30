import type { Database } from "@/types/database.generated";

export type AdminUserSummary = Database["public"]["Functions"]["admin_list_users"]["Returns"][number];
export type AdminAttendanceRow = Database["public"]["Functions"]["admin_list_attendance"]["Returns"][number];
export type SocialLink = Database["public"]["Tables"]["social_links"]["Row"] & Readonly<{
  icon_image_url: string | null;
}>;
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

export type HomeContent = Readonly<{
  description: string;
  eyebrow: string;
  primaryCtaHref: string;
  primaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
  titleAccent: string;
  titleLead: string;
  titleSuffix: string;
}>;

export type CommunityContent = Readonly<{
  activeMembers: string;
  certificatesIssued: string;
  description: string;
  eventsPerCycle: string;
  projectsDeveloped: string;
  title: string;
}>;

export type FooterContent = Readonly<{
  institutionalName: string;
  tagline: string;
}>;

export type BrandingContent = Readonly<{
  brandName: string;
  logoImagePath: string;
  logoImageUrl: string | null;
}>;

export type ContactContent = Readonly<{
  generalEmail: string;
  location: string;
  officeHours: string;
  phone: string;
  privacyEmail: string;
  whatsapp: string;
}>;

export type SiteContent = Readonly<{
  branding: BrandingContent;
  community: CommunityContent;
  contact: ContactContent;
  footer: FooterContent;
  home: HomeContent;
}>;
