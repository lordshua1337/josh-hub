// Brand registry. One entry per brand we publish for. The rendering engine
// reads palette + fonts + voice from here; the AI copy generator reads the
// voiceFile contents (a markdown rules doc) to stay in the brand's tone.

export type SocialPlatform = "instagram" | "linkedin" | "x" | "threads";

export type Brand = {
  slug: string;
  name: string;
  wordmark: string;            // shown on every post, e.g. "//PROMETHEUS"
  tagline: string;
  audience: string;
  voiceFile: string;           // imported from lib/social/voices/<slug>.ts
  palette: {
    bg: string;                // page background
    bgGradient?: [string, string]; // optional radial / linear stops
    text: string;
    textMuted: string;
    accent: string;            // primary accent (amber)
    accent2?: string;          // secondary accent (deep amber / copper)
    accentSoft: string;        // for soft fills
  };
  fonts: {
    display: { family: string; weight: number };
    body: { family: string; weight: number };
    mono: { family: string; weight: number };
  };
  schedulingLink?: string;
  platforms: SocialPlatform[];
  igAccount?: { username: string; userId?: string };
};

export const BRANDS: Record<string, Brand> = {
  prometheus: {
    slug: "prometheus",
    name: "Prometheus Consulting",
    wordmark: "//PROMETHEUS",
    tagline: "AI that gives your people superpowers.",
    audience: "Growth-stage operators ($1M-$50M) skeptical of AI hype but losing sleep over falling behind.",
    voiceFile: "prometheus",
    palette: {
      bg: "#2b2220",                          // warm forge charcoal
      bgGradient: ["#2b2220", "#1a1310"],     // subtle ember vignette
      text: "#f6efe6",                        // warm off-white
      textMuted: "#a89888",                   // dust
      accent: "#f59e0b",                      // amber rim-light
      accent2: "#b45309",                     // deep copper
      accentSoft: "rgba(245,158,11,0.12)",
    },
    fonts: {
      display: { family: "Inter", weight: 800 },
      body: { family: "Inter", weight: 500 },
      mono: { family: "JetBrains Mono", weight: 700 },
    },
    schedulingLink: "https://cal.com/prometheus-consulting/15min",
    platforms: ["instagram", "linkedin", "x"],
  },
};

export function getBrand(slug: string): Brand {
  const b = BRANDS[slug];
  if (!b) throw new Error(`Unknown brand: ${slug}`);
  return b;
}
