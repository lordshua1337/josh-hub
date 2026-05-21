"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "signing-in">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) return;
    setStatus("signing-in");
    setErrorMsg(null);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setStatus("idle");
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    router.replace(from);
    router.refresh();
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span>//</span> prometheus_ hub
        </div>
        <h1>Sign in</h1>
        <p className="login-sub">Operator access only.</p>

        <form onSubmit={onSubmit}>
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
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="login-input"
          />
          <button type="submit" className="login-btn" disabled={status === "signing-in"}>
            {status === "signing-in" ? "Signing in…" : "Sign in"}
          </button>
        </form>
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
              <span>//</span> prometheus_ hub
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
