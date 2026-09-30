"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { colors } from "@/lib/theme";

/**
 * Shared "you need to log in" prompt. Used wherever a whole page requires
 * a logged-in identity (currently /submit) -- Vote/Comment show their own
 * inline versions of this instead, since they sit inside existing UI
 * rather than replacing a whole page.
 *
 * `redirectTo` is round-tripped through the login/signup pages' `redirect`
 * query param so the person lands back where they were after logging in.
 */
export function AuthGate({
  redirectTo,
  heading = "Log in to continue",
  message = "You need an account to submit writing, vote, or comment. Reading is always open to everyone.",
}: {
  redirectTo: string;
  heading?: string;
  message?: string;
}) {
  const redirectParam = `?redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      <div
        className="mx-auto mb-5 w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: colors.badgeBg }}
      >
        <ArrowRight size={20} style={{ color: colors.green400 }} />
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontSize: "1.4rem", fontWeight: 700 }}>
        {heading}
      </h1>
      <p className="mt-2" style={{ color: colors.gray400, fontSize: "0.88rem", lineHeight: "1.6" }}>
        {message}
      </p>
      <div className="flex items-center justify-center gap-3 mt-6">
        <Link
          href={`/login${redirectParam}`}
          className="px-6 py-2.5 rounded-full text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all"
          style={{ backgroundColor: colors.green600 }}
        >
          Log in
        </Link>
        <Link
          href={`/signup${redirectParam}`}
          className="px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-80 active:scale-95 transition-all"
          style={{ border: `1px solid ${colors.gray200}`, color: colors.heading }}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
