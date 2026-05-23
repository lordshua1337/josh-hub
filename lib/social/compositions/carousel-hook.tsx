// Composition: carousel_hook (slide 1 of carousels)
// Hero headline with ember emphasis, kicker as eyebrow tag, optional
// subtitle tagline below headline, swipe hint at the foot.

import type { Brand } from "../brands";
import { SlideFrame, EmphasizedHeadline, fitFontSize } from "../primitives";
import { TOKEN } from "../tokens";

export type CarouselHookProps = {
  brand: Brand;
  kicker?: string;
  headline: string;
  emphasize?: string;
  subtitle?: string;
  swipeHint?: string;
  counter?: string;
  backgroundImageUrl?: string;
  focalX?: number;
  focalY?: number;
  zoom?: number;
  overlay?: "subtle" | "strong" | "fade-bottom" | "wordmark" | "none";
};

export function CarouselHookComposition({
  kicker,
  headline,
  emphasize,
  subtitle,
  swipeHint = "swipe →",
  counter,
  backgroundImageUrl,
  focalX,
  focalY,
  zoom,
  overlay,
}: CarouselHookProps) {
  return (
    <SlideFrame
      eyebrow={kicker || "field notes"}
      footerCounter={counter}
      backgroundImageUrl={backgroundImageUrl}
      focalX={focalX}
      focalY={focalY}
      zoom={zoom}
      overlay={overlay}
    >
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
        <EmphasizedHeadline
          text={headline}
          emphasize={emphasize}
          fontSize={fitFontSize(headline, { width: 888, maxLines: 3, candidates: [110, 96, 84, 72], weight: 800 })}
          letterSpacing="-0.035em"
          lineHeight={1.0}
        />
        {subtitle ? (
          <div
            style={{
              display: "flex",
              marginTop: 32,
              fontSize: 32,
              lineHeight: 1.35,
              color: TOKEN.fg200,
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              maxWidth: 840,
              letterSpacing: "-0.012em",
            }}
          >
            {subtitle}
          </div>
        ) : null}
        {swipeHint ? (
          <div
            style={{
              display: "flex",
              marginTop: subtitle ? 36 : 44,
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 22,
              color: TOKEN.ember500,
              letterSpacing: "0.04em",
            }}
          >
            {swipeHint}
          </div>
        ) : null}
      </div>
    </SlideFrame>
  );
}
