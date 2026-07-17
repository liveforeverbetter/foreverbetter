// Shared motion helper for Aperture components.
// Respects prefers-reduced-motion by disabling transform-based motion (opacity still allowed).
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Returns a scale transform string, or "none" when the user prefers reduced motion.
export function pressScale(active, amount = 0.97) {
  if (!active || prefersReducedMotion()) return "none";
  return `scale(${amount})`;
}
