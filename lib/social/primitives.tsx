// Shared Satori-safe primitives used across every composition.
// Ported from Claude Design's Prometheus Post handoff and adapted to our
// composition system. Inline-CSS only, every node is flex, no shorthand.

import { TOKEN, EMBER_H, FORGE_BG } from "./tokens";

// Ember-gradient text. Use on the emphasis word in a headline.
export function Ember({ children, weight = 800 }: { children: React.ReactNode; weight?: number }) {
  return (
    <span
      style={{
        display: "flex",
        backgroundImage: EMBER_H,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        fontWeight: weight,
      }}
    >
      {children}
    </span>
  );
}

// `// eyebrow` mono tag. Matches the website's "// Human-Centric AI Consulting" treatment.
export function Eyebrow({ children, color = TOKEN.ember500 }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 24,
        fontWeight: 500,
        color,
        letterSpacing: 0,
      }}
    >
      {`// ${children}`}
    </div>
  );
}

// `prometheus_` lowercase wordmark. The "o" is amber to stand in for the
// site's flame glyph, plus a trailing cursor underscore.
export function BrandMark({ size = 28, muted = false }: { size?: number; muted?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: size,
        fontWeight: 500,
        letterSpacing: 0,
        color: muted ? TOKEN.fg300 : TOKEN.fg100,
        lineHeight: 1,
      }}
    >
      <span style={{ display: "flex" }}>pr</span>
      <span style={{ display: "flex", color: TOKEN.ember500, fontWeight: 700 }}>o</span>
      <span style={{ display: "flex" }}>metheus</span>
      <span style={{ display: "flex", color: TOKEN.ember500, marginLeft: 1 }}>_</span>
    </div>
  );
}

// Footer row — wordmark left, optional counter right.
export function SlideFooter({ counter }: { counter?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <BrandMark size={28} />
      {counter ? (
        <div
          style={{
            display: "flex",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 18,
            color: TOKEN.ember500,
            letterSpacing: "0.04em",
          }}
        >
          {counter}
        </div>
      ) : null}
    </div>
  );
}

// 1080×1080 frame — every layout sits inside this. Forge bg + amber rim.
export function SlideFrame({
  children,
  eyebrow,
  footerCounter,
  rim = true,
  background,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  footerCounter?: string;
  rim?: boolean;
  background?: string;
}) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundImage: background ?? FORGE_BG,
        backgroundColor: TOKEN.bg600,
        fontFamily: "Inter, sans-serif",
        color: TOKEN.fg100,
        padding: "88px 96px 80px",
        overflow: "hidden",
      }}
    >
      {rim ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 260,
            height: 1080,
            display: "flex",
            backgroundImage: "linear-gradient(270deg, rgba(255,138,47,0.12) 0%, rgba(255,138,47,0) 100%)",
          }}
        />
      ) : null}

      {eyebrow ? (
        <div style={{ display: "flex" }}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
          marginTop: eyebrow ? 28 : 0,
        }}
      >
        {children}
      </div>

      <div style={{ display: "flex", marginTop: 40 }}>
        <SlideFooter counter={footerCounter} />
      </div>
    </div>
  );
}

// Helper: render a headline string with one emphasized word in ember gradient.
// Splits the string defensively; if `emphasize` isn't found, returns plain.
export function EmphasizedHeadline({
  text,
  emphasize,
  fontSize,
  weight = 800,
  letterSpacing = "-0.04em",
  lineHeight = 1.0,
}: {
  text: string;
  emphasize?: string;
  fontSize: number;
  weight?: number;
  letterSpacing?: string;
  lineHeight?: number;
}) {
  const base: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    fontSize,
    fontWeight: weight,
    color: TOKEN.fg100,
    lineHeight,
    letterSpacing,
  };
  if (!emphasize) return <div style={base}>{text}</div>;
  const idx = text.toLowerCase().indexOf(emphasize.toLowerCase());
  if (idx === -1) return <div style={base}>{text}</div>;
  return (
    <div style={base}>
      {text.slice(0, idx) ? <span style={{ display: "flex" }}>{text.slice(0, idx)}</span> : null}
      <Ember weight={weight}>{text.slice(idx, idx + emphasize.length)}</Ember>
      {text.slice(idx + emphasize.length) ? (
        <span style={{ display: "flex" }}>{text.slice(idx + emphasize.length)}</span>
      ) : null}
    </div>
  );
}
