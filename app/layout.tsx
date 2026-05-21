import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Topbar } from "@/components/Topbar";
import { Footer } from "@/components/Footer";
import { FaceLift } from "@/components/FaceLift";
import { ThemeScript } from "@/components/ThemeScript";

export const metadata: Metadata = {
  title: "prometheus_ hub",
  description: "Command center for Prometheus Consulting — social, leads, calendar, builds.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <ThemeScript />
      </head>
      <body>
        <div id="dash">
          <Topbar />
          {children}
          <Footer />
        </div>
        <FaceLift />
      </body>
    </html>
  );
}
