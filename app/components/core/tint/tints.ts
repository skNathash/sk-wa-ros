/**
 * Tints — the one place that decides "what colour is this block?".
 *
 * Across the app the same idea keeps getting re-invented: a tile that carries an
 * image, an initial or a small stat is painted with a soft colour so a row of
 * them reads as distinct things rather than a run of grey boxes. Each screen
 * used to carry its own little palette, so the same entity could be teal in one
 * list and violet in the next.
 *
 * A design is expressed as plain CSS, not Tailwind classes, so it works in
 * `style={{}}`, in gradients and in `color-mix()` alike.
 */

export type TintDesign = {
  /** Stable key — handy for tests and for picking a tone by name. */
  key: string;
  /** Full `background` shorthand: pattern layer(s) first, then the wash. */
  background: string;
  /** Hairline that keeps the fill from floating on white. */
  ring: string;
  /** The saturated hue for whatever sits on the block — text, icons, initials. */
  ink: string;
};

/** Fine diagonal hatching laid over a washed plate. */
export const TINT_HATCH =
  "repeating-linear-gradient(135deg, rgba(255,255,255,0.38) 0 1px, transparent 1px 9px)";

/**
 * The background designs, spaced around the wheel so two adjacent blocks rarely
 * collide. Colours track Tailwind's 100 / 200 / 700 steps, which is what the
 * hand-rolled palettes were reaching for anyway.
 */
export const TINT_DESIGNS: TintDesign[] = [
  {
    key: "teal",
    background: `${TINT_HATCH}, linear-gradient(135deg, #ccfbf1 0%, #a7d5cf 100%)`,
    ring: "#99f6e4",
    ink: "#0f766e",
  },
  {
    key: "emerald",
    background: `${TINT_HATCH}, linear-gradient(135deg, #d1fae5 0%, #b6e2cd 100%)`,
    ring: "#a7f3d0",
    ink: "#047857",
  },
  {
    key: "sky",
    background: `${TINT_HATCH}, linear-gradient(135deg, #e0f2fe 0%, #a4d1ec 100%)`,
    ring: "#bae6fd",
    ink: "#0369a1",
  },
  {
    key: "amber",
    background: `${TINT_HATCH}, linear-gradient(135deg, #fef3c7 0%, #f5cda1 100%)`,
    ring: "#fde68a",
    ink: "#b45309",
  },
  {
    key: "rose",
    background: `${TINT_HATCH}, linear-gradient(135deg, #ffe4e6 0%, #f3c2c8 100%)`,
    ring: "#fecdd3",
    ink: "#be123c",
  },
  {
    key: "violet",
    background: `${TINT_HATCH}, linear-gradient(135deg, #ede9fe 0%, #c9b6ec 100%)`,
    ring: "#ddd6fe",
    ink: "#6d28d9",
  },
  {
    key: "indigo",
    background: `${TINT_HATCH}, linear-gradient(135deg, #e0e7ff 0%, #b7c7f1 100%)`,
    ring: "#c7d2fe",
    ink: "#4338ca",
  },
];

/**
 * The theme design: the store's own primary mixed into white. Use it where the
 * block should read as "app furniture" (product thumbs, deal thumbs) rather than
 * as one identity among many — pass `index={-1}`, or `TINT_PRIMARY` directly.
 */
export const TINT_PRIMARY: TintDesign = {
  key: "primary",
  background: "color-mix(in srgb, var(--primary) 7%, #fff)",
  ring: "color-mix(in srgb, var(--primary) 12%, transparent)",
  ink: "var(--primary)",
};

/** Design at `index`, wrapping round the array. Negative index → the theme design. */
export const tintAt = (index = 0): TintDesign => {
  if (index < 0) return TINT_PRIMARY;
  return TINT_DESIGNS[Math.floor(index) % TINT_DESIGNS.length];
};

/**
 * Index for a name — a cheap, stable hash. Use it when the colour should follow
 * the *entity* rather than its position, so the same party keeps its colour
 * wherever it appears instead of changing when the list re-sorts.
 */
export const tintIndexFor = (seed = "") => {
  let sum = 0;
  const value = seed.trim().toLowerCase();
  for (let i = 0; i < value.length; i += 1) sum += value.charCodeAt(i);
  return sum % TINT_DESIGNS.length;
};

/**
 * Everything a tinted tile needs to paint an entity — resolved once, when the
 * list comes back from the API, rather than on every render in the template.
 */
export type TileDecor = {
  /** Name the tile prints — the display name where the API gave one. */
  _label: string;
  /** Stand-in glyph for an entity with no image. */
  _initial: string;
  /** Tint slot for the plate behind the image. */
  _tintIndex: number;
  /** Saturated tone of that tint, for the initial / wordmark ink. */
  _ink: string;
};

export const tileDecor = (name = "", displayName?: string): TileDecor => {
  const label = displayName || name;
  const index = tintIndexFor(label);
  return {
    _label: label,
    _initial: (label.trim().charAt(0) || "#").toUpperCase(),
    _tintIndex: index,
    _ink: tintAt(index).ink,
  };
};

/** Decorates a formatted brand/menu/party list straight off the API response. */
export const withTileDecor = <
  T extends { name?: string; _displayName?: string },
>(
  items: T[],
): (T & TileDecor)[] =>
  items.map((item) => ({ ...item, ...tileDecor(item.name, item._displayName) }));
