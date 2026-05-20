"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<"idle" | "sending" | "verifying">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setErrorMsg(null);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setStatus("idle");
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code) return;
    setStatus("verifying");
    setErrorMsg(null);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setStatus("idle");
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    // Server middleware will accept the cookie on next request.
    router.replace(from);
    router.refresh();
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span>//</span> CMD
        </div>
        <h1>Sign in</h1>
        <p className="login-sub">
          {step === "email"
            ? "Email a 6-digit code."
            : `Code sent to ${email}. Check your inbox.`}
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode}>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="login-input"
            />
            <button type="submit" className="login-btn" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="login-input login-code"
            />
            <button type="submit" className="login-btn" disabled={status === "verifying"}>
              {status === "verifying" ? "Verifying…" : "Enter"}
            </button>
            <button
              type="button"
              className="login-link"
              onClick={() => {
                setStep("email");
                setCode("");
                setErrorMsg(null);
              }}
            >
              Use a different email
            </button>
          </form>
        )}

        {errorMsg && <p className="login-error">{errorMsg}</p>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-shell">
          <div className="login-card">
            <div className="login-brand">
              <span>//</span> CMD
            </div>
            <h1>Sign in</h1>
            <p className="login-sub">Loading…</p>
          </div>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
