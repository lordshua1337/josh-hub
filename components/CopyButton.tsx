"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export function CopyButton({
  text,
  className,
  children,
}: {
  text: string;
  className?: string;
  children?: ReactNode;
}) {
  const [toast, setToast] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setToast(`Copied: ${text}`);
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <>
      <button type="button" className={className} onClick={copy}>
        {children}
      </button>
      {toast && (
        <div className="copy-toast show" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
