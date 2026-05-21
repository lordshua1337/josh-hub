// Composition: declaration / hero
// Asymmetric headline with ember-gradient emphasis on one word, optional
// mono kicker above (rendered as the slide's "// eyebrow"), optional
// supporting footer below.

import type { Brand } from "../brands";
import { SlideFrame, EmphasizedHeadline } from "../primitives";
import { TOKEN } from "../tokens";

export type DeclarationProps = {
  brand: Brand;
  kicker?: string;
  headline: string;
  emphasize?: string;
  footer?: string;
  counter?: string;
  backgroundImageUrl?: string;
};

export function DeclarationComposition({ kicker, headline, emphasize, footer, counter, backgroundImageUrl }: DeclarationProps) {
  return (
    <SlideFrame eyebrow={kicker} footerCounter={counter} backgroundImageUrl={backgroundImageUrl}>
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
          fontSize={headline.length < 60 ? 132 : 96}
          letterSpacing="-0.04em"
          lineHeight={0.98}
        />
        {footer ? (
          <div
            style={{
              display: "flex",
              marginTop: 44,
              fontSize: 28,
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
