export const colors = {
  // ── Backgrounds ──────────────────────────────
  bg: {
    screen:   "#0f1020", // softer than pure black
    card:     "rgba(255,255,255,0.05)",
    input:    "rgba(255,255,255,0.07)",
    pill:     "rgba(255,255,255,0.06)",
    overlay:  "rgba(0,0,0,0.65)",
    modal:    "#17182b",
  },

  // ── Borders ──────────────────────────────────
  border: {
    subtle:   "rgba(255,255,255,0.08)",
    medium:   "rgba(255,255,255,0.12)",
    purple:   "rgba(147,51,234,0.28)",
    header:   "rgba(147,51,234,0.18)",
  },

  // ── Text ─────────────────────────────────────
  text: {
    primary:  "#f5f3ff",
    secondary:"rgba(255,255,255,0.65)",
    muted:    "rgba(255,255,255,0.42)",
    danger:   "#f87171",
  },

  // ── Brand / Accent ───────────────────────────
  accent: {
    purple:   "#9333ea",
    indigo:   "#6366f1",
    pink:     "#ec4899",
    lavender: "#c4b5fd",

    softPurple:"rgba(147,51,234,0.16)",
    softIndigo:"rgba(99,102,241,0.16)",
  },

  // ── Gradients ────────────────────────────────
  gradient: {
    brand:    ["#9333ea", "#db2777"],
    brandAlt: ["#6366f1", "#9333ea"],
    header:   ["#7c3aed", "#4f46e5"],
    bubble:   ["#8b5cf6", "#6366f1"],
    avatar:   ["#9333ea", "#6366f1"],

    // Feature cards
    cardPurple: ["#1b1236", "#312e81"],
    cardBlue:   ["#13203f", "#1d4ed8"],
    cardDark:   ["#161625", "#27272a"],
  },

  // ── Semantic ─────────────────────────────────
  online:   "#34d399",
  danger:   "#f87171",
  warning:  "#fbbf24",
};

export const radius = {
  sm:   10,
  md:   14,
  lg:   18,
  xl:   24,
  full: 999,
};

export const spacing = {
  xs:  6,
  sm:  10,
  md:  16,
  lg:  20,
  xl:  28,
};

// Ambient blob style helper — use as a View style
export const blob = (color, size, top, left, bottom, right) => ({
  position:      "absolute",
  width:         size,
  height:        size,
  borderRadius:  size / 2,
  backgroundColor: color,
  top, left, bottom, right,
  pointerEvents: "none",
});
