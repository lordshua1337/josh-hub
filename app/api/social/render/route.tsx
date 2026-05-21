// GET /api/social/render
// Two modes:
//   ?postId=...&slide=N        → DB-driven (public, no auth)
//   ?composition=...&...&size  → live preview from query params

import { ImageResponse } from "next/og";
import { getBrand } from "@/lib/social/brands";
import { DeclarationComposition } from "@/lib/social/compositions/declaration";
import { CarouselHookComposition } from "@/lib/social/compositions/carousel-hook";
import { NumberedStepComposition } from "@/lib/social/compositions/numbered-step";
import { CarouselCtaComposition } from "@/lib/social/compositions/carousel-cta";
import { SplitContrastComposition } from "@/lib/social/compositions/split-contrast";
import { SignoffComposition } from "@/lib/social/compositions/signoff";
import { FieldReportComposition } from "@/lib/social/compositions/field-report";
import { BigStat } from "@/lib/social/compositions/big-stat";
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

async function renderSlide(
  brandSlug: string,
  slide: SlideContent,
  counter: string | undefined,
  origin: string,
): Promise<React.ReactElement> {
  const brand = getBrand(brandSlug);
  // Resolve the relative path against the request origin, then pre-fetch +
  // inline so Satori only sees a data: URI (no network fetch from inside
  // the renderer, which is unreliable under serverless Node runtime).
  const absImageUrl = slide.imageUrl
    ? slide.imageUrl.startsWith("http")
      ? slide.imageUrl
      : `${origin}${slide.imageUrl}`
    : undefined;
  switch (slide.composition) {
    case "declaration":
      return (
        <DeclarationComposition
          brand={brand}
          kicker={slide.kicker}
          headline={slide.headline || ""}
          emphasize={slide.emphasize}
          footer={slide.footer}
          counter={counter}
          backgroundImageUrl={absImageUrl}
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
          counter={counter}
          backgroundImageUrl={absImageUrl}
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
          counter={counter}
        />
      );
    case "carousel_cta":
      return (
        <CarouselCtaComposition
          brand={brand}
          closer={slide.closer || ""}
          emphasize={slide.emphasize}
          cta={slide.cta || ""}
          link={slide.link}
          counter={counter}
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
          counter={counter}
        />
      );
    case "signoff":
      return (
        <SignoffComposition
          brand={brand}
          headline={slide.headline}
          emphasize={slide.emphasize}
          email={slide.link}
          contactNote={slide.footer}
          counter={counter}
        />
      );
    case "field_report":
      return (
        <FieldReportComposition
          brand={brand}
          eyebrow={slide.kicker}
          timestamp={slide.swipeHint || "field report"}
          title={slide.headline || slide.title || ""}
          emphasize={slide.emphasize}
          lines={(slide.frLines as { tag?: string; text: string }[]) || []}
          counter={counter}
        />
      );
    case "big_stat":
      return (
        <BigStat
          eyebrow={slide.kicker || "field report"}
          stat={slide.stat || slide.headline || "0"}
          unit={slide.unit}
          caption={slide.body || slide.footer || ""}
          source={slide.source}
          footerCounter={counter}
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
  const origin = url.origin;

  try {
    let slide: SlideContent;
    let counter: string | undefined;
    let renderBrand = brandSlug;

    if (postId) {
      const slideIdx = parseInt(url.searchParams.get("slide") || "0", 10);
      const sb = supabaseServer();
      const { data, error } = await sb
        .from("social_posts")
        .select("brand, copy_blocks")
        .eq("id", postId)
        .maybeSingle();
      if (error || !data) throw new Error(`post ${postId} not found`);
      const cb = data.copy_blocks as { slides?: SlideContent[] };
      const total = cb?.slides?.length ?? 0;
      const s = cb?.slides?.[slideIdx];
      if (!s) throw new Error(`slide ${slideIdx} out of range`);
      slide = s;
      counter = total > 1 ? `${String(slideIdx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}` : undefined;
      renderBrand = data.brand;
    } else {
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
        stat: url.searchParams.get("stat") || undefined,
        unit: url.searchParams.get("unit") || undefined,
        source: url.searchParams.get("source") || undefined,
        imageUrl: url.searchParams.get("imageUrl") || undefined,
      };
    }

    const [interBold, interMedium, interSemibold, monoBold, monoMedium] = await Promise.all([
      loadGoogleFont("Inter", 800),
      loadGoogleFont("Inter", 500),
      loadGoogleFont("Inter", 600),
      loadGoogleFont("JetBrains Mono", 700),
      loadGoogleFont("JetBrains Mono", 500),
    ]);

    const element = await renderSlide(renderBrand, slide, counter, origin);
    return new ImageResponse(element, {
      width: size,
      height: size,
      fonts: [
        { name: "Inter", data: interBold, style: "normal", weight: 800 },
        { name: "Inter", data: interSemibold, style: "normal", weight: 600 },
        { name: "Inter", data: interMedium, style: "normal", weight: 500 },
        { name: "JetBrains Mono", data: monoBold, style: "normal", weight: 700 },
        { name: "JetBrains Mono", data: monoMedium, style: "normal", weight: 500 },
      ],
    });
  } catch (e) {
    return new Response(`render error: ${(e as Error).message}`, { status: 500 });
  }
}
