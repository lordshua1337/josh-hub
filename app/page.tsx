import Link from "next/link";
import { CC_STATE } from "@/lib/cc-state";
import { DASHBOARD_PROJECTS } from "@/lib/dashboard-projects";
import { Sprite } from "@/components/Sprite";
import { IntegrationsRow } from "@/components/IntegrationsRow";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PlannedCard } from "@/components/PlannedCard";
import { DashboardProjectCard } from "@/components/DashboardProjectCard";
import { CopyButton } from "@/components/CopyButton";
import { Icon } from "@/lib/icons";

const UNLOCKED_ACHIEVEMENTS = [
  "First Blood",
  "Commit Machine",
  "Unstoppable",
  "Skill Collector",
  "Arsenal Unlocked",
  "Ship It",
];

export default function Dashboard() {
  const xpPct = Math.min(100, Math.round((CC_STATE.xp / 12000) * 100));
  const nextLevelXP = 12000 - CC_STATE.xp;
  const recentEntries = CC_STATE.xp_log.slice(0, 15);

  return (
    <>
      <div className="header">
        <h1>Command Center</h1>
        <p className="header-sub">Level up. Ship code. Earn XP.</p>
      </div>

      <div className="main">
        {/* XP HERO */}
        <div className="xp-hero fl-reveal">
          <div className="fl-scanline" aria-hidden />
          <div className="xp-hero-inner">
            <div className="xp-char">
              <div className="xp-char-glow" />
              <Sprite level={CC_STATE.level} />
            </div>
            <div className="xp-info">
              <div className="xp-title-row">
                <span className="xp-level">LVL {CC_STATE.level}</span>
                <span className="xp-title-badge">{CC_STATE.title}</span>
              </div>
              <div className="xp-subtitle">
                {nextLevelXP > 0 ? `${nextLevelXP} XP to Level ${CC_STATE.level + 1}` : "Level up ready"}
              </div>
              <div className="xp-bar-wrap">
                <div className="xp-bar-header">
                  <span className="xp-bar-label">
                    {CC_STATE.xp.toLocaleString()} / {(12000).toLocaleString()} XP
                  </span>
                  <span className="xp-bar-pct">{xpPct}%</span>
                </div>
                <div className="xp-bar-track">
                  <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
              <div className="xp-counters">
                <Link className="xp-counter" href="/activity" style={{ textDecoration: "none" }}>
                  <strong>{CC_STATE.total_tasks_completed}</strong> Tasks
                </Link>
                <Link className="xp-counter" href="/activity" style={{ textDecoration: "none" }}>
                  <strong>{CC_STATE.commits_made}</strong> Commits
                </Link>
                <Link className="xp-counter" href="/skills" style={{ textDecoration: "none" }}>
                  <strong>{CC_STATE.skills_created}</strong> Skills
                </Link>
                <Link className="xp-counter" href="/activity" style={{ textDecoration: "none" }}>
                  <strong>{CC_STATE.deploys}</strong> Deploys
                </Link>
                <span className="xp-counter">
                  <strong>{CC_STATE.repos.length}</strong> Repos
                </span>
              </div>
            </div>
          </div>
          <IntegrationsRow integrations={CC_STATE.integrations} />
        </div>

        {/* Achievement Pills (compact preview) */}
        <div className="ach-preview fl-reveal">
          {UNLOCKED_ACHIEVEMENTS.map((name) => (
            <div className="ach-pill" key={name}>
              <span className="ach-pill-icon">*</span>
              {name}
            </div>
          ))}
          <Link className="ach-pill ach-pill-more" href="/achievements">
            +4 more &gt;
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="stats-bar fl-reveal">
          <div className="stat-card">
            <Link className="stat-link" href="/activity">
              <div className="stat-label">Active Projects</div>
              <div className="stat-num">{CC_STATE.repos.length}</div>
              <div className="stat-delta">All on GitHub</div>
              <div className="stat-go">View activity &gt;</div>
            </Link>
          </div>
          <div className="stat-card">
            <Link className="stat-link" href="/activity">
              <div className="stat-label">Total XP</div>
              <div className="stat-num">{CC_STATE.xp.toLocaleString()}</div>
              <div className="stat-delta">
                Level {CC_STATE.level} {CC_STATE.title}
              </div>
              <div className="stat-go">View breakdown &gt;</div>
            </Link>
          </div>
          <div className="stat-card">
            <Link className="stat-link" href="/skills">
              <div className="stat-label">Skills Created</div>
              <div className="stat-num">{CC_STATE.skills_created}</div>
              <div className="stat-delta">Growth + marketing</div>
              <div className="stat-go">Browse skills &gt;</div>
            </Link>
          </div>
          <div className="stat-card">
            <Link className="stat-link" href="/achievements">
              <div className="stat-label">Achievements</div>
              <div className="stat-num">10</div>
              <div className="stat-delta">6 more to unlock</div>
              <div className="stat-go">View all &gt;</div>
            </Link>
          </div>
        </div>

        {/* Quick Access */}
        <div className="section-header fl-reveal">
          <div className="section-label">Quick Access</div>
        </div>
        <div className="quick-bar fl-reveal">
          <a className="quick-card" href="https://github.com/lordshua1337" target="_blank" rel="noreferrer">
            <div
              className="quick-icon"
              style={{ background: "var(--text)", color: "var(--bg)", borderRadius: "50%" }}
            >
              <Icon name="github" />
            </div>
            <div>
              <div className="quick-label">GitHub Profile</div>
              <div className="quick-sub">lordshua1337</div>
            </div>
          </a>
          <a className="quick-card" href="https://ctax-partner-site.vercel.app" target="_blank" rel="noreferrer">
            <div className="quick-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <Icon name="globe" />
            </div>
            <div>
              <div className="quick-label">Partner Site (Live)</div>
              <div className="quick-sub">ctax-partner-site.vercel.app</div>
            </div>
          </a>
          <CopyButton
            text="cd ~/projects/ctax-partner-site && npx http-server -p 3000 -c-1"
            className="quick-card"
          >
            <div className="quick-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
              <Icon name="terminal" />
            </div>
            <div>
              <div className="quick-label">Start Dev Server</div>
              <div className="quick-sub">Click to copy command</div>
            </div>
          </CopyButton>
        </div>

        {/* Projects */}
        <div className="section-header fl-reveal">
          <div className="section-label">Projects</div>
          <Link className="nav-link" href="/projects" style={{ fontSize: 12 }}>
            View public showcase &gt;
          </Link>
        </div>
        <div className="projects fl-reveal">
          {DASHBOARD_PROJECTS.map((p) => (
            <DashboardProjectCard key={p.title} project={p} />
          ))}
        </div>

        {/* Planned Projects */}
        <div className="section-header fl-reveal">
          <div className="section-label">Planned Projects</div>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Spec ready, not yet built</span>
        </div>
        <div className="projects fl-reveal">
          {CC_STATE.planned_projects.map((p) => (
            <PlannedCard key={p.name} project={p} />
          ))}
        </div>

        {/* Future Projects */}
        <div className="section-header fl-reveal">
          <div className="section-label">Future Projects</div>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Ideas on deck</span>
        </div>
        <div className="projects fl-reveal">
          {CC_STATE.future_projects.map((p) => (
            <PlannedCard key={p.name} project={p} />
          ))}
        </div>

        {/* Infrastructure */}
        <div className="section-header fl-reveal">
          <div className="section-label">Infrastructure</div>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            Standalone packages and functions
          </span>
        </div>
        <div className="projects fl-reveal">
          {CC_STATE.infrastructure.map((p) => (
            <PlannedCard key={p.name} project={p} />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="section-header fl-reveal">
          <div className="section-label">Recent Activity</div>
          <Link className="nav-link" href="/activity" style={{ fontSize: 12 }}>
            View all &gt;
          </Link>
        </div>
        <div className="fl-reveal">
          <ActivityFeed entries={recentEntries} showViewAll compact />
        </div>
      </div>
    </>
  );
}
