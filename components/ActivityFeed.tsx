import Link from "next/link";
import type { XPLogEntry } from "@/lib/types";
import { detectProject, DOT_CLASS } from "@/lib/project-detect";

export function ActivityFeed({
  entries,
  showViewAll = true,
  compact = false,
}: {
  entries: XPLogEntry[];
  showViewAll?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`activity-log${compact ? " recent-log" : ""}`}>
      {entries.map((entry, idx) => {
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
      })}
      {showViewAll && (
        <Link className="view-all-link" href="/activity">
          View full build log &gt;
        </Link>
      )}
    </div>
  );
}
