"use client";

import { userSupabase } from "@/lib/userSupabase";
import type { Session } from "@supabase/supabase-js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Staff accounts are always "<username>@cwc.staff" (see lib/reviewerAuth.ts).
// That domain is reserved -- the public login/signup pages must never be
// able to authenticate into a staff account, even if someone knows the
// exact address and password. The error is deliberately identical to a
// plain wrong-credentials error so it doesn't confirm the domain is special.
const STAFF_EMAIL_DOMAIN = "cwc.staff";

function isStaffEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${STAFF_EMAIL_DOMAIN}`);
}

export interface AppUserProfile {
  id: string;
  email: string;
  name: string;
}

export async function getUserSession(): Promise<Session | null> {
  const { data } = await userSupabase.auth.getSession();
  return data.session;
}

export async function getUserProfile(): Promise<AppUserProfile | null> {
  const { data: sessionData } = await userSupabase.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) return null;

  const { data, error } = await userSupabase
    .from("app_users")
    .select("id, email, name")
    .eq("id", uid)
    .single();

  if (error || !data) return null;
  return data as AppUserProfile;
}

export async function signUpUser(
  email: string,
  password: string,
  name: string
): Promise<{ error: string | null; needsVerification: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!EMAIL_RE.test(cleanEmail) || isStaffEmail(cleanEmail)) {
    return { error: "Enter a valid email address.", needsVerification: false };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", needsVerification: false };
  }
  if (!cleanName) {
    return { error: "Enter your name.", needsVerification: false };
  }

  const { data, error } = await userSupabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: { name: cleanName },
      emailRedirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
    },
  });

  if (error) {
    return { error: error.message, needsVerification: false };
  }

  // With "Confirm email" ON in the Supabase project, a fresh signup has
  // no session yet until the person clicks the link in their inbox.
  const needsVerification = !data.session;
  return { error: null, needsVerification };
}

export async function signInUser(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isStaffEmail(cleanEmail)) {
    return { error: "Incorrect email or password." };
  }

  const { data, error } = await userSupabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Please verify your email before logging in -- check your inbox." };
    }
    return { error: "Incorrect email or password." };
  }

  if (!data.user?.email_confirmed_at) {
    await userSupabase.auth.signOut();
    return { error: "Please verify your email before logging in -- check your inbox." };
  }

  return { error: null };
}

export async function resendVerificationEmail(email: string): Promise<{ error: string | null }> {
  const { error } = await userSupabase.auth.resend({
    type: "signup",
    email: email.trim().toLowerCase(),
  });
  return { error: error ? error.message : null };
}

export async function signOutUser(): Promise<void> {
  await userSupabase.auth.signOut();
}
