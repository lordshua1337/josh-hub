"use client";

import { useMemo, useState } from "react";
import { CC_STATE } from "@/lib/cc-state";
import { detectProject, DOT_CLASS, trendClass } from "@/lib/project-detect";

const FILTERS: Record<string, ((t: string) => boolean) | null> = {
  All: null,
  Features: (t) => t === "feature" || t === "feature+bugfix",
  Bugfixes: (t) => t === "bugfix",
  Deploys: (t) => t === "deployment" || t === "milestone",
  Plans: (t) => t === "plan",
  Skills: (t) => t === "skill_created" || t === "skills_batch",
  Config: (t) => t === "config",
};

export default function ActivityPage() {
  const [active, setActive] = useState<keyof typeof FILTERS>("All");

  const { byType, byTypeXP } = useMemo(() => {
    const byType: Record<string, number> = {};
    const byTypeXP: Record<string, number> = {};
    CC_STATE.xp_log.forEach((e) => {
      byType[e.type] = (byType[e.type] || 0) + 1;
      byTypeXP[e.type] = (byTypeXP[e.type] || 0) + e.xp;
    });
    return { byType, byTypeXP };
  }, []);

  const sortedTypes = useMemo(
    () => Object.keys(byType).sort((a, b) => byType[b] - byType[a]),
    [byType]
  );
  const maxCount = byType[sortedTypes[0]] || 1;

  const filteredEntries = useMemo(() => {
    const pred = FILTERS[active];
    if (!pred) return CC_STATE.xp_log;
    return CC_STATE.xp_log.filter((e) => pred(e.type));
  }, [active]);

  const featureCount = byType.feature || 0;
  const totalEntries = CC_STATE.xp_log.length;
  const featurePct = Math.round((featureCount / totalEntries) * 100);
  const skillXP = (byTypeXP.skill_created || 0) + (byTypeXP.skills_batch || 0);

  // Topical projects from last 15 entries
  const recentProjects = useMemo(() => {
    const counts: Record<string, number> = {};
    CC_STATE.xp_log.slice(0, 15).forEach((e) => {
      const proj = detectProject(e.event);
      counts[proj] = (counts[proj] || 0) + 1;
    });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  }, []);

  const gaps: string[] = [];
  if (!byType.test) gaps.push("Testing");
  if (!byType.audit) gaps.push("Auditing");
  if (!byType.review) gaps.push("Code Review");

  return (
    <>
      <div className="header fl-reveal">
        <h1>Activity Log</h1>
        <p className="header-sub">Full build history, training trends, and personalized recommendations.</p>
      </div>

      <div className="main">
        <div className="section-header fl-reveal">
          <div className="section-label">Training Trends</div>
          <span className="log-count">All time</span>
        </div>
        <div className="trends-section fl-reveal">
          <div className="trends-cols">
            <div className="trends-chart">
              <div className="trends-chart-title">Activity by Type</div>
              {sortedTypes.map((t) => {
                const pct = Math.round((byType[t] / maxCount) * 100);
                return (
                  <div className="trend-row" key={t}>
                    <div className="trend-label">{t.replace(/_/g, " ")}</div>
                    <div className="trend-bar-track">
                      <div className={`trend-bar-fill trend-bar-fill-${trendClass(t)}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="trend-val">{byType[t]}</div>
                  </div>
                );
              })}
            </div>
            <div className="trends-focus">
              <div className="trends-focus-title">What You&apos;ve Been Learning</div>
              <div className="focus-item">
                <div className="focus-rank">1</div>
                <div className="focus-text">
                  <strong>Feature Development</strong> dominates at {featurePct}% of all activity. You&apos;re in builder mode -- {featureCount} features shipped across {recentProjects.length} projects.
                </div>
              </div>
              <div className="focus-item">
                <div className="focus-rank focus-rank-2">2</div>
                <div className="focus-text">
                  <strong>Skill Arsenal</strong> is your second biggest investment. {CC_STATE.skills_created} skills earning {skillXP.toLocaleString()} XP. Heavy focus on CRO, marketing, and growth automation.
                </div>
              </div>
              <div className="focus-item">
                <div className="focus-rank focus-rank-3">3</div>
                <div className="focus-text">
                  <strong>Current Focus:</strong> {recentProjects.slice(0, 3).join(", ")}. Your last 15 entries span {recentProjects.length} different projects.
                </div>
              </div>
              {gaps.length > 0 && (
                <div className="focus-item">
                  <div className="focus-rank" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
                    !
                  </div>
                  <div className="focus-text">
                    <strong>Blind Spots:</strong> {gaps.join(", ")} -- zero activity in these areas. Consider adding them to your workflow.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="section-header fl-reveal" style={{ marginTop: 32 }}>
          <div className="section-label">Full Build Log</div>
          <span className="log-count">
            {filteredEntries.length} entr{filteredEntries.length === 1 ? "y" : "ies"}
          </span>
        </div>

        <div className="log-filters fl-reveal">
          {Object.keys(FILTERS).map((label) => (
            <button
              key={label}
              className={`log-filter-btn${active === label ? " active" : ""}`}
              onClick={() => setActive(label as keyof typeof FILTERS)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="activity-log fl-reveal">
          {filteredEntries.length === 0 ? (
            <div className="log-item">
              <div className="log-body">
                <div className="log-msg" style={{ color: "var(--text-tertiary)" }}>
                  No entries match this filter.
                </div>
              </div>
            </div>
          ) : (
            filteredEntries.map((entry, idx) => {
              const dotType = DOT_CLASS[entry.type] || "build";
              const project = detectProject(entry.event);
              return (
                <div className="log-item" key={`${entry.date}-${idx}`}>
                  <div className={`log-dot log-dot-${dotType}`} />
                  <div className="log-body">
                    <div className="log-msg">{entry.event}</div>
                    <div className="log-time">
                      {entry.date} -- {project} (+{entry.xp} XP)
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
