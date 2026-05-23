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
import { BrandMark, fitFontSize, EmphasizedHeadline } from "../primitives";

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
      {/* Wide image translated to show this panel. Only render when an image
          was actually attached — otherwise fall back to the forge bg (an
          empty src would make Satori throw / draw a broken frame). */}
      {imageUrl ? (
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
      ) : null}

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

      {/* Caption — bottom-left. Uses EmphasizedHeadline for word-boundary
          (not substring) ember matching, consistent with every other slide. */}
      {caption ? (
        <div style={{ position: "absolute", left: 96, bottom: 152, maxWidth: 880, display: "flex" }}>
          <EmphasizedHeadline
            text={caption}
            emphasize={emphasize}
            fontSize={fitFontSize(caption, { width: 880, maxLines: 3, candidates: [56, 48, 40, 34], weight: 700 })}
            weight={700}
            letterSpacing="-0.028em"
            lineHeight={1.05}
          />
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
