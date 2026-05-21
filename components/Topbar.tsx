"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

type GroupItem = { href: string; label: string; external?: boolean };
type Tab =
  | { type: "single"; href: string; label: string }
  | { type: "group"; label: string; items: GroupItem[] };

const TABS: Tab[] = [
  { type: "single", href: "/", label: "dashboard" },
  { type: "single", href: "/content/social", label: "social" },
  {
    type: "group",
    label: "business",
    items: [
      { href: "/calendar", label: "Calendar" },
      { href: "/lead-gen/leads", label: "Leads" },
      { href: "/lead-gen/forms", label: "Forms" },
      { href: "/lead-gen/sources", label: "Sources" },
      { href: "/lead-gen/sequences", label: "Sequences" },
      { href: "/content/email", label: "Inbox / Email" },
      { href: "/content/dms", label: "IG DMs" },
    ],
  },
  {
    type: "group",
    label: "claude",
    items: [
      { href: "/skills", label: "Skills" },
      { href: "/achievements", label: "Achievements" },
      { href: "/activity", label: "Activity" },
      { href: "/projects", label: "Projects" },
      { href: "/integrations", label: "Integrations" },
    ],
  },
  {
    type: "group",
    label: "website",
    items: [
      { href: "/website/analytics", label: "Analytics" },
      { href: "/website/pages", label: "Pages" },
      { href: "/website/seo", label: "SEO" },
      { href: "/website/experiments", label: "A/B Tests" },
    ],
  },
  {
    type: "group",
    label: "tools",
    items: [
      { href: "/content/posts", label: "Posts" },
      { href: "/content/calendar", label: "Content Calendar" },
      { href: "/forge/index.html", label: "Image Forge", external: true },
    ],
  },
];

function isActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Topbar() {
  const pathname = usePathname();
  return (
    <nav className="topbar" role="navigation" aria-label="Main navigation">
      <div className="topbar-left">
        <div className="logo-wrap">
          <div className="logo">
            <span className="brand-pre">pr</span>
            <span className="brand-o">o</span>
            <span className="brand-mid">metheus</span>
            <span className="brand-cursor">_</span>
          </div>
          <div className="logo-dropdown">
            <a href="/config-inspector.html">
              <span>//</span> config
            </a>
            <a href="/forge/index.html" target="_blank" rel="noreferrer">
              <span>//</span> image forge
            </a>
          </div>
        </div>
      </div>
      <div className="topbar-tabs">
        {TABS.map((t) => {
          if (t.type === "single") {
            const active = isActive(t.href, pathname);
            return (
              <Link
                key={t.href}
                className={`tab-btn${active ? " active" : ""}`}
                href={t.href}
                aria-current={active ? "page" : undefined}
              >
                {t.label}
              </Link>
            );
          }
          const groupActive = t.items.some((it) => isActive(it.href, pathname));
          return (
            <div key={t.label} className="tab-group">
              <button
                type="button"
                className={`tab-btn tab-group-trigger${groupActive ? " active" : ""}`}
                aria-haspopup="true"
                aria-expanded="false"
              >
                {t.label}
                <span className="tab-group-caret" aria-hidden>
                  ▾
                </span>
              </button>
              <div className="tab-group-menu" role="menu">
                {t.items.map((it) => {
                  const active = isActive(it.href, pathname);
                  // External items (static HTML in /public, etc.) need a plain
                  // anchor so Next.js doesn't try to prefetch / client-nav.
                  if (it.external) {
                    return (
                      <a
                        key={it.href}
                        role="menuitem"
                        className="tab-group-item"
                        href={it.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {it.label} ↗
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={it.href}
                      role="menuitem"
                      className={`tab-group-item${active ? " active" : ""}`}
                      href={it.href}
                      aria-current={active ? "page" : undefined}
                    >
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        <ThemeToggle />
        <form method="POST" action="/auth/signout" style={{ display: "inline" }}>
          <button type="submit" className="tab-btn" title="Sign out">
            ↪
          </button>
        </form>
      </div>
    </nav>
  );
}
