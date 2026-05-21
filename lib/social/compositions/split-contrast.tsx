// Composition: split_contrast — "what they said" struck through, "what's true" in ember
// Top half muted + struck; amber band divider; bottom half full-color with
// ember emphasis on one word.

import type { Brand } from "../brands";
import { SlideFrame, EmphasizedHeadline, Eyebrow } from "../primitives";
import { TOKEN } from "../tokens";

export type SplitContrastProps = {
  brand: Brand;
  theySaidLabel?: string;
  theySaid: string;
  trueLabel?: string;
  trueLine: string;
  emphasize?: string;
  counter?: string;
};

export function SplitContrastComposition({
  theySaidLabel = "what they said",
  theySaid,
  trueLabel = "what's true",
  trueLine,
  emphasize,
  counter,
}: SplitContrastProps) {
  return (
    <SlideFrame eyebrow="reframe" footerCounter={counter}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 56 }}>
        {/* TOP — what they said (muted + struck) */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", marginBottom: 20 }}>
            <Eyebrow color={TOKEN.fg400}>{theySaidLabel}</Eyebrow>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 56,
              fontWeight: 500,
              color: TOKEN.fg400,
              lineHeight: 1.18,
              letterSpacing: "-0.018em",
              textDecoration: "line-through",
              textDecorationColor: `${TOKEN.fg500}aa`,
              textDecorationThickness: "2px",
              maxWidth: 880,
            }}
          >
            {theySaid}
          </div>
        </div>

        {/* divider — ember band */}
        <div
          style={{
            display: "flex",
            height: 6,
            width: 220,
            backgroundImage: `linear-gradient(90deg, ${TOKEN.ember700} 0%, ${TOKEN.ember500} 50%, ${TOKEN.ember050} 100%)`,
            borderRadius: 3,
          }}
        />

        {/* BOTTOM — what's true */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", marginBottom: 20 }}>
            <Eyebrow color={TOKEN.ember500}>{trueLabel}</Eyebrow>
          </div>
          <EmphasizedHeadline
            text={trueLine}
            emphasize={emphasize}
            fontSize={trueLine.length < 60 ? 76 : 56}
            letterSpacing="-0.025em"
            lineHeight={1.08}
          />
        </div>
      </div>
    </SlideFrame>
  );
}
