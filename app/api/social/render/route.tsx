// GET/POST /api/social/render
// Server-side renders a single composition to PNG using @vercel/og (Satori).
// Used by the engine to bake each post, and by the hub UI for live previews.

import { ImageResponse } from "@vercel/og";
import { getBrand } from "@/lib/social/brands";
import { DeclarationComposition } from "@/lib/social/compositions/declaration";

export const dynamic = "force-dynamic";
export const runtime = "edge";

// Fonts fetched per request and cached by the edge. Inter + JetBrains Mono.
async function fetchFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`font fetch ${url} ${res.status}`);
  return res.arrayBuffer();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const brandSlug = url.searchParams.get("brand") || "prometheus";
  const composition = url.searchParams.get("composition") || "declaration";
  const kicker = url.searchParams.get("kicker") || undefined;
  const headline = url.searchParams.get("headline") || "AI doesn't replace your people. It gives them superpowers.";
  const emphasize = url.searchParams.get("emphasize") || undefined;
  const footer = url.searchParams.get("footer") || undefined;
  const size = parseInt(url.searchParams.get("size") || "1080", 10);

  try {
    const brand = getBrand(brandSlug);

    const [interBold, interMedium, monoBold] = await Promise.all([
      fetchFont("https://github.com/rsms/inter/raw/master/docs/font-files/Inter-ExtraBold.otf"),
      fetchFont("https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.otf"),
      fetchFont(
        "https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Bold.ttf"
      ),
    ]);

    if (composition !== "declaration") {
      return new Response(`unknown composition: ${composition}`, { status: 400 });
    }

    return new ImageResponse(
      (
        <DeclarationComposition
          brand={brand}
          kicker={kicker}
          headline={headline}
          emphasize={emphasize}
          footer={footer}
        />
      ),
      {
        width: size,
        height: size,
        fonts: [
          { name: "Inter", data: interBold, style: "normal", weight: 800 },
          { name: "Inter", data: interMedium, style: "normal", weight: 500 },
          { name: "JetBrains Mono", data: monoBold, style: "normal", weight: 700 },
        ],
      }
    );
  } catch (e) {
    return new Response(`render error: ${(e as Error).message}`, { status: 500 });
  }
}
