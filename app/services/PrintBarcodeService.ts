/**
 * Shared option lists + helpers for barcode printing.
 *
 * Both the quick "Print Barcode" modal and the full-page Barcode Generator
 * present the same Print Type / Size / Template / Price Type choices, so the
 * option data lives here in one place instead of being duplicated per screen.
 */

export type PriceType = "B2C" | "B2B";

export const printTypeOptions = [
  { value: "1ups", label: "1 unit per sheet" },
  { value: "2ups", label: "2 unit per sheet" },
  { value: "3ups", label: "3 unit per sheet" },
  { value: "4ups", label: "4 unit per sheet" },
  { value: "a4", label: "A4" },
];

/** Available label sizes (mm) keyed by print type. */
export const sizeValuesMap: Record<string, string[]> = {
  "1ups": ["100x80", "65x40", "80x50"],
  "2ups": ["38x25", "25x50", "50x25", "50x30", "38x38", "45x38", "25x20"],
  "3ups": ["66.5x27.5", "28x21", "33x20", "35x22", "34x25", "50x30"],
  "4ups": ["24x18", "25x200"],
  a4: [
    "a4_40l",
    "a4_35x39",
    "a4_25x50",
    "a4_50x25",
    "a4_50x30",
    "a4_39x47.5",
    "a4_48x24",
  ],
};

export const formatSizeLabel = (value: string) => {
  if (value === "label") return "label";
  if (value.startsWith("a4_")) {
    const rest = value.slice(3);
    return /^\d/.test(rest) ? `A4 ${rest} mm` : `A4 ${rest}`;
  }
  return /^[\d.]+x[\d.]+$/.test(value) ? `${value} mm` : value;
};

export const sizeOptionsMap: Record<
  string,
  { value: string; label: string }[]
> = Object.fromEntries(
  Object.entries(sizeValuesMap).map(([k, vals]) => [
    k,
    vals.map((v) => ({ value: v, label: formatSizeLabel(v) })),
  ]),
);

export const templateOptions = [
  { value: "full", label: "Template 1" },
  { value: "retail", label: "Template 2" },
];

/** Price Type only applies to the retail ("Template 2") layout. */
export const priceTypeOptions: { value: PriceType; label: string }[] = [
  { value: "B2C", label: "B2C" },
  { value: "B2B", label: "B2B" },
];
