import Link from "next/link";
import type { Integration } from "@/lib/types";

export function IntegrationsRow({ integrations }: { integrations: Integration[] }) {
  return (
    <div className="integrations-row" id="int-row">
      {integrations.map((int) => (
        <Link key={int.id} className="int-chip" href={`/integrations#${int.id}`} title={int.desc}>
          <span className="int-chip-dot" style={{ background: int.color }} />
          {int.name}
        </Link>
      ))}
    </div>
  );
}
