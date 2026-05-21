// Composition: field_report — military-comms styled status board.
// Timestamp line + headline with ember emphasis + tagged bullet lines.
// Ported from Claude Design's FieldReport layout.

import type { Brand } from "../brands";
import { SlideFrame, EmphasizedHeadline } from "../primitives";
import { TOKEN } from "../tokens";

export type FieldReportLine = { tag?: string; text: string };

export type FieldReportProps = {
  brand: Brand;
  eyebrow?: string;
  timestamp: string;       // e.g. "60 days after cutover"
  title: string;
  emphasize?: string;
  lines: FieldReportLine[];
  counter?: string;
};

export function FieldReportComposition({
  eyebrow = "field report",
  timestamp,
  title,
  emphasize,
  lines,
  counter,
}: FieldReportProps) {
  return (
    <SlideFrame eyebrow={eyebrow} footerCounter={counter}>
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 22,
            color: TOKEN.fg400,
            letterSpacing: "0.04em",
            marginBottom: 18,
          }}
        >
          {timestamp}
        </div>

        <div style={{ display: "flex", marginBottom: 44, maxWidth: 880 }}>
          <EmphasizedHeadline
            text={title}
            emphasize={emphasize}
            fontSize={title.length < 50 ? 80 : 60}
            letterSpacing="-0.028em"
            lineHeight={1.02}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {lines.map((ln, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 18,
                alignItems: "baseline",
                fontSize: 22,
                color: TOKEN.fg200,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              <div style={{ display: "flex", color: TOKEN.ember500, width: 36 }}>{ln.tag || "›"}</div>
              <div style={{ display: "flex", flex: 1 }}>{ln.text}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  );
}
