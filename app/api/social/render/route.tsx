// GET /api/social/render
// Two call modes:
//   ?postId=...&slide=N         → fetch the stored post + render slide N (public, no auth)
//   ?composition=...&...        → render from raw query params (live preview)
//
// Either way returns a PNG via @vercel/og (Satori). Uses Node runtime so we
// can reach the service-role Supabase client.

import { ImageResponse } from "@vercel/og";
import { getBrand } from "@/lib/social/brands";
import { DeclarationComposition } from "@/lib/social/compositions/declaration";
import { CarouselHookComposition } from "@/lib/social/compositions/carousel-hook";
import { NumberedStepComposition } from "@/lib/social/compositions/numbered-step";
import { CarouselCtaComposition } from "@/lib/social/compositions/carousel-cta";
import { SplitContrastComposition } from "@/lib/social/compositions/split-contrast";
import { supabaseServer } from "@/lib/supabase/server";
import type { SlideContent } from "@/lib/social/copy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const css = await fetch(cssUrl, { cache: "force-cache" }).then((r) => r.text());
  const m = css.match(/src:\s*url\((https:[^)]+)\)/);
  if (!m) throw new Error(`Font URL not found for ${family} ${weight}`);
  const f = await fetch(m[1], { cache: "force-cache" });
  if (!f.ok) throw new Error(`Font fetch ${m[1]} ${f.status}`);
  return f.arrayBuffer();
}

function renderSlide(brandSlug: string, slide: SlideContent): React.ReactElement {
  const brand = getBrand(brandSlug);
  switch (slide.composition) {
    case "declaration":
      return (
        <DeclarationComposition
          brand={brand}
          kicker={slide.kicker}
          headline={slide.headline || ""}
          emphasize={slide.emphasize}
          footer={slide.footer}
        />
      );
    case "carousel_hook":
      return (
        <CarouselHookComposition
          brand={brand}
          kicker={slide.kicker}
          headline={slide.headline || ""}
          emphasize={slide.emphasize}
          swipeHint={slide.swipeHint}
        />
      );
    case "numbered_step":
      return (
        <NumberedStepComposition
          brand={brand}
          index={slide.index || 1}
          total={slide.total || 1}
          title={slide.title || ""}
          body={slide.body || ""}
          emphasize={slide.emphasize}
        />
      );
    case "carousel_cta":
      return (
        <CarouselCtaComposition
          brand={brand}
          closer={slide.closer || ""}
          cta={slide.cta || ""}
          link={slide.link}
        />
      );
    case "split_contrast":
      return (
        <SplitContrastComposition
          brand={brand}
          theySaidLabel={slide.theySaidLabel}
          theySaid={slide.theySaid || ""}
          trueLabel={slide.trueLabel}
          trueLine={slide.trueLine || ""}
          emphasize={slide.emphasize}
        />
      );
    default:
      throw new Error(`Unknown composition: ${slide.composition}`);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const size = parseInt(url.searchParams.get("size") || "1080", 10);
  const postId = url.searchParams.get("postId");
  const brandSlug = url.searchParams.get("brand") || "prometheus";

  try {
    let slide: SlideContent;

    if (postId) {
      // DB-driven render
      const slideIdx = parseInt(url.searchParams.get("slide") || "0", 10);
      const sb = supabaseServer();
      const { data, error } = await sb
        .from("social_posts")
        .select("brand, copy_blocks")
        .eq("id", postId)
        .maybeSingle();
      if (error || !data) throw new Error(`post ${postId} not found`);
      const cb = data.copy_blocks as { slides?: SlideContent[] };
      const s = cb?.slides?.[slideIdx];
      if (!s) throw new Error(`slide ${slideIdx} out of range`);
      slide = s;

      const [interBold, interMedium, monoBold] = await Promise.all([
        loadGoogleFont("Inter", 800),
        loadGoogleFont("Inter", 500),
        loadGoogleFont("JetBrains Mono", 700),
      ]);

      return new ImageResponse(renderSlide(data.brand, slide), {
        width: size,
        height: size,
        fonts: [
          { name: "Inter", data: interBold, style: "normal", weight: 800 },
          { name: "Inter", data: interMedium, style: "normal", weight: 500 },
          { name: "JetBrains Mono", data: monoBold, style: "normal", weight: 700 },
        ],
      });
    }

    // Raw-params render
    const composition = url.searchParams.get("composition") || "declaration";
    slide = {
      composition,
      kicker: url.searchParams.get("kicker") || undefined,
      headline: url.searchParams.get("headline") || undefined,
      emphasize: url.searchParams.get("emphasize") || undefined,
      footer: url.searchParams.get("footer") || undefined,
      swipeHint: url.searchParams.get("swipeHint") || undefined,
      index: url.searchParams.get("index") ? parseInt(url.searchParams.get("index")!, 10) : undefined,
      total: url.searchParams.get("total") ? parseInt(url.searchParams.get("total")!, 10) : undefined,
      title: url.searchParams.get("title") || undefined,
      body: url.searchParams.get("body") || undefined,
      closer: url.searchParams.get("closer") || undefined,
      cta: url.searchParams.get("cta") || undefined,
      link: url.searchParams.get("link") || undefined,
      theySaidLabel: url.searchParams.get("theySaidLabel") || undefined,
      theySaid: url.searchParams.get("theySaid") || undefined,
      trueLabel: url.searchParams.get("trueLabel") || undefined,
      trueLine: url.searchParams.get("trueLine") || undefined,
    };

    const [interBold, interMedium, monoBold] = await Promise.all([
      loadGoogleFont("Inter", 800),
      loadGoogleFont("Inter", 500),
      loadGoogleFont("JetBrains Mono", 700),
    ]);

    return new ImageResponse(renderSlide(brandSlug, slide), {
      width: size,
      height: size,
      fonts: [
        { name: "Inter", data: interBold, style: "normal", weight: 800 },
        { name: "Inter", data: interMedium, style: "normal", weight: 500 },
        { name: "JetBrains Mono", data: monoBold, style: "normal", weight: 700 },
      ],
    });
  } catch (e) {
    return new Response(`render error: ${(e as Error).message}`, { status: 500 });
  }
}
