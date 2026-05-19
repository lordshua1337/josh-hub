import { LOCKED, UNLOCKED } from "@/lib/achievements";

export default function AchievementsPage() {
  return (
    <>
      <div className="header fl-reveal">
        <h1>Achievements</h1>
        <p className="header-sub">
          {UNLOCKED.length} / {UNLOCKED.length + LOCKED.length} unlocked
        </p>
      </div>
      <div className="main">
        <div className="ach-section fl-reveal">
          <div className="section-header">
            <span className="section-label">Unlocked</span>
          </div>
          <div className="ach-grid-unlocked">
            {UNLOCKED.map((ach) => (
              <div className="ach-card ach-unlocked" key={ach.name}>
                <div className="ach-icon">{ach.icon}</div>
                <div className="ach-info">
                  <div className="ach-name">{ach.name}</div>
                  <div className="ach-desc">{ach.desc}</div>
                </div>
                <div className="ach-date">{ach.date}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ach-section fl-reveal">
          <div className="section-header">
            <span className="section-label">Locked</span>
          </div>
          <div className="ach-grid-locked">
            {LOCKED.map((ach) => (
              <div className="ach-card ach-locked" key={ach.name}>
                <div className="ach-card-top">
                  <div className="ach-icon">?</div>
                  <div className="ach-info">
                    <div className="ach-name">{ach.name}</div>
                    <div className="ach-desc">{ach.desc}</div>
                  </div>
                  <div className="ach-progress">{ach.progress}</div>
                </div>
                <div className="ach-progress-row">
                  <div className="ach-progress-bar">
                    <div className="ach-progress-fill" style={{ width: `${ach.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
