// Composition: carousel_hook
// First slide of a carousel. Job: stop the scroll + tell them how many slides.
//
// Layout: a huge "X PLAYS" or "X QUESTIONS" badge top-left, then a hero
// headline, then a swipe hint at the bottom. Top-left amber rim-light like
// declaration. The headline gets the same emphasize treatment.

import type { Brand } from "../brands";

export type CarouselHookProps = {
  brand: Brand;
  kicker?: string;          // small badge above headline, e.g. "5 PLAYS"
  headline: string;
  emphasize?: string;
  swipeHint?: string;       // small bottom line, e.g. "swipe to start →"
};

export function CarouselHookComposition({
  brand,
  kicker,
  headline,
  emphasize,
  swipeHint = "swipe →",
}: CarouselHookProps) {
  const { palette, fonts, wordmark } = brand;
  const bgStyle: React.CSSProperties = palette.bgGradient
    ? { background: `radial-gradient(ellipse at 30% 30%, ${palette.bgGradient[0]} 0%, ${palette.bgGradient[1]} 100%)` }
    : { background: palette.bg };

  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        padding: 80,
        fontFamily: fonts.body.family,
        color: palette.text,
        ...bgStyle,
      }}
    >
      {/* Rim-light corner */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 360,
          height: 4,
          background: `linear-gradient(90deg, ${palette.accent}, ${palette.accent2 || palette.accent}, transparent)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: 360,
          background: `linear-gradient(180deg, ${palette.accent}, ${palette.accent2 || palette.accent}, transparent)`,
        }}
      />

      {/* Ember glow */}
      <div
        style={{
          position: "absolute",
          top: -120,
          left: -120,
          width: 400,
          height: 400,
          background: `radial-gradient(circle, ${palette.accent}26, transparent 70%)`,
          display: "flex",
        }}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", width: "88%", marginTop: 40 }}>
        {kicker && (
          <div
            style={{
              fontFamily: fonts.mono.family,
              fontSize: 40,
              fontWeight: 700,
              color: palette.accent,
              letterSpacing: 4,
              textTransform: "uppercase",
              marginBottom: 40,
              padding: "10px 22px",
              border: `2px solid ${palette.accent}`,
              borderRadius: 8,
              alignSelf: "flex-start",
              display: "flex",
            }}
          >
            {kicker}
          </div>
        )}

        <HookHeadline
          headline={headline}
          emphasize={emphasize}
          fontFamily={fonts.display.family}
          weight={fonts.display.weight}
          color={palette.text}
          accent={palette.accent}
        />
      </div>

      {/* Swipe hint bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: 64,
          left: 80,
          fontFamily: fonts.mono.family,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 2,
          color: palette.accent,
          textTransform: "lowercase",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {swipeHint}
      </div>

      {/* Wordmark bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: 64,
          right: 80,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: 3, background: palette.accent, display: "flex" }} />
        <div
          style={{
            fontFamily: fonts.mono.family,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            color: palette.textMuted,
          }}
        >
          {wordmark}
        </div>
      </div>
    </div>
  );
}

function HookHeadline({
  headline,
  emphasize,
  fontFamily,
  weight,
  color,
  accent,
}: {
  headline: string;
  emphasize?: string;
  fontFamily: string;
  weight: number;
  color: string;
  accent: string;
}) {
  const fontSize = headline.length < 50 ? 110 : 84;
  const base: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight: weight,
    color,
    lineHeight: 1.02,
    letterSpacing: -2.5,
    display: "flex",
    flexWrap: "wrap",
  };
  if (!emphasize) return <div style={base}>{headline}</div>;
  const idx = headline.toLowerCase().indexOf(emphasize.toLowerCase());
  if (idx === -1) return <div style={base}>{headline}</div>;
  return (
    <div style={base}>
      <span style={{ display: "flex" }}>{headline.slice(0, idx)}</span>
      <span style={{ display: "flex", color: accent }}>{headline.slice(idx, idx + emphasize.length)}</span>
      <span style={{ display: "flex" }}>{headline.slice(idx + emphasize.length)}</span>
    </div>
  );
}
