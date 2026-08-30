import { z } from "zod";

const internalHrefSchema = z.string().trim().min(1).max(240).regex(/^\/(?:[a-z0-9/_#?=&-]*)$/u);
const optionalEmailSchema = z.union([z.literal(""), z.email().max(254)]);
const optionalContactSchema = z.string().trim().max(120);

export const homeContentSchema = z.object({
  description: z.string().trim().min(20).max(500),
  eyebrow: z.string().trim().min(3).max(80),
  primaryCtaHref: internalHrefSchema,
  primaryCtaLabel: z.string().trim().min(2).max(60),
  secondaryCtaHref: internalHrefSchema,
  secondaryCtaLabel: z.string().trim().min(2).max(60),
  titleAccent: z.string().trim().min(2).max(60),
  titleLead: z.string().trim().min(2).max(60),
  titleSuffix: z.string().trim().min(2).max(40),
});

export const communityContentSchema = z.object({
  activeMembers: z.string().trim().min(1).max(20),
  certificatesIssued: z.string().trim().min(1).max(20),
  description: z.string().trim().min(20).max(600),
  eventsPerCycle: z.string().trim().min(1).max(20),
  projectsDeveloped: z.string().trim().min(1).max(20),
  title: z.string().trim().min(3).max(100),
});

export const footerContentSchema = z.object({
  institutionalName: z.string().trim().min(3).max(120),
  tagline: z.string().trim().min(3).max(240),
});

export const brandingContentSchema = z.object({
  brandName: z.string().trim().min(3).max(120).catch("AWS Student Builder Group at PUCE"),
  logoImagePath: z.union([
    z.literal(""),
    z.string().regex(/^branding\/[0-9a-f-]{36}\.(avif|jpg|png|webp)$/u),
  ]),
});

export const contactContentSchema = z.object({
  generalEmail: optionalEmailSchema,
  location: optionalContactSchema,
  officeHours: optionalContactSchema,
  phone: optionalContactSchema,
  privacyEmail: optionalEmailSchema,
  whatsapp: optionalContactSchema,
});

export const socialLinkSchema = z.object({
  active: z.boolean(),
  icon: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(60),
  sortOrder: z.coerce.number().int().min(0).max(1000),
  url: z.url().refine((url) => url.startsWith("https://"), "La URL debe usar HTTPS."),
});

export const teamMemberSchema = z.object({
  active: z.boolean(),
  description: z.string().trim().min(10).max(600),
  imageUrl: z.union([z.literal(""), z.url().refine((url) => url.startsWith("https://"), "La imagen debe usar HTTPS.")]),
  name: z.string().trim().min(2).max(80),
  roleTitle: z.string().trim().min(2).max(100),
  sortOrder: z.coerce.number().int().min(0).max(1000),
});

export const roleSchema = z.enum(["USER", "ADMIN"]);
export const attendanceSchema = z.enum(["true", "false"]);
export const certificationTotalSchema = z.coerce.number().int().min(0).max(100);
export const pointAdjustmentSchema = z.object({
  points: z.coerce.number().int().min(-1000).max(1000).refine((points) => points !== 0, "El ajuste no puede ser cero."),
  reason: z.string().trim().min(5).max(240),
});
export const identifierSchema = z.uuid();
