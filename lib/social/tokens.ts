// Design tokens for the Prometheus social engine.
// Adopted from Claude Design's Prometheus Post handoff — refined palette,
// horizontal ember black-body decay, warm cream foreground. Use these
// everywhere instead of ad-hoc colors so the brand stays coherent.

export const TOKEN = {
  // Background — warm dark, never pure black. Forge-lit room, low-key.
  bg900: "#15100e",
  bg800: "#1d1614",
  bg700: "#241b18",
  bg600: "#2b2220",
  bg500: "#352925",

  // Foreground — warm cream → warm taupe.
  fg100: "#f3ead8",
  fg200: "#ddcdb5",
  fg300: "#b3a18a",
  fg400: "#86766a",
  fg500: "#5d4f47",

  // Ember — black-body decay, dark hot → cream hot.
  ember900: "#7a2a0a",
  ember700: "#c4501a",
  ember500: "#f28a2f",
  ember300: "#ffb868",
  ember100: "#ffdcae",
  ember050: "#fff1d9",

  // Hairline rules.
  rule:      "rgba(243,234,216,0.10)",
  ruleEmber: "rgba(242,138,47,0.30)",
} as const;

// Horizontal ember gradient — the website's signature treatment for emphasis
// text. Apply via `backgroundImage` + `WebkitBackgroundClip: 'text'` + transparent color.
export const EMBER_H = `linear-gradient(90deg, ${TOKEN.ember700} 0%, ${TOKEN.ember500} 32%, ${TOKEN.ember300} 62%, ${TOKEN.ember050} 100%)`;

// Forge background — radial that suggests rim-light from the upper-right.
export const FORGE_BG = `radial-gradient(130% 95% at 100% 0%, ${TOKEN.bg500} 0%, ${TOKEN.bg600} 35%, ${TOKEN.bg800} 78%, ${TOKEN.bg900} 100%)`;

// Lower-right inverse for the signoff slide.
export const FORGE_BG_INVERTED = `radial-gradient(130% 95% at 0% 100%, ${TOKEN.bg500} 0%, ${TOKEN.bg600} 35%, ${TOKEN.bg800} 78%, ${TOKEN.bg900} 100%)`;
