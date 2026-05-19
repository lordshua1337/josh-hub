const PROJECT_RULES: ReadonlyArray<[ReadonlyArray<string>, string]> = [
  [["stockpilot", "stock-pilot", "stock pilot"], "StockPilot"],
  [["uncommon cents", "uncommon-cents"], "Uncommon Cents"],
  [["the well", "the-well", "well v2", "scripture", "word correction"], "The Well"],
  [["doodleforge", "doodle"], "DoodleForge"],
  [["ctax", "partner", "icp", "30-day"], "CTAX Partner Site"],
  [["ui/ux", "pro max"], "UI/UX Pro Max"],
  [["skill", "command", "sync-hub"], "Skills/Tooling"],
  [["nightcrawler"], "Nightcrawler"],
  [["trend sniper", "trend-sniper", "cash cow", "cash-cow"], "Cash Cow"],
  [["ad intelligence", "ad-intelligence"], "Ad Intelligence"],
  [["pipeline simulator", "pipeline-simulator"], "Pipeline Simulator"],
  [["image forge", "image-forge"], "Image Forge"],
  [["pick & shovel", "pick and shovel"], "Pick & Shovel Suite"],
  [["marcom", "marketing os"], "Marcom Engine"],
  [["partner portal", "partner-portal", "landing page template"], "Partner Portal Templates"],
  [["balanceboss", "balance boss", "bookkeep"], "BalanceBoss"],
  [["lifeforge", "life forge", "life skills"], "LifeForge"],
  [["oculus", "occulus", "wealth management"], "Oculus"],
  [["hero", "boho", "imagegen"], "Image Gen"],
  [["subagent", "claude", "context"], "Claude Config"],
];

export function detectProject(event: string): string {
  const e = event.toLowerCase();
  for (const [keywords, name] of PROJECT_RULES) {
    if (keywords.some((k) => e.includes(k))) return name;
  }
  return "Other";
}

export type EventTypeKey = string;

const EVENT_TYPE_CLASS: Record<string, string> = {
  feature: "feat",
  bugfix: "fix",
  deployment: "deploy",
  skill_created: "skill",
  skills_batch: "skill",
  plan: "plan",
  config: "config",
  refactor: "refactor",
  project: "project",
  docs: "docs",
  playbook_created: "playbook",
};

export function tagClass(type: string): string {
  return EVENT_TYPE_CLASS[type] || "feat";
}

export function trendClass(type: string): string {
  return EVENT_TYPE_CLASS[type] || "feat";
}

export const DOT_CLASS: Record<string, string> = {
  feature: "build",
  "feature+bugfix": "fix",
  bugfix: "fix",
  deployment: "deploy",
  milestone: "deploy",
  project: "build",
  "project+plan+feature": "build",
  plan: "build",
  config: "build",
  refactor: "build",
  skill_created: "build",
  skills_batch: "build",
  docs: "build",
  playbook_created: "build",
  audit: "fix",
};
