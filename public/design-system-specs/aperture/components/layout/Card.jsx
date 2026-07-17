import React from "react";

const TONES = {
  none:      { bg: "var(--surface-card)", fg: "var(--text-primary)" },
  teal:      { bg: "var(--teal-50)", fg: "var(--teal-700)" },
  sleep:     { bg: "var(--sleep-50)", fg: "var(--sleep-700)" },
  activity:  { bg: "var(--activity-50)", fg: "var(--activity-700)" },
  nutrition: { bg: "var(--nutrition-50)", fg: "var(--nutrition-700)" },
  mind:      { bg: "var(--mind-50)", fg: "var(--mind-700)" },
  vitals:    { bg: "var(--vitals-50)", fg: "var(--vitals-700)" },
  heart:     { bg: "var(--heart-50)", fg: "var(--heart-700)" },
  excellent: { bg: "var(--score-excellent-bg)", fg: "var(--score-excellent)" },
  good:      { bg: "var(--score-good-bg)", fg: "var(--score-good)" },
  fair:      { bg: "var(--score-fair-bg)", fg: "var(--score-fair)" },
  attention: { bg: "var(--score-attention-bg)", fg: "var(--score-attention)" },
};

const RADII = { md: "var(--radius-lg)", lg: "var(--radius-xl)", xl: "var(--radius-2xl)" };
const PADS = { sm: 16, md: 20, lg: 24 };

export function Card({
  tone = "none", radius = "lg", padding = "md", glow, interactive = false,
  gradient, children, style, onClick, ...rest
}) {
  const t = TONES[tone] || TONES.none;
  const [hover, setHover] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const tappable = interactive || onClick;
  const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let transform = "none";
  if (!reduce) {
    if (tappable && pressed) transform = "scale(0.985)";
    else if (interactive && hover) transform = "translateY(-2px)";
  }
  const bg = gradient ? gradient : t.bg;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPressed(false); }}
      onMouseDown={() => tappable && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        position: "relative",
        background: bg,
        color: tone === "none" ? "var(--text-primary)" : t.fg,
        borderRadius: RADII[radius] || RADII.lg,
        padding: typeof padding === "number" ? padding : (PADS[padding] || PADS.md),
        border: tone === "none" ? "1px solid var(--border-subtle)" : "1px solid transparent",
        boxShadow: glow ? "var(--aura-teal)" : "var(--shadow-card)",
        cursor: interactive || onClick ? "pointer" : "default",
        transform,
        transition: "transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
