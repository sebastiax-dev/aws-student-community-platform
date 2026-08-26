"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthenticationServiceError } from "@/features/auth/errors";
import { executeAuthRequest } from "@/features/auth/request";
import { getAuthenticatedUserId } from "@/features/auth/session";
import { getPublicSupabaseEnvironment } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.email();
const passwordSchema = z.string().min(10).max(72);
const signInSchema = z.object({ email: emailSchema, password: passwordSchema });
const signUpSchema = z.object({
  confirmPassword: passwordSchema,
  displayName: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: passwordSchema,
}).refine((values) => values.password === values.confirmPassword, { path: ["confirmPassword"] });
const updatePasswordSchema = z.object({
  confirmPassword: passwordSchema,
  password: passwordSchema,
}).refine((values) => values.password === values.confirmPassword, { path: ["confirmPassword"] });

function isRateLimited(status: number | undefined): boolean {
  return status === 429;
}

export async function signInAction(formData: FormData): Promise<never> {
  const parsedInput = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });

  if (!parsedInput.success) {
    redirect("/login?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const result = await executeAuthRequest("signInWithPassword", () => supabase.auth.signInWithPassword(parsedInput.data));

  if (result.error !== null) {
    if (isRateLimited(result.error.status)) {
      redirect("/login?error=rate_limited");
    }
    if (result.error.code === "invalid_credentials" || result.error.status === 400) {
      redirect("/login?error=invalid_credentials");
    }
    throw new AuthenticationServiceError("signInWithPassword", result.error);
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData): Promise<never> {
  const parsedInput = signUpSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedInput.success) {
    redirect("/registro?error=invalid_input");
  }

  const environment = getPublicSupabaseEnvironment();
  const supabase = await createSupabaseServerClient();
  const result = await executeAuthRequest("signUp", () => supabase.auth.signUp({
    email: parsedInput.data.email,
    password: parsedInput.data.password,
    options: {
      data: { display_name: parsedInput.data.displayName },
      emailRedirectTo: new URL("/auth/callback?next=/dashboard", environment.siteUrl).toString(),
    },
  }));

  if (result.error !== null) {
    if (isRateLimited(result.error.status)) {
      redirect("/registro?error=rate_limited");
    }
    if (result.error.status === 400 || result.error.status === 422) {
      redirect("/registro?error=invalid_input");
    }
    throw new AuthenticationServiceError("signUp", result.error);
  }

  redirect("/login?status=check_email");
}

export async function requestPasswordResetAction(formData: FormData): Promise<never> {
  const parsedEmail = emailSchema.safeParse(formData.get("email"));

  if (!parsedEmail.success) {
    redirect("/recuperar-contrasena?error=invalid_input");
  }

  const environment = getPublicSupabaseEnvironment();
  const supabase = await createSupabaseServerClient();
  const result = await executeAuthRequest("resetPasswordForEmail", () => supabase.auth.resetPasswordForEmail(parsedEmail.data, {
    redirectTo: new URL("/auth/callback?next=/actualizar-contrasena", environment.siteUrl).toString(),
  }));

  if (result.error !== null) {
    if (isRateLimited(result.error.status)) {
      redirect("/recuperar-contrasena?error=rate_limited");
    }
    throw new AuthenticationServiceError("resetPasswordForEmail", result.error);
  }

  redirect("/login?status=reset_email_sent");
}

export async function updatePasswordAction(formData: FormData): Promise<never> {
  const parsedPassword = updatePasswordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    password: formData.get("password"),
  });
  const authenticatedUserId = await getAuthenticatedUserId();

  if (!parsedPassword.success || authenticatedUserId === null) {
    redirect("/actualizar-contrasena?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const result = await executeAuthRequest("updateUser", () => supabase.auth.updateUser({ password: parsedPassword.data.password }));

  if (result.error !== null) {
    if (isRateLimited(result.error.status)) {
      redirect("/actualizar-contrasena?error=rate_limited");
    }
    throw new AuthenticationServiceError("updateUser", result.error);
  }

  redirect("/login?status=password_updated");
}

export async function signOutAction(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  const result = await executeAuthRequest("signOut", () => supabase.auth.signOut());

  if (result.error !== null) {
    throw new AuthenticationServiceError("signOut", result.error);
  }

  redirect("/login");
}
