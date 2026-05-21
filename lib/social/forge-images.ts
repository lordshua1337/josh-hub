// Forge image registry — mirrors public/forge/app.js so the composer
// can list backgrounds without fetching the static asset. The slug is
// the canonical id we pass through the draft API + render route.
//
// IMPORTANT: keep file paths in sync with public/forge/assets/web/.

export type ForgeImage = {
  slug: string;     // canonical id, also the filename stem
  name: string;     // UI display name
  tag: string;      // short pillar / category tag
  bestFor: string;  // one-liner about when to reach for this
  url: string;      // absolute path served by Vercel
  focalHint: { x: number; y: number }; // 0..1 — useful for crop UIs
};

export const FORGE_IMAGES: ForgeImage[] = [
  {
    slug: "mythic-sentinel",
    name: "Mythic Sentinel",
    tag: "Prometheus figure",
    bestFor: "hero posts, thought leadership, AI superpowers",
    url: "/forge/assets/web/mythic-sentinel.jpg",
    focalHint: { x: 0.68, y: 0.45 },
  },
  {
    slug: "neural-forge",
    name: "Neural Forge",
    tag: "workflow systems",
    bestFor: "automation, systems cleanup, process transformation",
    url: "/forge/assets/web/neural-forge.jpg",
    focalHint: { x: 0.67, y: 0.44 },
  },
  {
    slug: "human-superpowers",
    name: "Human Superpowers",
    tag: "people first",
    bestFor: "training, enablement, human-centric AI",
    url: "/forge/assets/web/human-superpowers.jpg",
    focalHint: { x: 0.66, y: 0.5 },
  },
  {
    slug: "milwaukee-firefront",
    name: "Milwaukee Firefront",
    tag: "Midwest roots",
    bestFor: "local posts, founder story, regional credibility",
    url: "/forge/assets/web/milwaukee-firefront.jpg",
    focalHint: { x: 0.67, y: 0.5 },
  },
  {
    slug: "compliance-oracle",
    name: "Compliance Oracle",
    tag: "governed AI",
    bestFor: "regulated industries, governance, risk-aware AI",
    url: "/forge/assets/web/compliance-oracle.jpg",
    focalHint: { x: 0.55, y: 0.48 },
  },
  {
    slug: "agent-constellation",
    name: "Agent Constellation",
    tag: "AI agents",
    bestFor: "agentic workflows, orchestration, automation posts",
    url: "/forge/assets/web/agent-constellation.jpg",
    focalHint: { x: 0.56, y: 0.5 },
  },
  {
    slug: "revenue-engine",
    name: "Revenue Engine",
    tag: "growth ops",
    bestFor: "pipeline, CRM, revenue recovery, advisor growth",
    url: "/forge/assets/web/revenue-engine.jpg",
    focalHint: { x: 0.64, y: 0.46 },
  },
  {
    slug: "tool-that-exists",
    name: "Tool That Exists",
    tag: "custom software",
    bestFor: "custom builds, internal tools, workflow automation",
    url: "/forge/assets/web/tool-that-exists.jpg",
    focalHint: { x: 0.62, y: 0.48 },
  },
  {
    slug: "titan-blueprint",
    name: "Titan Blueprint",
    tag: "strategy",
    bestFor: "roadmaps, implementation strategy, transformation plans",
    url: "/forge/assets/web/titan-blueprint.jpg",
    focalHint: { x: 0.6, y: 0.5 },
  },
  {
    slug: "responsible-flame",
    name: "Responsible Flame",
    tag: "safe power",
    bestFor: "responsible AI, trust, safety, executive posts",
    url: "/forge/assets/web/responsible-flame.jpg",
    focalHint: { x: 0.62, y: 0.48 },
  },
];

export function getForgeImage(slug: string): ForgeImage | undefined {
  return FORGE_IMAGES.find((f) => f.slug === slug);
}
