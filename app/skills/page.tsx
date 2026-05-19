"use client";

import { useMemo, useState } from "react";
import { CC_STATE } from "@/lib/cc-state";

const CATEGORIES = [
  "All",
  "CRO",
  "Marketing",
  "Analytics",
  "SEO",
  "Growth",
  "Strategy",
  "Writing",
  "Automation",
  "Data",
  "AI",
  "System",
  "Design",
  "UI",
  "Outreach",
  "Ads",
] as const;

export default function SkillsPage() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("All");

  const filtered = useMemo(() => {
    if (active === "All") return CC_STATE.skills;
    return CC_STATE.skills.filter((s) => s.cat === active);
  }, [active]);

  const countLabel =
    active === "All"
      ? `${CC_STATE.skills.length} skills acquired`
      : `${filtered.length} of ${CC_STATE.skills.length} skills -- ${active}`;

  return (
    <>
      <div className="header fl-reveal">
        <h1>Skills</h1>
        <p className="header-sub" id="skills-count">
          {countLabel}
        </p>
      </div>
      <div className="main">
        <div className="skills-filter fl-reveal">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-btn${cat === active ? " active" : ""}`}
              onClick={() => setActive(cat)}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="skill-grid fl-reveal">
          {filtered.map((skill) => (
            <div className="skill-card" key={skill.name}>
              <div className="skill-name">{skill.name}</div>
              <div className="skill-cat">{skill.cat}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
