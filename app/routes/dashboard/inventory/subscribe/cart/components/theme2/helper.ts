import UomPriceService from "~/services/UomPriceService";
import {
  DEFAULT_B2C_PRICE_CONFIG,
  resolveB2cPrice,
  type B2cPriceConfigValue,
} from "../B2cPriceConfig";

/**
 * View model for one theme-2 cart line. Everything the row renders is derived
 * here (prices in display scale, UOM hints, badge flags, margin) so the row
 * components stay markup-only — no calls inside JSX.
 */
export type CartRowView = {
  item: any;
  index: number;
  /** Name shown when the row isn't an editable clone name input. */
  displayName: string;
  /** Cloned, non-offer rows still name themselves through an inline input. */
  showNameInput: boolean;
  /** Up to three letters for the initials tile when there's no image. */
  initials: string;
  /** Fill for the initials tile, picked off the name so a line keeps its colour. */
  avatarClass: string;
  image?: string;
  /** "Brand · Category" style meta line, empty when neither exists. */
  subtitle: string;
  brandLabel: string;
  categoryLabel: string;
  dealRefId: string;
  hsnLabel: string;
  gstLabel: string;
  /** Raw HSN / GST for the editable inputs — "" rather than the "--" label. */
  hsnValue: string;
  gstValue: number | string;
  /**
   * HSN, GST and the description are the store's own to fill in on a duplicate
   * line; on a catalog deal they come from StoreKing and are read-only.
   */
  isDetailEditable: boolean;
  unitType: string;
  displayUom: string;
  isSmallUom: boolean;
  /** MRP / purchase price in the scale the inputs edit in. */
  displayMrp: number | string;
  displayPrice: number | string;
  /** Same two prices as plain numbers, for <Amount /> which needs one. */
  mrpAmount: number;
  priceAmount: number;
  baseUnitMrp: number;
  baseUnitPrice: number;
  /** Quantity in API units — the per-kg/per-litre echo under the stepper. */
  apiQuantity: number;
  quantity: number | string;
  b2cConfig: B2cPriceConfigValue;
  b2cPrice: number;
  /** "Fixed" / "12% off" / "" — the qualifier beside the B2C price. */
  b2cNote: string;
  /** Free-text product description, "" when the item carries none. */
  descriptionLabel: string;
  totalPrice: number;
  /** Margin of MRP over purchase price, as a whole percent. */
  marginPct: number;
  /** MRP × stock qty — what the line is expected to sell for. */
  mrpValue: number;
  marginLabel: string;
  marginClass: string;
  hasMargin: boolean;
  isCloned: boolean;
  isLocalDeal: boolean;
  isConsumerOffer: boolean;
  /** A line is "ready" once it carries a barcode and a stock quantity. */
  isReady: boolean;
  /** Why the line isn't ready yet — shown inline on the row. */
  pendingReason: string;
  rowClass: string;
};

const MARGIN_GOOD = "tw:bg-emerald-50 tw:text-emerald-700";
const MARGIN_OK = "tw:bg-amber-50 tw:text-amber-700";
const MARGIN_LOW = "tw:bg-rose-50 tw:text-rose-700";

/* Initials tiles get a colour off the name rather than one house colour, so a
   long cart stays scannable — the eye finds a line by its dot before it reads
   the text. Deterministic, so the same product keeps the same colour. */
const AVATAR_CLASSES = [
  "tw:bg-violet-500",
  "tw:bg-amber-500",
  "tw:bg-rose-500",
  "tw:bg-emerald-600",
  "tw:bg-sky-500",
  "tw:bg-fuchsia-500",
  "tw:bg-orange-500",
  "tw:bg-teal-600",
];

const avatarClassFor = (name: string) => {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return AVATAR_CLASSES[sum % AVATAR_CLASSES.length];
};

