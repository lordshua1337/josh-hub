// Composition: declaration / hero
// Asymmetric headline with ember-gradient emphasis on one word, optional
// mono kicker above (rendered as the slide's "// eyebrow"), optional
// supporting footer below.

import type { Brand } from "../brands";
import { SlideFrame, EmphasizedHeadline, fitFontSize } from "../primitives";
import { TOKEN } from "../tokens";

export type DeclarationProps = {
  brand: Brand;
  kicker?: string;
  headline: string;
  emphasize?: string;
  subtitle?: string;
  footer?: string;
  counter?: string;
  backgroundImageUrl?: string;
  focalX?: number;
  focalY?: number;
  zoom?: number;
  overlay?: "subtle" | "strong" | "fade-bottom" | "wordmark" | "none";
};

export function DeclarationComposition({ kicker, headline, emphasize, subtitle, footer, counter, backgroundImageUrl, focalX, focalY, zoom, overlay }: DeclarationProps) {
  return (
    <SlideFrame
      eyebrow={kicker}
      footerCounter={counter}
      backgroundImageUrl={backgroundImageUrl}
      focalX={focalX}
      focalY={focalY}
      zoom={zoom}
      overlay={overlay}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: 820,
        }}
      >
        <EmphasizedHeadline
          text={headline}
          emphasize={emphasize}
          fontSize={fitFontSize(headline, { width: 820, maxLines: 3, candidates: [132, 116, 96, 80], weight: 800 })}
          letterSpacing="-0.04em"
          lineHeight={0.98}
        />
        {subtitle ? (
          <div
            style={{
              display: "flex",
              marginTop: 36,
              fontSize: 36,
              lineHeight: 1.35,
              color: TOKEN.fg200,
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              maxWidth: 820,
              letterSpacing: "-0.012em",
            }}
          >
            {subtitle}
          </div>
        ) : null}
        {footer ? (
          <div
            style={{
              display: "flex",
              marginTop: subtitle ? 20 : 44,
              fontSize: 24,
              lineHeight: 1.45,
              color: TOKEN.fg300,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              maxWidth: 760,
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </SlideFrame>
  );
}
