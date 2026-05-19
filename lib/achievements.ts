export type UnlockedAchievement = {
  icon: string;
  name: string;
  desc: string;
  date: string;
};

export type LockedAchievement = {
  name: string;
  desc: string;
  progress: string;
  pct: number;
};

export const UNLOCKED: UnlockedAchievement[] = [
  { icon: "1", name: "First Blood", desc: "Made your first commit", date: "Feb 26" },
  { icon: "10", name: "Commit Machine", desc: "Made 10+ commits", date: "Mar 01" },
  { icon: "50", name: "Unstoppable", desc: "Made 50+ commits", date: "Mar 02" },
  { icon: "10", name: "Skill Collector", desc: "Created 10+ skills", date: "Mar 01" },
  { icon: "50", name: "Arsenal Unlocked", desc: "Created 50+ skills", date: "Mar 01" },
  { icon: "5", name: "Ship It", desc: "Shipped 5+ features", date: "Feb 28" },
  { icon: "20", name: "Feature Factory", desc: "Shipped 20+ features", date: "Mar 01" },
  { icon: "▲", name: "Live Wire", desc: "First deployment to production", date: "Mar 01" },
  { icon: "5", name: "Getting Serious", desc: "Reached level 5", date: "Mar 01" },
  { icon: "✎", name: "Playbook Author", desc: "Created your first playbook", date: "Mar 01" },
];

export const LOCKED: LockedAchievement[] = [
  { name: "Double Digits", desc: "Reach level 10", progress: "LVL 11/10", pct: 100 },
  { name: "Inspector", desc: "Complete your first audit", progress: "0/1", pct: 0 },
  { name: "Consistency", desc: "Earn XP 7 days in a row", progress: "3/7 days", pct: 42.86 },
  { name: "Quarter Century", desc: "Reach level 25", progress: "LVL 11/25", pct: 44 },
  { name: "Hundred Club", desc: "Reach level 100", progress: "LVL 11/100", pct: 11 },
  { name: "Token Saver", desc: "Hit 30% prompt cache hit rate", progress: "Tracking required", pct: 0 },
];
