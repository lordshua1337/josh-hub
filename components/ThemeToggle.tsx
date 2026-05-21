"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/lib/icons";

// Brand default is DARK (forge bg, ember palette). Josh can opt into light
// for accessibility/preference but the marketing-aligned look is dark mode.
const STORAGE_KEY = "jh-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    // Treat any explicit "light" pref as a user override; otherwise default dark.
    if (saved === "light") {
      document.documentElement.removeAttribute("data-theme");
      setTheme("light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      setTheme("dark");
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    if (next === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    window.localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }

  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Toggle dark mode">
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}
