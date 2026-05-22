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

// Overlay variants — Satori-safe CSS for the readability layer over a
// forge background image. Each maps to a specific gradient.
const OVERLAY_CSS: Record<NonNullable<SlideFrameProps["overlay"]>, string | null> = {
  subtle:
    "linear-gradient(90deg, rgba(15,11,9,0.78) 0%, rgba(15,11,9,0.55) 60%, rgba(15,11,9,0.35) 100%)",
  strong:
    "linear-gradient(90deg, rgba(15,11,9,0.92) 0%, rgba(15,11,9,0.78) 50%, rgba(15,11,9,0.62) 100%)",
  "fade-bottom":
    "linear-gradient(180deg, rgba(15,11,9,0.35) 0%, rgba(15,11,9,0.4) 55%, rgba(15,11,9,0.92) 100%)",
  wordmark:
    "linear-gradient(90deg, rgba(15,11,9,0.55) 0%, rgba(15,11,9,0.3) 60%, rgba(15,11,9,0.2) 100%)",
  none: null,
};

type SlideFrameProps = {
  children: React.ReactNode;
  eyebrow?: string;
  footerCounter?: string;
  rim?: boolean;
  background?: string;
  backgroundImageUrl?: string;
  focalX?: number;       // 0..100
  focalY?: number;       // 0..100
  zoom?: number;         // 0.5 = pulled back (more of image visible), 1.0 = cover (default), 2.0 = zoomed in
  overlay?: "subtle" | "strong" | "fade-bottom" | "wordmark" | "none";
};

// 1080×1080 frame — every layout sits inside this. Defaults to the forge
// radial bg; pass `backgroundImageUrl` for a forge PNG background and the
// `overlay` variant chooses the readability layer treatment.
export function SlideFrame({
  children,
  eyebrow,
  footerCounter,
  rim = true,
  background,
  backgroundImageUrl,
  focalX = 50,
  focalY = 50,
  zoom = 1,
  overlay = "subtle",
}: SlideFrameProps) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        // ALWAYS pass a backgroundImage string — Satori crashes on
        // `backgroundImage: undefined` ("Cannot read properties of
        // undefined reading 'trim'"). When a backgroundImageUrl is set,
        // the absolutely-positioned <img> below covers this anyway.
        backgroundImage: background ?? FORGE_BG,
        backgroundColor: TOKEN.bg600,
        fontFamily: "Inter, sans-serif",
        color: TOKEN.fg100,
        padding: "88px 96px 80px",
        overflow: "hidden",
      }}
    >
      {/* Optional forge background image with focal-point crop + zoom.
          - zoom = 1: object-fit cover with object-position for focal. (Default.)
          - zoom > 1: image rendered LARGER than the frame and offset so the
            focal point stays at (focalX%, focalY%) of the visible frame.
          - zoom < 1: image rendered smaller than the frame (letterboxed). The
            forge bg color fills the rest. */}
      {backgroundImageUrl ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: 1080,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {zoom === 1 ? (
            // Fast path: native cover + object-position
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={backgroundImageUrl}
              alt=""
              width={1080}
              height={1080}
              style={{
                width: 1080,
                height: 1080,
                objectFit: "cover",
                objectPosition: `${focalX}% ${focalY}%`,
              }}
            />
          ) : (
            // Zoom path: render image at (1080*zoom) size, manually translate
            // so the (focalX,focalY) point of the SOURCE sits at the same
            // proportional point of the FRAME. Satori supports `transform:
            // translate(...)` on a positioned element.
            (() => {
              const scaled = Math.round(1080 * zoom);
              // We want pixel at (focalX% of scaled) to line up with
              // (focalX% of 1080). Since scaled is bigger/smaller, compute
              // the translation offset that achieves that.
              const offsetX = Math.round((1080 - scaled) * (focalX / 100));
              const offsetY = Math.round((1080 - scaled) * (focalY / 100));
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={backgroundImageUrl}
                  alt=""
                  width={scaled}
                  height={scaled}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: scaled,
                    height: scaled,
                    objectFit: "cover",
                    objectPosition: `${focalX}% ${focalY}%`,
                    transform: `translate(${offsetX}px, ${offsetY}px)`,
                  }}
                />
              );
            })()
          )}
          {OVERLAY_CSS[overlay] ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 1080,
                height: 1080,
                display: "flex",
                backgroundImage: OVERLAY_CSS[overlay] as string,
              }}
            />
          ) : null}
        </div>
      ) : null}

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
        <div style={{ display: "flex", zIndex: 1 }}>
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
          zIndex: 1,
        }}
      >
        {children}
      </div>

      <div style={{ display: "flex", marginTop: 40, zIndex: 1 }}>
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
