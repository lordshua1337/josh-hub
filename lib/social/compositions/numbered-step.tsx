// Composition: numbered_step
// Used in: quick_wins, role_acceleration, diagnostic, behind_the_build, compliance_gtm carousels.
//
// Layout: a giant outline numeral on the left, a strong title on top-right,
// a short body below the title. Subtle amber underline beneath the numeral.
// Bottom-right wordmark stamp.

import type { Brand } from "../brands";

export type NumberedStepProps = {
  brand: Brand;
  index: number;          // 1-indexed step
  total: number;          // total steps (shown as "N OF TOTAL" badge top-right)
  title: string;          // 5-9 words
  body: string;           // 1-3 short lines
  emphasize?: string;     // word in `title` to amber
};

export function NumberedStepComposition({ brand, index, total, title, body, emphasize }: NumberedStepProps) {
  const { palette, fonts, wordmark } = brand;
  const bgStyle: React.CSSProperties = palette.bgGradient
    ? { background: `radial-gradient(ellipse at 70% 30%, ${palette.bgGradient[0]} 0%, ${palette.bgGradient[1]} 100%)` }
    : { background: palette.bg };

  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        display: "flex",
        position: "relative",
        padding: 80,
        fontFamily: fonts.body.family,
        color: palette.text,
        ...bgStyle,
      }}
    >
      {/* Step count badge top-right */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 80,
          fontFamily: fonts.mono.family,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 3,
          color: palette.textMuted,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: 3, background: palette.accent, display: "flex" }} />
        {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>

      {/* Soft ember in the bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: -160,
          left: -160,
          width: 460,
          height: 460,
          background: `radial-gradient(circle, ${palette.accent}1a, transparent 70%)`,
          display: "flex",
        }}
      />

      {/* Two-column body */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 60, marginTop: 60 }}>
        {/* Giant outline numeral */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: fonts.display.family,
              fontSize: 360,
              fontWeight: 800,
              color: "transparent",
              WebkitTextStroke: `3px ${palette.accent}`,
              lineHeight: 0.85,
              letterSpacing: -10,
              display: "flex",
            }}
          >
            {index}
          </div>
          <div
            style={{
              width: 140,
              height: 4,
              background: `linear-gradient(90deg, ${palette.accent}, transparent)`,
              marginTop: 8,
              display: "flex",
            }}
          />
        </div>

        {/* Title + body stack */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <StepTitle
            title={title}
            emphasize={emphasize}
            fontFamily={fonts.display.family}
            weight={fonts.display.weight}
            color={palette.text}
            accent={palette.accent}
          />
          <div
            style={{
              fontSize: 30,
              fontWeight: 500,
              color: palette.textMuted,
              marginTop: 28,
              lineHeight: 1.5,
            }}
          >
            {body}
          </div>
        </div>
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

function StepTitle({
  title,
  emphasize,
  fontFamily,
  weight,
  color,
  accent,
}: {
  title: string;
  emphasize?: string;
  fontFamily: string;
  weight: number;
  color: string;
  accent: string;
}) {
  const fontSize = title.length < 40 ? 64 : 52;
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
  if (!emphasize) return <div style={base}>{title}</div>;
  const idx = title.toLowerCase().indexOf(emphasize.toLowerCase());
  if (idx === -1) return <div style={base}>{title}</div>;
  const before = title.slice(0, idx);
  const match = title.slice(idx, idx + emphasize.length);
  const after = title.slice(idx + emphasize.length);
  return (
    <div style={base}>
      <span style={{ display: "flex" }}>{before}</span>
      <span style={{ display: "flex", color: accent }}>{match}</span>
      <span style={{ display: "flex" }}>{after}</span>
    </div>
  );
}
