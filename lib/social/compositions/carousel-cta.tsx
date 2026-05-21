// Composition: carousel_cta (post-specific CTA, second-to-last slide).
// Mono command-line treatment from Claude Design — amber border-left,
// ember-color first line, fg200 follow-ups.

import type { Brand } from "../brands";
import { SlideFrame, EmphasizedHeadline } from "../primitives";
import { TOKEN } from "../tokens";

export type CarouselCtaProps = {
  brand: Brand;
  closer: string;          // short payoff line; the question or push
  emphasize?: string;
  cta: string;             // the headline action (DM "AUDIT", book a call, etc.)
  link?: string;           // optional URL or handle, shown as a comment line
  counter?: string;
};

export function CarouselCtaComposition({ closer, emphasize, cta, link, counter }: CarouselCtaProps) {
  const commands: string[] = [`$ ${cta}`];
  if (link) commands.push(`# ${link}`);
  commands.push("# no obligation. plain english back.");

  return (
    <SlideFrame eyebrow="next move" footerCounter={counter}>
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
        <EmphasizedHeadline
          text={closer}
          emphasize={emphasize}
          fontSize={closer.length < 60 ? 80 : 60}
          letterSpacing="-0.028em"
          lineHeight={1.05}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            borderLeft: `2px solid ${TOKEN.ember500}`,
            paddingLeft: 28,
            marginTop: 48,
          }}
        >
          {commands.map((cmd, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 24,
                color: i === 0 ? TOKEN.ember300 : TOKEN.fg200,
                letterSpacing: 0,
              }}
            >
              {cmd}
            </div>
          ))}
        </div>
      </div>
    </SlideFrame>
  );
}
