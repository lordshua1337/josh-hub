// Composition: carousel_cta
// Last slide. Job: invite them to act without sounding salesy.
//
// Layout: top half is a short closer (1-2 lines), bottom half is the CTA
// block in an amber bordered card (URL or action). Wordmark stays in
// bottom-right but moved slightly to make room for the CTA.

import type { Brand } from "../brands";

export type CarouselCtaProps = {
  brand: Brand;
  closer: string;          // 1-2 line summary
  cta: string;             // the action ("DM 'AUDIT'", "book a call", etc.)
  link?: string;           // displayed below CTA, lowercase mono
};

export function CarouselCtaComposition({ brand, closer, cta, link }: CarouselCtaProps) {
  const { palette, fonts, wordmark, schedulingLink } = brand;
  const resolvedLink = link || schedulingLink || "";
  const bgStyle: React.CSSProperties = palette.bgGradient
    ? { background: `radial-gradient(ellipse at 50% 80%, ${palette.bgGradient[0]} 0%, ${palette.bgGradient[1]} 100%)` }
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
      {/* Ember from below */}
      <div
        style={{
          position: "absolute",
          bottom: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 500,
          background: `radial-gradient(ellipse, ${palette.accent}1f, transparent 70%)`,
          display: "flex",
        }}
      />

      {/* Closer text — upper third */}
      <div
        style={{
          marginTop: 80,
          fontFamily: fonts.display.family,
          fontSize: 64,
          fontWeight: 800,
          color: palette.text,
          lineHeight: 1.15,
          letterSpacing: -1.5,
          maxWidth: "95%",
          display: "flex",
        }}
      >
        {closer}
      </div>

      {/* CTA card — center/bottom */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: 40 }}>
        <div
          style={{
            border: `2px solid ${palette.accent}`,
            borderRadius: 16,
            padding: "32px 36px",
            background: palette.accentSoft,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono.family,
              fontSize: 22,
              fontWeight: 700,
              color: palette.accent,
              letterSpacing: 3,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Next move
          </div>
          <div
            style={{
              fontFamily: fonts.display.family,
              fontSize: 52,
              fontWeight: 800,
              color: palette.text,
              lineHeight: 1.15,
              letterSpacing: -1,
              display: "flex",
            }}
          >
            {cta}
          </div>
          {resolvedLink && (
            <div
              style={{
                fontFamily: fonts.mono.family,
                fontSize: 22,
                fontWeight: 600,
                color: palette.textMuted,
                marginTop: 4,
                display: "flex",
              }}
            >
              {resolvedLink}
            </div>
          )}
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
