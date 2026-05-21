// big_stat — case-study / field-report style. One enormous number in
// ember gradient, a small mono unit stacked below, a captioned takeaway,
// optional `// source` line at the foot. Ported from the Claude Design
// BigStatLayout — uses our SlideFrame + Ember primitives.

import { SlideFrame, Ember } from "../primitives";
import { TOKEN } from "../tokens";

export type BigStatSlot = {
  eyebrow?: string;       // mono tag at top, e.g. "field report"
  stat: string;           // the number itself, e.g. "11.4"
  unit?: string;          // small line below stat, e.g. "HOURS / WEEK RECOVERED"
  caption: string;        // the takeaway sentence
  source?: string;        // optional attribution, rendered `// source`
  footerCounter?: string; // injected by render route for carousels
};

export function BigStat(p: BigStatSlot) {
  return (
    <SlideFrame eyebrow={p.eyebrow} footerCounter={p.footerCounter}>
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 360,
            lineHeight: 0.85,
            fontWeight: 800,
            letterSpacing: "-0.05em",
            marginBottom: 12,
          }}
        >
          <Ember>{p.stat}</Ember>
        </div>

        {p.unit ? (
          <div
            style={{
              display: "flex",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 26,
              color: TOKEN.fg300,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: 36,
            }}
          >
            {p.unit}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            fontSize: 44,
            lineHeight: 1.2,
            fontWeight: 600,
            color: TOKEN.fg100,
            maxWidth: 840,
            letterSpacing: "-0.012em",
          }}
        >
          {p.caption}
        </div>

        {p.source ? (
          <div
            style={{
              display: "flex",
              marginTop: 32,
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 20,
              color: TOKEN.fg400,
            }}
          >
            {`// ${p.source}`}
          </div>
        ) : null}
      </div>
    </SlideFrame>
  );
}
