export type Skill = { name: string; cat: string };

export type Repo = { name: string; url: string; live: string | null; note?: string };

export type BITLEntry = {
  name: string;
  soul: string;
  tier: number;
  status: "alive" | "complete" | "dormant";
  missing: string | null;
};

export type PlannedProject = {
  name: string;
  title: string;
  desc: string;
  type: string;
  spec: string;
  notes: string;
  stack: string[];
  priority: number;
  status?: "spec-ready" | "future" | "planned";
  phases?: number;
  gradient?: string;
};

export type FutureProject = {
  name: string;
  title: string;
  desc: string;
  stack: string[];
  phases: number;
  status: "future";
  gradient: string;
  icon: string;
};

export type Infrastructure = {
  name: string;
  title: string;
  desc: string;
  stack: string[];
  status: "built";
  gradient: string;
  icon: string;
  consumers: string[];
};

export type Integration = {
  id: string;
  name: string;
  icon: string;
  desc: string;
  color: string;
};

export type XPEventType =
  | "feature"
  | "feature+bugfix"
  | "bugfix"
  | "deployment"
  | "milestone"
  | "project"
  | "project+plan+feature"
  | "plan"
  | "config"
  | "refactor"
  | "skill_created"
  | "skills_batch"
  | "docs"
  | "playbook_created"
  | "audit";

export type XPLogEntry = {
  date: string;
  event: string;
  xp: number;
  type: XPEventType;
};

export type CCState = {
  xp: number;
  level: number;
  title: string;
  total_tasks_completed: number;
  skills_created: number;
  commits_made: number;
  plans_executed: number;
  deploys: number;
  skills: Skill[];
  repos: Repo[];
  bitl: BITLEntry[];
  planned_projects: PlannedProject[];
  future_projects: FutureProject[];
  infrastructure: Infrastructure[];
  integrations: Integration[];
  xp_log: XPLogEntry[];
};
