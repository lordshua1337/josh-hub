// Composition: carousel_hook (slide 1 of carousels)
// Hero headline with ember emphasis, kicker as eyebrow tag, optional subtext.

import type { Brand } from "../brands";
import { SlideFrame, EmphasizedHeadline } from "../primitives";
import { TOKEN } from "../tokens";

export type CarouselHookProps = {
  brand: Brand;
  kicker?: string;
  headline: string;
  emphasize?: string;
  swipeHint?: string;
  counter?: string;
  backgroundImageUrl?: string;
};

export function CarouselHookComposition({ kicker, headline, emphasize, swipeHint = "swipe →", counter, backgroundImageUrl }: CarouselHookProps) {
  return (
    <SlideFrame eyebrow={kicker || "field notes"} footerCounter={counter} backgroundImageUrl={backgroundImageUrl}>
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
        <EmphasizedHeadline
          text={headline}
          emphasize={emphasize}
          fontSize={headline.length < 50 ? 110 : 84}
          letterSpacing="-0.035em"
          lineHeight={1.0}
        />
        {swipeHint ? (
          <div
            style={{
              display: "flex",
              marginTop: 44,
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
