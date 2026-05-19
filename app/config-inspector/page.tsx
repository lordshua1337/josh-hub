import Link from "next/link";

export default function ConfigInspectorPage() {
  return (
    <>
      <div className="header fl-reveal">
        <h1>Config Inspector</h1>
        <p className="header-sub">Coming back in P7 -- the legacy 3967-line tool will be restored as an iframe view.</p>
      </div>
      <div className="main">
        <div className="card fl-reveal" style={{ padding: 32 }}>
          <p style={{ marginBottom: 16 }}>
            The CONFYG tool surveyed your <code>~/.claude/</code> config files (hooks, permissions, MCP servers, env)
            and produced a live HTML report. It&apos;s preserved at{" "}
            <code>legacy/config-inspector.html</code> until we wire it back in.
          </p>
          <Link className="act-btn act-btn-primary" href="/">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
