import { getSpriteData } from "@/lib/sprite";

export function Sprite({ level }: { level: number }) {
  const { w, h, rects } = getSpriteData(level);
  return (
    <div id="xp-sprite">
      <svg viewBox={`0 0 ${w} ${h}`} fill="var(--accent)" shapeRendering="crispEdges">
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={1} />
        ))}
      </svg>
    </div>
  );
}