export const toCartRowView = (item: any, index: number): CartRowView => {
  const unitType = item.unitType || "piece";
  const isSmallUom = UomPriceService.isSmallUom(unitType);
  const b2cConfig: B2cPriceConfigValue =
    item.b2cPriceConfig || DEFAULT_B2C_PRICE_CONFIG;
  const b2cDiscount = Number(b2cConfig.discount) || 0;

  const mrp = Number(item.mrp) || 0;
  const price = Number(item.price) || 0;
  const marginPct = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const brandLabel = item.brand?.name || item.newBrand || "";
  const categoryLabel = item.category?.name || "";
  const subtitle = [brandLabel, categoryLabel].filter(Boolean).join(" · ");

  const displayName = item.isCloned ? item.dealName || item.name : item.name;
  // Blank stock reads as 0 so the stepper always shows a number.
  const quantity =
    item.quantity === "" || item.quantity == null ? 0 : item.quantity;
  const hasBarcode = !!(item.barcode || "").trim();
  const hasQty = Number(quantity) > 0;
  // Duplicates carry no stock of their own — they're ready once named.
  const isReady = item.isCloned
    ? !!(item.dealName || item.name)
    : hasBarcode && hasQty;

  let pendingReason = "";
  if (!isReady) {
    if (item.isCloned) pendingReason = "Name needed";
    else if (!hasBarcode && !hasQty) pendingReason = "Barcode & stock needed";
    else if (!hasBarcode) pendingReason = "Barcode needed";
    else pendingReason = "Stock qty needed";
  }

  return {
    item,
    index,
    displayName,
    showNameInput: !!item.isCloned && !item.isConsumerOffer,
    initials: String(displayName || "")
      .trim()
      .slice(0, 3),
    avatarClass: avatarClassFor(String(displayName || "")),
    image: item.images?.length ? item.images[0] : undefined,
    subtitle,
    brandLabel,
    categoryLabel,
    dealRefId: item.dealRefId || "",
    hsnLabel: item.hsnNumber || item.hsn || "--",
    gstLabel: `${item.gst ?? 0}%`,
    hsnValue: item.hsnNumber || item.hsn || "",
    gstValue: item.gst ?? "",
    isDetailEditable: !!item.isCloned,
    unitType,
    displayUom: UomPriceService.getDisplayUom(unitType),
    isSmallUom,
    displayMrp: UomPriceService.toDisplayPrice(item.mrp, unitType),
    displayPrice: UomPriceService.toDisplayPrice(item.price, unitType),
    mrpAmount: Number(UomPriceService.toDisplayPrice(item.mrp, unitType)) || 0,
    priceAmount:
      Number(UomPriceService.toDisplayPrice(item.price, unitType)) || 0,
    baseUnitMrp: UomPriceService.toBaseUnitPrice(item.mrp),
    baseUnitPrice: UomPriceService.toBaseUnitPrice(item.price),
    apiQuantity: UomPriceService.toApiQuantity(quantity, unitType) || 0,
    quantity,
    b2cConfig,
    b2cPrice: resolveB2cPrice(b2cConfig, item.mrp),
    b2cNote: b2cConfig.isFixedPrice
      ? "Fixed"
      : b2cDiscount > 0
        ? `${b2cDiscount}% off`
        : "",
    descriptionLabel: String(item.description || "").trim(),
    totalPrice: Number(item.totalPrice) || 0,
    marginPct,
    mrpValue:
      (Number(UomPriceService.toDisplayPrice(item.mrp, unitType)) || 0) *
      (Number(quantity) || 0),
    marginLabel: `${marginPct}%`,
    marginClass:
      marginPct >= 20 ? MARGIN_GOOD : marginPct >= 10 ? MARGIN_OK : MARGIN_LOW,
    hasMargin: mrp > 0 && price > 0,
    isCloned: !!item.isCloned,
    isLocalDeal: !!item.isLocalDeal,
    isConsumerOffer: !!item.isConsumerOffer,
    isReady,
    pendingReason,
    rowClass: [
      item.duplicateItemAnimate ? "duplicate-animate" : "",
      item.globalQtyAnimate ? "animate__animated animate__flash" : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
};

export const toCartRowViews = (products: any[]): CartRowView[] =>
  (products || []).map(toCartRowView);

export type CartTotals = {
  totalProducts: number;
  totalValue: number;
  totalUnits: number;
  readyCount: number;
  pendingCount: number;
  /** "2 of 6 ready · 4 pending" — the strip under the cart list. */
  readyLabel: string;
  /** Percentage of lines that are ready, for the progress meter. */
  readyPercent: number;
  /** "66 units total" — the hint under the item count. */
  unitsLabel: string;
  /** Cart-wide margin, weighted by what each line is worth. */
  avgMarginPct: number;
  avgMarginLabel: string;
};

/**
 * Cart-wide roll-up: the Total Items / Total Price pair the old summary showed,
 * plus the readiness split the theme-2 overview, list tally and footer share.
 * All of it comes off the rows already in state — nothing extra is fetched.
 */
export const getCartTotals = (rows: CartRowView[]): CartTotals => {
  const totalProducts = rows.length;
  let totalValue = 0;
  let totalUnits = 0;
  let readyCount = 0;
  let mrpValue = 0;

  rows.forEach((row) => {
    totalValue += row.totalPrice;
    totalUnits += Number(row.quantity) || 0;
    mrpValue += row.mrpValue;
    if (row.isReady) readyCount += 1;
  });

  const pendingCount = totalProducts - readyCount;
  // Weighted by revenue rather than a plain average of the per-line percents:
  // a 40% margin on one ₹20 line shouldn't outweigh 8% on ₹8,000 of stock.
  const avgMarginPct =
    mrpValue > 0 ? Math.round(((mrpValue - totalValue) / mrpValue) * 100) : 0;

  return {
    totalProducts,
    totalValue,
    totalUnits,
    readyCount,
    pendingCount,
    readyLabel: `${readyCount} of ${totalProducts} ready · ${pendingCount} pending`,
    readyPercent: totalProducts
      ? Math.round((readyCount / totalProducts) * 100)
      : 0,
    unitsLabel: `${totalUnits} unit${totalUnits === 1 ? "" : "s"} total`,
    avgMarginPct,
    avgMarginLabel: `${avgMarginPct}%`,
  };
};
