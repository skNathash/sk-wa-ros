const SMALL_UOM: Record<string, { displayUom: string; factor: number }> = {
  gm: { displayUom: "kg", factor: 1000 },
  ml: { displayUom: "ltr", factor: 1000 },
};

const UomPriceService = {
  isSmallUom(uom?: string) {
    return !!(uom && SMALL_UOM[uom]);
  },

  getDisplayUom(uom?: string) {
    return uom && SMALL_UOM[uom] ? SMALL_UOM[uom].displayUom : uom || "";
  },

  // The base unit label (gm/ml) when the uom is a small uom, else ""
  getBaseUom(uom?: string) {
    return uom && SMALL_UOM[uom] ? uom : "";
  },

  // API value (per-gm/per-ml) -> input field value (per-kg/per-ltr)
  toDisplayPrice(price: any, uom?: string) {
    const cfg = uom ? SMALL_UOM[uom] : undefined;
    if (price === "" || price == null || !cfg) return price;
    const n = Number(price);
    if (Number.isNaN(n)) return price;
    return n * cfg.factor;
  },

  // Input field value (per-kg/per-ltr) -> API value (per-gm/per-ml)
  toApiPrice(price: any, uom?: string) {
    const cfg = uom ? SMALL_UOM[uom] : undefined;
    if (price === "" || price == null || !cfg) return price;
    const n = Number(price);
    if (Number.isNaN(n)) return price;
    return n / cfg.factor;
  },

  // Input field quantity (in kg/ltr) -> API quantity (in gm/ml)
  toApiQuantity(qty: any, uom?: string) {
    const cfg = uom ? SMALL_UOM[uom] : undefined;
    if (qty === "" || qty == null || !cfg) return qty;
    const n = Number(qty);
    if (Number.isNaN(n)) return qty;
    return n * cfg.factor;
  },

  // API quantity (in gm/ml) -> input field quantity (in kg/ltr)
  toDisplayQuantity(qty: any, uom?: string) {
    const cfg = uom ? SMALL_UOM[uom] : undefined;
    if (qty === "" || qty == null || !cfg) return qty;
    const n = Number(qty);
    if (Number.isNaN(n)) return qty;
    return n / cfg.factor;
  },

  // Per-base-unit price (per-gm/per-ml) for the small-uom hint shown below the input
  toBaseUnitPrice(price: any) {
    if (price === "" || price == null) return 0;
    const n = Number(price);
    return Number.isNaN(n) ? 0 : n;
  },
};

export default UomPriceService;
