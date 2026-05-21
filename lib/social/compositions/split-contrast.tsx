// Composition: split_contrast
// Used for: reframe posts. "What they told you" vs "What's actually true."
//
// Layout: vertical split — top half muted, bottom half full-color with the
// amber band between them. Labels in mono on each side.

import type { Brand } from "../brands";

export type SplitContrastProps = {
  brand: Brand;
  theySaidLabel?: string;
  theySaid: string;
  trueLabel?: string;
  trueLine: string;
  emphasize?: string;        // word in trueLine to color
};

export function SplitContrastComposition({
  brand,
  theySaidLabel = "WHAT THEY SAID",
  theySaid,
  trueLabel = "WHAT'S TRUE",
  trueLine,
  emphasize,
}: SplitContrastProps) {
  const { palette, fonts, wordmark } = brand;

  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        fontFamily: fonts.body.family,
        color: palette.text,
        background: palette.bg,
      }}
    >
      {/* TOP HALF — muted/struck */}
      <div
        style={{
          flex: 1,
          padding: "80px 80px 60px",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(180deg, ${palette.bgGradient?.[1] || palette.bg}, ${palette.bg})`,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono.family,
            fontSize: 22,
            fontWeight: 700,
            color: palette.textMuted,
            letterSpacing: 3,
            marginBottom: 24,
            display: "flex",
          }}
        >
          {theySaidLabel}
        </div>
        <div
          style={{
            fontFamily: fonts.display.family,
            fontSize: 52,
            fontWeight: 500,
            color: palette.textMuted,
            opacity: 0.7,
            lineHeight: 1.2,
            letterSpacing: -1,
            textDecoration: "line-through",
            textDecorationColor: `${palette.textMuted}66`,
            textDecorationThickness: "2px",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {theySaid}
        </div>
      </div>

      {/* DIVIDER — amber band */}
      <div
        style={{
          height: 6,
          background: `linear-gradient(90deg, ${palette.accent}, ${palette.accent2 || palette.accent}, ${palette.accent})`,
        }}
      />

      {/* BOTTOM HALF — full color, the truth */}
      <div
        style={{
          flex: 1.1,
          padding: "60px 80px 80px",
          display: "flex",
          flexDirection: "column",
          background: `radial-gradient(ellipse at 30% 70%, ${palette.bgGradient?.[0] || palette.bg} 0%, ${palette.bg} 100%)`,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono.family,
            fontSize: 22,
            fontWeight: 700,
            color: palette.accent,
            letterSpacing: 3,
            marginBottom: 24,
            display: "flex",
          }}
        >
          {trueLabel}
        </div>
        <TrueLine
          line={trueLine}
          emphasize={emphasize}
          fontFamily={fonts.display.family}
          weight={fonts.display.weight}
          color={palette.text}
          accent={palette.accent}
        />

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
    </div>
  );
}

function TrueLine({
  line,
  emphasize,
  fontFamily,
  weight,
  color,
  accent,
}: {
  line: string;
  emphasize?: string;
  fontFamily: string;
  weight: number;
  color: string;
  accent: string;
}) {
  const fontSize = line.length < 60 ? 72 : 56;
  const base: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight: weight,
    color,
    lineHeight: 1.1,
    letterSpacing: -1.5,
    display: "flex",
    flexWrap: "wrap",
  };
  if (!emphasize) return <div style={base}>{line}</div>;
  const idx = line.toLowerCase().indexOf(emphasize.toLowerCase());
  if (idx === -1) return <div style={base}>{line}</div>;
  return (
    <div style={base}>
      <span style={{ display: "flex" }}>{line.slice(0, idx)}</span>
      <span style={{ display: "flex", color: accent }}>{line.slice(idx, idx + emphasize.length)}</span>
      <span style={{ display: "flex" }}>{line.slice(idx + emphasize.length)}</span>
    </div>
  );
}
