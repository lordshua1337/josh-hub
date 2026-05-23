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

// ── Deterministic auto-fit ────────────────────────────────────────────────
// Estimate how wide text renders, then pick the largest candidate font size
// that keeps it within `maxLines`. This is the HARD overflow guarantee — even
// if the drafter overshoots a length cap, the renderer drops a font tier
// instead of spilling off the slide.

// Average glyph advance as a fraction of font size, per weight (Inter, tuned
// from the calibration renders). Mono is wider.
const GLYPH_ADVANCE: Record<number, number> = { 900: 0.55, 800: 0.54, 700: 0.55, 600: 0.52, 500: 0.51 };

export function estimateLines(text: string, fontSize: number, width: number, weight = 800): number {
  if (!text) return 1;
  const adv = (GLYPH_ADVANCE[weight] ?? 0.54) * fontSize;
  const charsPerLine = Math.max(1, Math.floor(width / adv));
  // Word-aware: a word never splits, so wrap word-by-word into lines.
  const words = text.split(/\s+/);
  let lines = 1;
  let cur = 0;
  for (const w of words) {
    const wl = w.length;
    if (cur === 0) {
      cur = wl;
    } else if (cur + 1 + wl <= charsPerLine) {
      cur += 1 + wl;
    } else {
      lines += 1;
      cur = wl;
    }
  }
  return lines;
}

export function fitFontSize(
  text: string,
  opts: { width: number; maxLines: number; candidates: number[]; weight?: number }
): number {
  const { width, maxLines, candidates, weight = 800 } = opts;
  for (const size of candidates) {
    if (estimateLines(text, size, width, weight) <= maxLines) return size;
  }
  return candidates[candidates.length - 1];
}

// Helper: render a headline with one emphasized word in ember gradient.
// Tokenizes into per-word flex items so wrapping behaves like normal text and
// the ember word flows INLINE (instead of claiming its own line — the old bug).
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
  // rowGap reproduces line-height spacing for wrapped flex items (each item
  // keeps lineHeight:1, the gap adds the breathing room between lines).
  const rowGap = Math.max(0, Math.round((lineHeight - 1) * fontSize));
  const base: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    columnGap: Math.round(fontSize * 0.25),
    rowGap,
    fontSize,
    fontWeight: weight,
    color: TOKEN.fg100,
    lineHeight: 1,
    letterSpacing,
  };
  const norm = (s: string) => s.toLowerCase().replace(/[^\w]/g, "");
  const words = text.split(/\s+/).filter(Boolean);
  // Support a multi-word emphasis phrase: find the contiguous run of words
  // whose normalized forms match the emphasize tokens, and ember that whole
  // run. (Single-word emphasis is just a run of length 1.)
  const emTokens = emphasize ? emphasize.split(/\s+/).map(norm).filter(Boolean) : [];
  const emberIdx = new Set<number>();
  if (emTokens.length > 0) {
    const wn = words.map(norm);
    for (let i = 0; i + emTokens.length <= wn.length; i++) {
      let hit = true;
      for (let j = 0; j < emTokens.length; j++) {
        if (wn[i + j] !== emTokens[j]) { hit = false; break; }
      }
      if (hit) {
        for (let j = 0; j < emTokens.length; j++) emberIdx.add(i + j);
        break; // first occurrence only
      }
    }
  }
  return (
    <div style={base}>
      {words.map((w, i) => {
        const isEmber = emberIdx.has(i);
        if (isEmber) {
          return (
            <span
              key={i}
              style={{
                display: "flex",
                backgroundImage: EMBER_H,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                fontWeight: weight,
              }}
            >
              {w}
            </span>
          );
        }
        return (
          <span key={i} style={{ display: "flex" }}>
            {w}
          </span>
        );
      })}
    </div>
  );
}
