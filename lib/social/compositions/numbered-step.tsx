// Composition: numbered_step (the workhorse for carousel body slides)
// Hairline-ruled row: tiny mono numeral + title + body. Adopted from Claude
// Design's NumberedList layout but rendered as a SINGLE step per slide so
// each play breathes.

import type { Brand } from "../brands";
import { SlideFrame, EmphasizedHeadline } from "../primitives";
import { TOKEN } from "../tokens";

export type NumberedStepProps = {
  brand: Brand;
  index: number;
  total: number;
  title: string;
  body: string;
  emphasize?: string;
  eyebrow?: string;       // optional overline (defaults to "play X / total")
  counter?: string;
};

export function NumberedStepComposition({ index, total, title, body, emphasize, eyebrow, counter }: NumberedStepProps) {
  const tag = eyebrow || `play ${index} of ${total}`;
  return (
    <SlideFrame eyebrow={tag} footerCounter={counter}>
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
        {/* Hairline above */}
        <div style={{ display: "flex", borderTop: `1px solid ${TOKEN.rule}`, height: 1, width: "100%" }} />

        <div style={{ display: "flex", alignItems: "flex-start", gap: 36, paddingTop: 36 }}>
          {/* Tiny mono numeral column */}
          <div
            style={{
              display: "flex",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 28,
              color: TOKEN.ember500,
              fontWeight: 500,
              width: 80,
              paddingTop: 12,
            }}
          >
            {String(index).padStart(2, "0")}
          </div>

          {/* Title + body */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, maxWidth: 820 }}>
            <EmphasizedHeadline
              text={title}
              emphasize={emphasize}
              fontSize={title.length < 40 ? 84 : 64}
              letterSpacing="-0.028em"
              lineHeight={1.05}
            />
            {body ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 28,
                  fontSize: 30,
                  color: TOKEN.fg300,
                  lineHeight: 1.45,
                  fontWeight: 500,
                  maxWidth: 760,
                }}
              >
                {body}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}
