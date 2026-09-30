"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { colors } from "@/lib/theme";
import { authInputWrapperStyle, authInputStyle } from "@/lib/authFormStyles";
import { signInUser, resendVerificationEmail } from "@/lib/userAuth";
import { useAuth } from "@/context/AuthContext";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { identity } = useAuth();

  // A staff session (Review/Control Panel) already counts as "logged in"
  // everywhere on the public site -- so logging into a second, different
  // account here would just create a confusing dual identity. Staff sign
  // out from wherever their name/role shows (Navbar) rather than here.
  if (identity?.kind === "staff") {
    return (
      <div className="max-w-sm mx-auto px-5 py-20 text-center">
        <h1 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontSize: "1.4rem", fontWeight: 700 }}>
          You&apos;re logged in as {identity.displayName}
        </h1>
        <p className="mt-3" style={{ color: colors.gray400, fontSize: "0.88rem", lineHeight: "1.6" }}>
          You&apos;re already good to vote, comment, and submit under your staff account. To log
          into a different account instead, log out from the menu in the navigation bar first.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const { error } = await signInUser(email, password);
      if (error) {
        setError(error);
        return;
      }
      // A hard navigation (not router.push) re-initializes AuthContext and
      // every other provider from scratch, so the whole site picks up the
      // new identity consistently rather than patching state in place.
      window.location.href = redirectTo;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    const { error } = await resendVerificationEmail(email);
    if (error) {
      setError(error);
    } else {
      setNotice("Verification email resent -- check your inbox.");
    }
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-16">
      <div className="text-center mb-8">
        <h1 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontSize: "1.6rem", fontWeight: 700 }}>
          Log in
        </h1>
        <p className="mt-2" style={{ color: colors.gray400, fontSize: "0.88rem" }}>
          Sign in to vote, comment, and submit your writing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1.5" style={{ color: colors.heading, fontSize: "0.82rem", fontWeight: 600 }}>
            Email
          </label>
          <div style={authInputWrapperStyle}>
            <Mail size={16} style={{ color: colors.gray400, flexShrink: 0 }} />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={authInputStyle}
            />
          </div>
        </div>

        <div>
          <label className="block mb-1.5" style={{ color: colors.heading, fontSize: "0.82rem", fontWeight: 600 }}>
            Password
          </label>
          <div style={authInputWrapperStyle}>
            <Lock size={16} style={{ color: colors.gray400, flexShrink: 0 }} />
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={authInputStyle}
            />
          </div>
        </div>

        {error && <p style={{ color: colors.red600, fontSize: "0.8rem" }}>{error}</p>}
        {notice && (
          <p style={{ color: colors.badgeText, fontSize: "0.8rem" }}>
            {notice}{" "}
            <button type="button" onClick={handleResend} className="underline">
              Resend
            </button>
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 px-4 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ backgroundColor: colors.green600 }}
        >
          {submitting ? "Please wait..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center" style={{ color: colors.gray400, fontSize: "0.85rem" }}>
        Don&apos;t have an account?{" "}
        <Link href={`/signup?redirect=${encodeURIComponent(redirectTo)}`} style={{ color: colors.green400 }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
