import FranchiseService from "~/services/FranchiseService";

/** The two plan shapes the table puts side by side. */
export type CompareShapeType = "stock" | "shop";

export interface CompareRowCell {
  /** Perk description of that shape, or "--" when the shape has no such perk. */
  text: string;
  /** Quoted copy — rendered in the serif italic voice. */
  isQuote: boolean;
}

export interface CompareTableRow {
  /** Perk code from the API, e.g. "PRICED BY" — unique per row. */
  key: string;
  /** Row heading in the centre column — the perk code as sent. */
  label: string;
  stock: CompareRowCell;
  shop: CompareRowCell;
}

export interface ShapesVsTableData {
  rows: CompareTableRow[];
  /** Perk chip counts in the header of each column. */
  stockCount: number;
  shopCount: number;
}

/** Shown when one shape doesn't carry the perk the row is about. */
const MISSING = "--";

/** Query and label that differ between the two plan shapes. */
const SHAPE = {
  stock: { typeOfPlan: FranchiseService.PLAN_SHAPE_TYPE.stock },
  shop: { typeOfPlan: FranchiseService.PLAN_SHAPE_TYPE.shop },
} as const;

/** The API returns one single-key object per plan type: [{ FeatureLimit: [...] }, { Hybrid: [...] }]. */
const pickPerks = (data: any[], typeOfPlan: string): any[] => {
  const entry = data.find((item: any) => Array.isArray(item?.[typeOfPlan]));

  return entry?.[typeOfPlan] || [];
};

/** Perk descriptions of one shape, keyed by perk code. */
const toDescriptionMap = (perks: any[]) => {
  const map = new Map<string, string>();

  perks.forEach((perk: any) => {
    const code = String(perk?.perkCode || "").trim();
    if (code) map.set(code, String(perk?.description || "").trim());
  });

  return map;
};

/** Stock codes lead, shop-only codes follow — both in the order the API sends. */
const orderedCodes = (stock: Map<string, string>, shop: Map<string, string>) => [
  ...stock.keys(),
  ...[...shop.keys()].filter((code) => !stock.has(code)),
];

const toCell = (description?: string): CompareRowCell => {
  const text = description || MISSING;

  return { text, isQuote: /^["“']/.test(text) };
};

/**
 * Perks bundled with the service fee plans — the same read the benefits page
 * makes, laid out as one row per perk code.
 * Endpoint: GET franchise/service-fee-plan/perks
 */
export const getData = async (): Promise<ShapesVsTableData> => {
  const response = await FranchiseService.fetchServiceFeePlanPerks();
  const data = response?.data?.data || [];

  const stock = toDescriptionMap(pickPerks(data, SHAPE.stock.typeOfPlan));
  const shop = toDescriptionMap(pickPerks(data, SHAPE.shop.typeOfPlan));

  const rows = orderedCodes(stock, shop).map((code) => ({
    key: code,
    label: code,
    stock: toCell(stock.get(code)),
    shop: toCell(shop.get(code)),
  }));

  return { rows, stockCount: stock.size, shopCount: shop.size };
};
