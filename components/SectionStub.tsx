type Props = {
  title: string;
  tagline: string;
  bullets: string[];
};

export function SectionStub({ title, tagline, bullets }: Props) {
  return (
    <>
      <div className="header fl-reveal">
        <h1>{title}</h1>
        <p className="header-sub">{tagline}</p>
      </div>
      <div className="main">
        <div className="card fl-reveal" style={{ padding: 28 }}>
          <div className="section-label" style={{ marginBottom: 12 }}>
            Planned for this section
          </div>
          <ul className="grocery-list">
            {bullets.map((b, i) => (
              <li key={i}>
                <span className="grocery-tag grocery-tag-ui">PLAN</span>
                {b}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 14 }}>
            Not built yet. Building order is your call — bring it up when you're ready.
          </p>
        </div>
      </div>
    </>
  );
}
