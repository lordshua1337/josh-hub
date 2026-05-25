// Shared helpers for the Instagram handoff (deploy) flow.
// Pure functions — safe to import from both the server export route and the
// client DeployView. No server-only deps.

// Brand-relevant fallback hashtags, shown when a caption has none of its own.
// Kept tight and on-topic — a wall of 30 generic tags reads as spam.
export const FALLBACK_HASHTAGS = [
  "#AIforBusiness",
  "#AIconsulting",
  "#BusinessAutomation",
  "#Operations",
  "#SmallBusinessAI",
  "#AIstrategy",
  "#Founders",
  "#BusinessGrowth",
  "#Productivity",
  "#FutureOfWork",
];

// Pull every #hashtag token out of a block of text, de-duplicated, order kept.
export function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(/#[A-Za-z0-9_]+/g) || [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    const key = m.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}

// Strip a trailing hashtag block off a caption so the body can be shown /
// copied on its own. Only removes hashtags that sit at the very end (the
// usual placement) — leaves inline tags mid-sentence alone.
export function captionWithoutTrailingTags(caption: string): string {
  return caption.replace(/(\s*#[A-Za-z0-9_]+)+\s*$/g, "").trim();
}

// A reel script object as stored in copy_blocks / metadata.
export type ReelLike = {
  duration: string;
  beats: { t: string; label: string; script: string }[];
};

export function reelToText(reel: ReelLike | undefined | null): string {
  if (!reel?.beats?.length) return "";
  return (
    `// reel · ${reel.duration}\n\n` +
    reel.beats.map((b) => `[${b.t}] ${b.label}\n${b.script}`).join("\n\n")
  );
}

// Build the caption.txt bundled inside the export zip: everything Josh needs
// to paste, in order, with clear section markers.
export function buildCaptionTxt(args: {
  topic?: string | null;
  caption: string;
  hashtags: string[];
  firstComment?: string;
  reel?: ReelLike | null;
}): string {
  const { topic, caption, hashtags, firstComment, reel } = args;
  const body = captionWithoutTrailingTags(caption);
  const parts: string[] = [];
  if (topic) parts.push(`TOPIC\n${topic}`);
  parts.push(`CAPTION\n${body || caption}`);
  if (hashtags.length) parts.push(`HASHTAGS\n${hashtags.join(" ")}`);
  if (firstComment) parts.push(`FIRST COMMENT (post as your own reply — link lives here)\n${firstComment}`);
  const reelTxt = reelToText(reel);
  if (reelTxt) parts.push(`REEL SCRIPT\n${reelTxt}`);
  return parts.join("\n\n" + "─".repeat(40) + "\n\n") + "\n";
}
