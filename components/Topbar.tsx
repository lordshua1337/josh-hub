"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const TABS = [
  { href: "/", label: "Dashboard" },
  { href: "/skills", label: "Skills" },
  { href: "/achievements", label: "Achievements" },
  { href: "/activity", label: "Activity" },
  { href: "/projects", label: "Projects" },
  { href: "/integrations", label: "Integrations" },
];

export function Topbar() {
  const pathname = usePathname();
  return (
    <nav className="topbar" role="navigation" aria-label="Main navigation">
      <div className="topbar-left">
        <div className="logo-wrap">
          <div className="logo">
            <span>//</span> CMD
          </div>
          <div className="logo-dropdown">
            <a href="/config-inspector.html">
              <span>//</span> CONFYG
            </a>
          </div>
        </div>
      </div>
      <div className="topbar-tabs">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
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
        })}
        <ThemeToggle />
      </div>
    </nav>
  );
}
