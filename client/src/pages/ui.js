// ui.js

export const UI = {
  // PAGE
  page: "min-h-screen bg-stone-950 text-amber-50",

  // PANELS / CARDS
  panel:
    "rounded-[2rem] border border-amber-900/30 bg-stone-900/60 backdrop-blur",

  card:
    "rounded-[1.75rem] border border-amber-900/30 bg-stone-900/60 shadow-lg shadow-amber-950/20",

  cardHover:
    "transition hover:-translate-y-1 hover:border-amber-700/50",

  // HEADERS
  header:
    "text-2xl font-serif text-amber-50",

  subheader:
    "text-xs uppercase tracking-[0.3em] text-amber-500/80",

  textMuted: "text-stone-400",
  textFaint: "text-stone-500",

  // BUTTONS
  primary:
    "px-5 py-2 bg-amber-700 hover:bg-amber-600 text-stone-950 font-semibold rounded transition",

  secondary:
    "px-5 py-2 border border-amber-700/40 text-amber-200 hover:border-amber-500 hover:text-amber-50 rounded transition",

  // BADGES
  badge:
    "inline-flex items-center rounded-full border border-amber-900/30 bg-stone-900/70 px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-amber-200 backdrop-blur",

  badgeAlt:
    "inline-flex items-center rounded-full border border-amber-900/30 bg-stone-900/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200",

  successBadge:
    "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",

  warningBadge:
    "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] border border-amber-500/20 bg-amber-500/10 text-amber-200",

  // TABLE
  table: "w-full text-sm border border-amber-900/20",
  th: "bg-stone-900/80 text-amber-200 px-3 py-2 text-left",
  td: "px-3 py-2 text-stone-300",
  tr: "border-t border-amber-900/10",

  // INPUTS
  input:
    "bg-stone-900 border border-amber-900/30 text-amber-100 px-3 py-2 rounded focus:outline-none focus:border-amber-700",
};