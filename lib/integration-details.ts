import { CC_STATE } from "./cc-state";

export type IntegrationDetail = {
  color: string;
  details: [string, string][];
  links: { label: string; href: string }[];
};

export const INT_DETAILS: Record<string, IntegrationDetail> = {
  "claude-code": {
    color: "#D97706",
    details: [
      ["Model", "Claude Opus 4.7"],
      ["Skills", `${CC_STATE.skills_created} installed`],
      ["Agents", "4 subagents (haiku + sonnet)"],
      ["Playbooks", "Nightcrawler, Afterburner"],
    ],
    links: [{ label: "View Skills", href: "/skills" }],
  },
  github: {
    color: "#1A1612",
    details: [
      ["Username", "lordshua1337"],
      ["Repos", `${CC_STATE.repos.length} repositories`],
      ["Commits", `${CC_STATE.commits_made} total`],
      ["Active", "Daily activity"],
    ],
    links: [{ label: "Profile", href: "https://github.com/lordshua1337" }],
  },
  vercel: {
    color: "#000",
    details: [
      ["Account", "lordshua1337"],
      ["Live Apps", `${CC_STATE.deploys} deploys`],
      ["Plan", "Hobby"],
      ["Auto-Deploy", "On main push"],
    ],
    links: [{ label: "Dashboard", href: "https://vercel.com/dashboard" }],
  },
  "github-pages": {
    color: "#2563EB",
    details: [
      ["Hosts", "Static SPAs + AEO pages"],
      ["Auto-Build", "On main push"],
      ["Sites", "Partner Site + josh-hub"],
    ],
    links: [],
  },
  anthropic: {
    color: "#CC785C",
    details: [
      ["Model", "Claude Sonnet 4.6"],
      ["Used by", "The Well, Uncommon Cents, StockPilot"],
      ["Caching", "Prompt caching enabled"],
    ],
    links: [],
  },
  stripe: {
    color: "#635BFF",
    details: [
      ["Mode", "Test"],
      ["Used by", "DoodleForge"],
      ["Webhooks", "checkout.session.completed"],
    ],
    links: [{ label: "Dashboard", href: "https://dashboard.stripe.com" }],
  },
  "mcp-servers": {
    color: "#9333EA",
    details: [
      ["Context7", "Docs lookup"],
      ["ImageGen", "OpenAI image generation"],
      ["Canva", "Design API"],
      ["GitHub", "Repo operations"],
    ],
    links: [],
  },
  nightcrawler: {
    color: "#1E293B",
    details: [
      ["Modes", "Build / Focus / Max / Omni"],
      ["Schedule", "Manual or via /loop"],
      ["Output", "Activity log entries"],
    ],
    links: [],
  },
};
