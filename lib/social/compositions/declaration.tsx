// Composition: declaration / hero
//
// Layout: asymmetric. Headline sits in the upper-left two thirds. Restrained
// kicker line above the headline. Wordmark stamped bottom-right like a
// license plate. Single accent: a thin amber rim-light strip along the
// top-left, plus the "·" punctuation in the wordmark in amber.
//
// Inputs (rendered as JSX for Satori — inline CSS only, no Tailwind):
//   - kicker:    small restrained opener (e.g. "AI doesn't replace your people.")
//   - headline:  the dominant line (e.g. "It gives them superpowers.")
//   - emphasize: one word from the headline to color with the accent
//   - footer:    optional small line below the headline (CTA / nuance)
//
// All sizes are in absolute px against a 1080x1080 canvas. Satori scales.

import type { Brand } from "../brands";

export type DeclarationProps = {
  brand: Brand;
  kicker?: string;
  headline: string;
  emphasize?: string;          // a word from `headline` to color accent
  footer?: string;
};

export function DeclarationComposition({ brand, kicker, headline, emphasize, footer }: DeclarationProps) {
  const { palette, fonts, wordmark } = brand;
  const bgStyle: React.CSSProperties = palette.bgGradient
    ? {
        background: `radial-gradient(ellipse at 30% 30%, ${palette.bgGradient[0]} 0%, ${palette.bgGradient[1]} 100%)`,
      }
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
      {/* Rim-light: thin amber strip along the top-left corner */}
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

      {/* Soft ember glow in the corner */}
      <div
        style={{
          position: "absolute",
          top: -120,
          left: -120,
          width: 400,
          height: 400,
          background: `radial-gradient(circle, ${palette.accent}22, transparent 70%)`,
          display: "flex",
        }}
      />

      {/* Content stack — sits in upper-left two thirds */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "85%",
          marginTop: 40,
        }}
      >
        {kicker && (
          <div
            style={{
              fontFamily: fonts.mono.family,
              fontSize: 28,
              fontWeight: 600,
              color: palette.textMuted,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 28,
              lineHeight: 1.2,
            }}
          >
            {kicker}
          </div>
        )}

        <Headline
          headline={headline}
          emphasize={emphasize}
          fontFamily={fonts.display.family}
          weight={fonts.display.weight}
          color={palette.text}
          accent={palette.accent}
        />

        {footer && (
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              color: palette.textMuted,
              marginTop: 36,
              lineHeight: 1.45,
              maxWidth: "85%",
            }}
          >
            {footer}
          </div>
        )}
      </div>

      {/* Bottom-right wordmark — license-plate style */}
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
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: palette.accent,
            display: "flex",
          }}
        />
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

/**
 * Headline splits the text into a leading run + emphasized word + trailing run.
 * The emphasized word is rendered in the accent color. If `emphasize` isn't
 * found in `headline`, the entire line renders in the base color.
 */
function Headline({
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
  // Auto-shrink threshold — long headlines wrap, shorter ones go big.
  const isShort = headline.length < 60;
  const fontSize = isShort ? 96 : 76;
  const lineHeight = 1.05;

  const base: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight: weight,
    color,
    lineHeight,
    letterSpacing: -2,
    display: "flex",
    flexWrap: "wrap",
  };

  if (!emphasize) {
    return <div style={base}>{headline}</div>;
  }

  const idx = headline.toLowerCase().indexOf(emphasize.toLowerCase());
  if (idx === -1) return <div style={base}>{headline}</div>;

  const before = headline.slice(0, idx);
  const match = headline.slice(idx, idx + emphasize.length);
  const after = headline.slice(idx + emphasize.length);

  return (
    <div style={base}>
      <span style={{ display: "flex" }}>{before}</span>
      <span style={{ display: "flex", color: accent }}>{match}</span>
      <span style={{ display: "flex" }}>{after}</span>
    </div>
  );
}
