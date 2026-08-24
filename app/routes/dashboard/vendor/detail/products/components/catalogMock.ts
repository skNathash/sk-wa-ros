/**
 * Hard-coded data points for the vendor catalog table. The catalog API does not
 * return pack size, sales velocity, last-buy price, par level or reorder
 * suggestions yet — these are derived from the row index so the UI stays stable
 * across renders. Replace with API fields once available.
 */

export type CatalogMockRow = {
  /** Pack description, e.g. "20 × 100g". */
  pack: string;
  mrp: number;
  soldPerMonth: number;
  lastBuyPrice: number;
  lastBuyAgo: string;
  vendorPrice: number;
  /** vendorPrice - lastBuyPrice, rounded. */
  priceDelta: number;
  stock: number;
  par: number;
  /** Suggested reorder qty; 0 hides the suggestion chip. */
  suggestedQty: number;
};

const packs = ["20 × 100g", "40 × 50g", "24 × 100g", "6 × 1kg", "12 × 500ml"];
const agos = ["3d ago", "6d ago", "12d ago", "18d ago"];
const deltas = [2, 0, 0, 0, -2, 5, 0, -3];

export const getCatalogMockRow = (
  index: number,
  price?: number,
): CatalogMockRow => {
  const base = Math.round(Number(price) > 0 ? Number(price) : 42 + index * 7);
  const delta = deltas[index % deltas.length];
  const par = 10 + (index % 4) * 5;
  const stock = [24, 18, 9, 22, 14, 2, 0, 31][index % 8];

  return {
    pack: packs[index % packs.length],
    mrp: Math.round(base * 1.14),
    soldPerMonth: 14 + ((index * 6) % 45),
    lastBuyPrice: base,
    lastBuyAgo: agos[index % agos.length],
    vendorPrice: base + delta,
    priceDelta: delta,
    stock,
    par,
    suggestedQty: stock < par ? par - stock + 5 : 0,
  };
};
