import { CC_STATE } from "@/lib/cc-state";
import { DASHBOARD_PROJECTS } from "@/lib/dashboard-projects";
import { Icon } from "@/lib/icons";

export default function ProjectsPage() {
  const vercel = DASHBOARD_PROJECTS.filter((p) => p.live && p.live.includes("vercel.app"));
  const ghPages = DASHBOARD_PROJECTS.filter((p) => p.live && p.live.includes("github.io"));
  const planned = CC_STATE.planned_projects;

  return (
    <>
      <div className="header fl-reveal">
        <h1>Projects</h1>
        <p className="header-sub">
          {DASHBOARD_PROJECTS.length} live · {planned.length} planned · {CC_STATE.repos.length} repos
        </p>
      </div>
      <div className="main">
        <div className="deploy-section fl-reveal">
          <div className="deploy-section-header">
            <div className="deploy-section-icon vercel-icon">
              <Icon name="cloud" />
            </div>
            <div className="deploy-section-title">Vercel</div>
            <span className="deploy-section-count">{vercel.length}</span>
          </div>
          <div className="project-grid">
            {vercel.map((p) => (
              <div className="pcard" key={p.title} style={{ ["--pcard-accent" as string]: "var(--accent)" }}>
                <div className="pcard-top">
                  <div className="pcard-info">
                    <div className="pcard-name">{p.title}</div>
                    <div className="pcard-desc">{p.desc}</div>
                  </div>
                </div>
                <div className="pcard-tags">
                  {p.meta.map((m, i) => (
                    <span className="pcard-tag" key={i}>
                      {m.label}
                    </span>
                  ))}
                </div>
                <div className="pcard-actions">
                  {p.live && (
                    <a className="pcard-btn pcard-btn-primary" href={p.live} target="_blank" rel="noreferrer">
                      Visit →
                    </a>
                  )}
                  {p.github && (
                    <a className="pcard-btn" href={p.github} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {ghPages.length > 0 && (
          <div className="deploy-section fl-reveal">
            <div className="deploy-section-header">
              <div className="deploy-section-icon gh-icon">
                <Icon name="github" />
              </div>
              <div className="deploy-section-title">GitHub Pages</div>
              <span className="deploy-section-count">{ghPages.length}</span>
            </div>
            <div className="project-grid">
              {ghPages.map((p) => (
                <div className="pcard" key={p.title}>
                  <div className="pcard-top">
                    <div className="pcard-info">
                      <div className="pcard-name">{p.title}</div>
                      <div className="pcard-desc">{p.desc}</div>
                    </div>
                  </div>
                  <div className="pcard-tags">
                    {p.meta.map((m, i) => (
                      <span className="pcard-tag" key={i}>
                        {m.label}
                      </span>
                    ))}
                  </div>
                  <div className="pcard-actions">
                    {p.live && (
                      <a className="pcard-btn pcard-btn-primary" href={p.live} target="_blank" rel="noreferrer">
                        Visit →
                      </a>
                    )}
                    {p.github && (
                      <a className="pcard-btn" href={p.github} target="_blank" rel="noreferrer">
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="deploy-section fl-reveal">
          <div className="deploy-section-header">
            <div className="deploy-section-title">Repos</div>
            <span className="deploy-section-count">{CC_STATE.repos.length}</span>
          </div>
          <div className="project-grid">
            {CC_STATE.repos.map((r) => (
              <div className="pcard" key={r.name}>
                <div className="pcard-top">
                  <div className="pcard-info">
                    <div className="pcard-name">{r.name}</div>
                    <div className="pcard-desc">
                      {r.live ? (
                        <a href={r.live} target="_blank" rel="noreferrer">
                          {r.live}
                        </a>
                      ) : r.note ? (
                        <em>{r.note}</em>
                      ) : (
                        <span>Repo-only</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pcard-actions">
                  <a className="pcard-btn" href={r.url} target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                  {r.live && (
                    <a className="pcard-btn pcard-btn-primary" href={r.live} target="_blank" rel="noreferrer">
                      Live →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
