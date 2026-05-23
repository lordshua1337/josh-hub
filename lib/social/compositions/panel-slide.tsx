// panel_slide — seamless-panorama carousel slide.
// One image is stretched across `panelTotal` × 1080 pixels wide. Each slide
// shows just one panel by translating the image left so the correct slice
// is visible inside the 1080×1080 frame. When viewed as an IG carousel and
// swiped, the panels read as a continuous panorama.
//
// Optional small text overlay sits on top (bottom-left), useful for a
// short title or counter. Keep it short — the image is the point.

import type { Brand } from "../brands";
import { TOKEN, FORGE_BG } from "../tokens";
import { BrandMark, fitFontSize } from "../primitives";

export type PanelSlideProps = {
  brand: Brand;
  imageUrl: string;          // forge image URL
  panelIndex: number;        // 0-based
  panelTotal: number;        // 2-5
  caption?: string;          // optional small text overlay
  emphasize?: string;        // ember-emphasized word inside the caption
  counter?: string;          // "03 / 05"
  focalY?: number;           // 0..100, vertical positioning (default 50)
  overlay?: "subtle" | "strong" | "fade-bottom" | "wordmark" | "none";
};

const OVERLAY_CSS: Record<NonNullable<PanelSlideProps["overlay"]>, string | null> = {
  subtle: "linear-gradient(180deg, rgba(15,11,9,0) 55%, rgba(15,11,9,0.7) 100%)",
  strong: "linear-gradient(180deg, rgba(15,11,9,0.25) 0%, rgba(15,11,9,0.85) 100%)",
  "fade-bottom": "linear-gradient(180deg, rgba(15,11,9,0) 40%, rgba(15,11,9,0.9) 100%)",
  wordmark: "linear-gradient(180deg, rgba(15,11,9,0) 70%, rgba(15,11,9,0.55) 100%)",
  none: null,
};

export function PanelSlideComposition({
  imageUrl,
  panelIndex,
  panelTotal,
  caption,
  emphasize,
  counter,
  focalY = 50,
  overlay = "fade-bottom",
}: PanelSlideProps) {
  // Total stretched width = panelTotal × 1080. Each panel is 1080 wide.
  // To show panel `i`, translate the image left by i × 1080.
  const totalWidth = panelTotal * 1080;
  const translateX = -panelIndex * 1080;

  // Split caption around emphasis word for ember-gradient treatment
  const idx = caption && emphasize ? caption.toLowerCase().indexOf(emphasize.toLowerCase()) : -1;
  const before = idx >= 0 ? caption!.slice(0, idx) : caption || "";
  const ember = idx >= 0 ? caption!.slice(idx, idx + emphasize!.length) : "";
  const after = idx >= 0 ? caption!.slice(idx + emphasize!.length) : "";

  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundImage: FORGE_BG,
        backgroundColor: TOKEN.bg600,
        fontFamily: "Inter, sans-serif",
        color: TOKEN.fg100,
        overflow: "hidden",
      }}
    >
      {/* Wide image translated to show this panel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: totalWidth,
          height: 1080,
          display: "flex",
          transform: `translateX(${translateX}px)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          width={totalWidth}
          height={1080}
          style={{
            width: totalWidth,
            height: 1080,
            objectFit: "cover",
            objectPosition: `50% ${focalY}%`,
          }}
        />
      </div>

      {/* Readability overlay */}
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

      {/* Caption — bottom-left */}
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: 96,
            bottom: 152,
            display: "flex",
            flexWrap: "wrap",
            maxWidth: 880,
            fontSize: fitFontSize(caption || "", { width: 880, maxLines: 3, candidates: [56, 48, 40, 34], weight: 700 }),
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.028em",
            color: TOKEN.fg100,
          }}
        >
          {before ? <span style={{ display: "flex" }}>{before}</span> : null}
          {ember ? (
            <span
              style={{
                display: "flex",
                backgroundImage: `linear-gradient(90deg, ${TOKEN.ember700} 0%, ${TOKEN.ember500} 32%, ${TOKEN.ember300} 62%, ${TOKEN.ember050} 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                fontWeight: 700,
              }}
            >
              {ember}
            </span>
          ) : null}
          {after ? <span style={{ display: "flex" }}>{after}</span> : null}
        </div>
      ) : null}

      {/* Footer — wordmark + counter */}
      <div
        style={{
          position: "absolute",
          left: 96,
          right: 96,
          bottom: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
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
    </div>
  );
}
