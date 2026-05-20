import Link from "next/link";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason = "unknown" } = await searchParams;
  const display =
    reason === "not_allowed"
      ? "This email isn't on the allowlist for this hub."
      : reason === "missing_code"
        ? "The magic-link URL was missing its code."
        : reason;

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span>//</span> CMD
        </div>
        <h1>Access denied</h1>
        <p className="login-sub">{display}</p>
        <Link className="login-btn" href="/login">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
