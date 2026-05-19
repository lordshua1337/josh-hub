import type { DashboardProject } from "@/lib/dashboard-projects";
import { CopyButton } from "./CopyButton";

export function DashboardProjectCard({ project }: { project: DashboardProject }) {
  return (
    <div className="card">
      <div className="card-accent" style={{ background: project.gradient }} />
      <div className="card-header">
        <div className="card-title">{project.title}</div>
        <span className={`badge${project.badge === "Active" ? " badge-active" : " badge-active"}`}>
          {project.badge}
        </span>
      </div>
      <div className="card-desc">{project.desc}</div>
      <div className="card-meta">
        {project.meta.map((m, i) => (
          <span className="meta-item" key={i}>
            <span className={`meta-dot dot-${m.dot}`} /> {m.label}
          </span>
        ))}
      </div>
      <div className="card-actions">
        {project.aeoLinks ? (
          project.aeoLinks.map((link) => (
            <a key={link.href} className="act-btn" href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))
        ) : (
          <>
            {project.live && (
              <a className="act-btn act-btn-primary" href={project.live} target="_blank" rel="noreferrer">
                Live Site
              </a>
            )}
            {project.github && (
              <a className="act-btn" href={project.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            )}
            {project.pathCopy && (
              <CopyButton text={project.pathCopy} className="act-btn">
                Copy Path
              </CopyButton>
            )}
            {project.devCmd && (
              <CopyButton text={project.devCmd} className="act-btn">
                Run Dev
              </CopyButton>
            )}
          </>
        )}
      </div>
    </div>
  );
}
