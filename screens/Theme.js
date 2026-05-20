// theme.js — single source of truth for all colors and spacing.
// Import what you need: import { colors, radius, spacing } from '../theme';

export const colors = {
    // ── Backgrounds ──────────────────────────────
    bg: {
      screen:   "#080812",   // main screen background (SafeAreaView)
      card:     "rgba(255,255,255,0.04)",  // card / section background
      input:    "rgba(255,255,255,0.07)",  // text input background
      pill:     "rgba(255,255,255,0.06)",  // tab bar, toggle track off
      overlay:  "rgba(0,0,0,0.75)",        // modal backdrop
      modal:    "#16102a",                 // modal box background
    },
  
    // ── Borders ──────────────────────────────────
    border: {
      subtle:   "rgba(255,255,255,0.07)",  // card borders
      medium:   "rgba(255,255,255,0.12)",  // input borders, dividers
      purple:   "rgba(147,51,234,0.25)",   // purple accent borders
      header:   "rgba(147,51,234,0.15)",   // header bottom divider
    },
  
    // ── Text ─────────────────────────────────────
    text: {
      primary:  "#f0ecff",                 // headings, main content
      secondary:"rgba(255,255,255,0.45)", // labels, sublabels
      muted:    "rgba(255,255,255,0.25)", // hints, placeholders
      danger:   "#f87171",                 // errors, low-time warnings
    },
  
    // ── Brand / Accent ───────────────────────────
    accent: {
      purple:   "#9333ea",
      indigo:   "#6366f1",
      pink:     "#ec4899",
      lavender: "#c084fc",
      softPurple:"rgba(147,51,234,0.15)", // icon backgrounds, badge fills
      softIndigo:"rgba(99,102,241,0.15)",
    },
  
    // ── Gradients (pass directly to LinearGradient colors prop) ──
    gradient: {
      brand:    ["#9333ea", "#ec4899"],   // primary CTA buttons
      brandAlt: ["#6366f1", "#9333ea"],   // join button, secondary CTAs
      header:   ["#9333ea", "#6366f1"],   // screen headers
      bubble:   ["#9333ea", "#6366f1"],   // my message bubbles
      avatar:   ["#9333ea", "#6366f1"],   // avatar rings / icons
    },
  
    // ── Semantic ─────────────────────────────────
    online:   "#34d399",   // online dot
    danger:   "#f87171",   // logout, errors, low timer
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
  