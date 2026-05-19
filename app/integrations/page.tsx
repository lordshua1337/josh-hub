import { CC_STATE } from "@/lib/cc-state";
import { INT_DETAILS } from "@/lib/integration-details";
import { Icon } from "@/lib/icons";

export default function IntegrationsPage() {
  return (
    <>
      <div className="header fl-reveal">
        <h1>Integrations</h1>
        <p className="header-sub">Everything connected to the Command Center</p>
      </div>
      <div className="main">
        <div className="int-grid fl-reveal">
          {CC_STATE.integrations.map((int) => {
            const detail = INT_DETAILS[int.id];
            const color = detail?.color || int.color;
            return (
              <div className="int-card" id={int.id} key={int.id}>
                <div className="card-accent" style={{ background: color }} />
                <div className="int-card-header">
                  <div className="int-card-icon" style={{ background: color }}>
                    <Icon name={int.icon} />
                  </div>
                  <div>
                    <div className="int-card-name">{int.name}</div>
                    <div className="int-card-status">
                      <span className="int-card-status-dot" />
                      Connected
                    </div>
                  </div>
                </div>
                <div className="int-card-desc">{int.desc}</div>
                {detail && (
                  <div className="int-card-details">
                    {detail.details.map(([label, value]) => (
                      <div className="int-detail-row" key={label}>
                        <span className="int-detail-label">{label}</span>
                        <span className="int-detail-value">{value}</span>
                      </div>
                    ))}
                    {detail.links.length > 0 && (
                      <div className="int-card-actions">
                        {detail.links.map((l) => (
                          <a
                            key={l.href}
                            className="act-btn"
                            href={l.href}
                            target={l.href.startsWith("http") ? "_blank" : undefined}
                            rel="noreferrer"
                          >
                            {l.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
