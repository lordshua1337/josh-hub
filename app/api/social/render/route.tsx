// GET/POST /api/social/render
// Server-side renders a single composition to PNG using @vercel/og (Satori).
// Used by the engine to bake each post, and by the hub UI for live previews.

import { ImageResponse } from "@vercel/og";
import { getBrand } from "@/lib/social/brands";
import { DeclarationComposition } from "@/lib/social/compositions/declaration";

export const dynamic = "force-dynamic";
export const runtime = "edge";

// Google Fonts CSS API returns a TTF url (not woff2) when the request has
// no modern User-Agent. Satori needs TTF/OTF, so this is the right path.
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
  const css = await fetch(cssUrl, { cache: "force-cache" }).then((r) => r.text());
  const m = css.match(/src:\s*url\((https:[^)]+)\)/);
  if (!m) throw new Error(`Font URL not found in CSS for ${family} ${weight}`);
  const fontRes = await fetch(m[1], { cache: "force-cache" });
  if (!fontRes.ok) throw new Error(`Font fetch ${m[1]} ${fontRes.status}`);
  return fontRes.arrayBuffer();
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
      loadGoogleFont("Inter", 800),
      loadGoogleFont("Inter", 500),
      loadGoogleFont("JetBrains Mono", 700),
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
