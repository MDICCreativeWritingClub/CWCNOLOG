"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User } from "lucide-react";
import { colors } from "@/lib/theme";
import { authInputWrapperStyle, authInputStyle } from "@/lib/authFormStyles";
import { signUpUser } from "@/lib/userAuth";
import { useAuth } from "@/context/AuthContext";

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { identity } = useAuth();

  if (identity?.kind === "staff") {
    return (
      <div className="max-w-sm mx-auto px-5 py-20 text-center">
        <h1 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontSize: "1.4rem", fontWeight: 700 }}>
          You&apos;re logged in as {identity.displayName}
        </h1>
        <p className="mt-3" style={{ color: colors.gray400, fontSize: "0.88rem", lineHeight: "1.6" }}>
          You&apos;re already good to vote, comment, and submit under your staff account. To
          create a separate account instead, log out from the menu in the navigation bar first.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error, needsVerification } = await signUpUser(email, password, name);
      if (error) {
        setError(error);
        return;
      }
      if (needsVerification) {
        setNotice("Account created -- check your inbox for a verification link, then log in.");
        setTimeout(() => router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`), 1800);
        return;
      }
      // Hard navigation, not router.push: signup with "Confirm email" off
      // logs the person straight in, so the whole site needs to reinitialize
      // (AuthContext etc.) with the new identity, not just this page.
      window.location.href = redirectTo;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-16">
      <div className="text-center mb-8">
        <h1 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontSize: "1.6rem", fontWeight: 700 }}>
          Create an account
        </h1>
        <p className="mt-2" style={{ color: colors.gray400, fontSize: "0.88rem" }}>
          You&apos;ll need to verify your email before you can vote, comment, or submit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1.5" style={{ color: colors.heading, fontSize: "0.82rem", fontWeight: 600 }}>
            Name
          </label>
          <div style={authInputWrapperStyle}>
            <User size={16} style={{ color: colors.gray400, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              style={authInputStyle}
            />
          </div>
        </div>

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

        <div>
          <label className="block mb-1.5" style={{ color: colors.heading, fontSize: "0.82rem", fontWeight: 600 }}>
            Confirm password
          </label>
          <div style={authInputWrapperStyle}>
            <Lock size={16} style={{ color: colors.gray400, flexShrink: 0 }} />
            <input
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              style={authInputStyle}
            />
          </div>
        </div>

        {error && <p style={{ color: colors.red600, fontSize: "0.8rem" }}>{error}</p>}
        {notice && <p style={{ color: colors.badgeText, fontSize: "0.8rem" }}>{notice}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 px-4 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ backgroundColor: colors.green600 }}
        >
          {submitting ? "Please wait..." : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center" style={{ color: colors.gray400, fontSize: "0.85rem" }}>
        Already have an account?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} style={{ color: colors.green400 }}>
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
