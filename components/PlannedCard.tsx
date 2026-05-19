import type { FutureProject, Infrastructure, PlannedProject } from "@/lib/types";

type AnyPlanned = PlannedProject | FutureProject | Infrastructure;

function badgeLabel(project: AnyPlanned): string {
  if ("status" in project && project.status === "spec-ready") return "Spec Ready";
  if ("status" in project && project.status === "future") return "Idea";
  if ("status" in project && project.status === "built") return "Built";
  return "Planned";
}

export function PlannedCard({ project }: { project: AnyPlanned }) {
  return (
    <div className="card">
      {project.gradient && <div className="card-accent" style={{ background: project.gradient }} />}
      <div className="card-header">
        <div className="card-title">{project.title}</div>
        <span className={`badge${badgeLabel(project) === "Built" ? " badge-active" : " badge-planning"}`}>
          {badgeLabel(project)}
        </span>
      </div>
      <div className="card-desc">{project.desc}</div>
      <div className="card-meta">
        {project.stack.map((tech) => (
          <span className="meta-item" key={tech}>
            <span className="meta-dot dot-muted" /> {tech}
          </span>
        ))}
      </div>
      {"phases" in project && project.phases && project.phases > 0 ? (
        <div className="card-meta" style={{ marginTop: 4 }}>
          <span className="meta-item">
            <span className="meta-dot dot-warning" /> {project.phases} build phases
          </span>
        </div>
      ) : null}
    </div>
  );
}
