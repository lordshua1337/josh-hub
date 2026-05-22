"use client";

// Sidebar — left rail nav with collapsible group sections.
// Replaces the old Topbar dropdown menus. Each top-level item is either:
//   - a single link (Dashboard, Social)
//   - a group that expands inline to show sub-items
// The group containing the active route auto-expands. Other groups remember
// their expanded/collapsed state in localStorage so the layout sticks.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

type GroupItem = { href: string; label: string; external?: boolean };
type Tab =
  | { type: "single"; href: string; label: string }
  | { type: "group"; key: string; label: string; items: GroupItem[] };

// Everything that produces or schedules content lives under ONE group.
// Per Josh: "it should live under one thing called Content. then it says
// Post Engine, Email Engine, Campaign Builder, Content Calendar, etc."
const TABS: Tab[] = [
  { type: "single", href: "/", label: "dashboard" },
  {
    type: "group",
    key: "content",
    label: "content",
    items: [
      { href: "/content/social", label: "Post Engine" },
      { href: "/content/email", label: "Email Engine" },
      { href: "/content/dms", label: "DM Engine" },
      { href: "/content/campaigns", label: "Campaign Builder" },
      { href: "/content/calendar", label: "Content Calendar" },
      { href: "/content/posts", label: "Long-Form Drafts" },
      { href: "/forge/index.html", label: "Image Forge", external: true },
    ],
  },
  {
    type: "group",
    key: "business",
    label: "business",
    items: [
      { href: "/calendar", label: "Calendar" },
      { href: "/lead-gen/leads", label: "Leads" },
      { href: "/lead-gen/forms", label: "Forms" },
      { href: "/lead-gen/sources", label: "Sources" },
      { href: "/lead-gen/sequences", label: "Sequences" },
    ],
  },
  {
    type: "group",
    key: "claude",
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
    key: "website",
    label: "website",
    items: [
      { href: "/website/analytics", label: "Analytics" },
      { href: "/website/pages", label: "Pages" },
      { href: "/website/seo", label: "SEO" },
      { href: "/website/experiments", label: "A/B Tests" },
    ],
  },
];

function isActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const STORAGE_KEY = "ph-sidebar-groups";

export function Sidebar() {
  const pathname = usePathname();
  // Which group is currently expanded (only one at a time). Auto-defaults
  // to the group containing the active route.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);

  // On mount, auto-expand the group containing the active route + restore
  // any explicitly-expanded groups from localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = new Set<string>();
    for (const t of TABS) {
      if (t.type !== "group") continue;
      if (t.items.some((it) => isActive(it.href, pathname))) next.add(t.key);
    }
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as string[];
      for (const k of saved) next.add(k);
    } catch {
      // ignore
    }
    setExpanded(next);
  }, [pathname]);

  function toggleGroup(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      {/* Mobile hamburger — only visible at narrow viewports */}
      <button
        type="button"
        className="sidebar-toggle"
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>

      {mobileOpen && <div className="sidebar-scrim" onClick={closeMobile} />}

      <aside className={`sidebar${mobileOpen ? " is-open" : ""}`} aria-label="Main navigation">
        {/* Brand wordmark — pr○metheus_ */}
        <Link href="/" className="sidebar-brand" onClick={closeMobile}>
          <span className="brand-pre">pr</span>
          <span className="brand-o">o</span>
          <span className="brand-mid">metheus</span>
          <span className="brand-cursor">_</span>
        </Link>

        <nav className="sidebar-nav">
          {TABS.map((t) => {
            if (t.type === "single") {
              const active = isActive(t.href, pathname);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`sidebar-item${active ? " is-active" : ""}`}
                  onClick={closeMobile}
                >
                  {t.label}
                </Link>
              );
            }
            const isExpanded = expanded.has(t.key);
            const groupActive = t.items.some((it) => isActive(it.href, pathname));
            return (
              <div key={t.key} className={`sidebar-group${isExpanded ? " is-expanded" : ""}${groupActive ? " has-active" : ""}`}>
                <button
                  type="button"
                  className="sidebar-group-trigger"
                  aria-expanded={isExpanded}
                  onClick={() => toggleGroup(t.key)}
                >
                  <span>{t.label}</span>
                  <span className="sidebar-caret" aria-hidden>{isExpanded ? "−" : "+"}</span>
                </button>
                {isExpanded && (
                  <div className="sidebar-subitems">
                    {t.items.map((it) => {
                      const active = isActive(it.href, pathname);
                      if (it.external) {
                        return (
                          <a
                            key={it.href}
                            href={it.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sidebar-subitem"
                            onClick={closeMobile}
                          >
                            {it.label} ↗
                          </a>
                        );
                      }
                      return (
                        <Link
                          key={it.href}
                          href={it.href}
                          className={`sidebar-subitem${active ? " is-active" : ""}`}
                          onClick={closeMobile}
                        >
                          {it.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer — theme toggle + sign out */}
        <div className="sidebar-footer">
          <ThemeToggle />
          <form method="POST" action="/auth/signout" style={{ display: "inline" }}>
            <button type="submit" className="sidebar-signout" title="Sign out">
              sign out ↪
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
