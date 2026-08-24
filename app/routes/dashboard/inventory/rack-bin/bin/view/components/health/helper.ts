import { format } from "date-fns";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";

/**
 * A check either passes, needs attention soon (warn) or is actively costing the
 * store (fail). Only warn/fail rows are "fixable" and get an action button.
 */
export type CheckStatus = "pass" | "warn" | "fail";

/**
 * A deal a check or action points at. Both ids travel together because the
 * Products tab keys its rows off `dealId` while `dealRefId` is the stable human
 * code — the host resolves through either.
 */
export interface HealthDealRef {
  dealId: string;
  dealRefId: string;
  dealName: string;
}

export interface HealthCheck {
  key: string;
  /** Row headline — "Fullness within 30–90%". */
  title: string;
  /** Supporting line under the headline — "72% · optimal". */
  detail: string;
  status: CheckStatus;
  /**
   * Every deal this check flags — a single check ("No expired stock") routinely
   * covers several. Empty for bin-level checks like fullness.
   */
  deals: HealthDealRef[];
  /** Button label for a failing check. Defaults to "Fix". */
  fixLabel?: string;
}

export interface HealthAction {
  key: string;
  title: string;
  detail: string;
  /** Button label. When absent the action renders as advice only. */
  ctaLabel?: string;
  /** Deals the action applies to; may be more than one. */
  deals: HealthDealRef[];
}

export interface BinHealth {
  score: number;
  maxScore: number;
  /** "GOOD", "FAIR", … — shown next to the "BIN HEALTH" label. */
  gradeLabel: string;
  /** Tone driving the ring + grade colour. */
  tone: "good" | "fair" | "poor";
  /** "Fix 2 issues to reach 100". */
  headline: string;
  /** "1 expired · 1 out-of-stock". */
  subline: string;
  checks: HealthCheck[];
  actions: HealthAction[];
  passCount: number;
  fixCount: number;
}

/** One item row of the `/health` payload. */
interface HealthItem {
  id: string;
  dealRefId: string;
  dealName: string;
  quantity: number;
  barcodeExists: boolean;
  isExpired: boolean;
  expiredQuantity: number;
  isNearExpiry: boolean;
  nearExpiryQuantity: number;
  expiryDate: string | null;
  isOutOfStock: boolean;
}

const num = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** The bin is considered well-loaded inside this band. */
const FULL_MIN = 30;
const FULL_MAX = 90;

/**
 * How much of the 100-point score each check is worth. Expired stock is the
 * costliest problem (unsellable units already paid for), so it carries the most
 * weight; fullness is a housekeeping concern and carries the least.
 */
const WEIGHTS = {
  fullness: 15,
  barcodes: 15,
  expired: 30,
  nearExpiry: 20,
  outOfStock: 20,
};

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

const toDealRefs = (items: HealthItem[]): HealthDealRef[] =>
  items.map((i) => ({
    dealId: i.id,
    dealRefId: i.dealRefId,
    dealName: i.dealName,
  }));

/** Name the offending items, keeping the line short. */
const nameList = (items: HealthItem[], limit = 2) => {
  const names = items.slice(0, limit).map((i) => i.dealName);
  const rest = items.length - names.length;
  return rest > 0 ? `${names.join(", ")} +${rest} more` : names.join(", ");
};

/**
 * How well the bin sits inside the 30–90% band, as 0–1. Inside the band scores
 * full marks; outside it tapers so a bin at 92% is barely penalised while an
 * empty or overflowing one is not.
 */
const fullnessFraction = (pct: number) => {
  if (pct >= FULL_MIN && pct <= FULL_MAX) return 1;
  if (pct > FULL_MAX) return Math.max(0, 1 - (pct - FULL_MAX) / 10);
  return Math.max(0, pct / FULL_MIN);
};

/** Fraction of items that are clean for a given problem. */
const cleanFraction = (offending: number, total: number) =>
  total > 0 ? Math.max(0, 1 - offending / total) : 1;

const toneForScore = (score: number): BinHealth["tone"] => {
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
};

const gradeForScore = (score: number) => {
  if (score >= 90) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  if (score >= 50) return "FAIR";
  return "POOR";
};

const expiryLabel = (item: HealthItem) => {
  if (!item.expiryDate) return "";
  try {
    return ` · exp ${format(new Date(item.expiryDate), "dd MMM")}`;
  } catch {
    return "";
  }
};

/**
 * Turn the raw `/health` payload — bin fill plus a per-item problem flags list
 * — into the scored checklist and the recommended actions the tab renders.
 *
 * The API reports facts, not a score: the weighting, the pass/fail thresholds
 * and the wording all live here.
 */
export const normalizeHealth = (raw: any): BinHealth | null => {
  const d = raw?.data?.data ?? raw?.data ?? raw;
  if (!d || typeof d !== "object") return null;

  const items: HealthItem[] = Array.isArray(d.items) ? d.items : [];
  const summary = d.summary || {};
  const percentageFilled = Math.round(num(d.percentageFilled));
  const nearExpiryDays = num(d.nearExpiryDays, 7);

  const totalItems = num(summary.totalItems, items.length);
  const expired = items.filter((i) => i.isExpired);
  const nearExpiry = items.filter((i) => i.isNearExpiry);
  const outOfStock = items.filter((i) => i.isOutOfStock);
  const noBarcode = items.filter((i) => !i.barcodeExists);

  // Prefer the API's own counts; fall back to the item flags.
  const expiredCount = num(summary.expiredCount, expired.length);
  const nearExpiryCount = num(summary.nearExpiryCount, nearExpiry.length);
  const outOfStockCount = num(summary.outOfStockCount, outOfStock.length);
  const missingBarcodeCount = num(
    summary.missingBarcodeCount,
    noBarcode.length,
  );

  const checks: HealthCheck[] = [
    {
      key: "fullness",
      title: `Fullness within ${FULL_MIN}–${FULL_MAX}%`,
      detail: `${percentageFilled}% · ${
        percentageFilled > FULL_MAX
          ? String(d.status || "full").toLowerCase()
          : percentageFilled < FULL_MIN
            ? "under-used"
            : "optimal"
      }`,
      status:
        percentageFilled >= FULL_MIN && percentageFilled <= FULL_MAX
          ? "pass"
          : "warn",
      // Fullness is a property of the bin, not of any one deal — so this row
      // carries no deals and renders without a button.
      deals: [],
    },
    {
      key: "barcodes",
      title: "Barcodes on every SKU",
      detail: missingBarcodeCount
        ? `${nameList(noBarcode)} · no barcode`
        : `${totalItems} ${totalItems === 1 ? "SKU" : "SKUs"} · ${totalItems} ${
            totalItems === 1 ? "barcode" : "barcodes"
          }`,
      status: missingBarcodeCount ? "warn" : "pass",
      deals: toDealRefs(noBarcode),
    },
    {
      key: "expired",
      title: "No expired stock",
      detail: expiredCount
        ? `${nameList(expired)}${expiryLabel(expired[0])} · ${plural(
            expired.reduce((sum, i) => sum + num(i.expiredQuantity), 0),
            "unit",
          )} expired`
        : "Nothing expired in this bin",
      status: expiredCount ? "fail" : "pass",
      deals: toDealRefs(expired),
    },
    {
      key: "near-expiry",
      title: "No near-expiry stock",
      detail: nearExpiryCount
        ? `${nameList(nearExpiry)}${expiryLabel(nearExpiry[0])} · ${plural(
            nearExpiry.reduce((sum, i) => sum + num(i.nearExpiryQuantity), 0),
            "unit",
          )} within ${nearExpiryDays} days`
        : `Nothing expiring in the next ${nearExpiryDays} days`,
      status: nearExpiryCount ? "warn" : "pass",
      deals: toDealRefs(nearExpiry),
    },
    {
      key: "out-of-stock",
      title: "No out-of-stock SKUs",
      detail: outOfStockCount
        ? `${nameList(outOfStock)} · 0 units`
        : `All ${totalItems} ${totalItems === 1 ? "SKU" : "SKUs"} in stock`,
      status: outOfStockCount ? "fail" : "pass",
      deals: toDealRefs(outOfStock),
    },
  ];

  const score = Math.round(
    WEIGHTS.fullness * fullnessFraction(percentageFilled) +
      WEIGHTS.barcodes * cleanFraction(missingBarcodeCount, totalItems) +
      WEIGHTS.expired * cleanFraction(expiredCount, totalItems) +
      WEIGHTS.nearExpiry * cleanFraction(nearExpiryCount, totalItems) +
      WEIGHTS.outOfStock * cleanFraction(outOfStockCount, totalItems),
  );

  const passCount = checks.filter((c) => c.status === "pass").length;
  const fixCount = checks.length - passCount;

  const issues = [
    expiredCount ? `${expiredCount} expired` : "",
    nearExpiryCount ? `${nearExpiryCount} near-expiry` : "",
    outOfStockCount ? `${outOfStockCount} out-of-stock` : "",
    missingBarcodeCount ? `${missingBarcodeCount} without barcode` : "",
  ].filter(Boolean);

  // Recommended actions, ordered by what costs the store most. Each points at a
  // product row in the Products tab, where move / adjust / barcode already live.
  const actions: HealthAction[] = [
    ...expired.map((item) => ({
      key: `expired-${item.id}`,
      title: `Clear expired lot · ${item.dealName}`,
      detail: `${plural(
        num(item.expiredQuantity),
        "unit",
      )} expired · move to non-sellable and write off`,
      ctaLabel: "Open item",
      deals: toDealRefs([item]),
    })),
    ...nearExpiry.map((item) => ({
      key: `near-expiry-${item.id}`,
      title: `Promo ${item.dealName} expiring lot`,
      detail: `${plural(
        num(item.nearExpiryQuantity),
        "unit",
      )} expire within ${nearExpiryDays} days · discount clears stock`,
      ctaLabel: "Open item",
      deals: toDealRefs([item]),
    })),
    ...outOfStock.map((item) => ({
      key: `out-of-stock-${item.id}`,
      title: `Reorder ${item.dealName}`,
      detail: "0 units in this bin · losing sales while it stays empty",
      ctaLabel: "Open item",
      deals: toDealRefs([item]),
    })),
    ...noBarcode.map((item) => ({
      key: `barcode-${item.id}`,
      title: `Add a barcode to ${item.dealName}`,
      detail: "No barcode on this SKU · it cannot be scanned at the counter",
      ctaLabel: "Open item",
      deals: toDealRefs([item]),
    })),
  ];

  if (percentageFilled > FULL_MAX) {
    actions.push({
      key: "rebalance",
      title: "Rebalance this bin",
      detail: `${percentageFilled}% full · move slow movers to a lighter bin to make room for putaway`,
      deals: [],
    });
  } else if (percentageFilled < FULL_MIN && totalItems > 0) {
    actions.push({
      key: "consolidate",
      title: "Consolidate this bin",
      detail: `Only ${percentageFilled}% full · merge with another bin to free up shelf space`,
      deals: [],
    });
  }

  return {
    score,
    maxScore: 100,
    gradeLabel: gradeForScore(score),
    tone: toneForScore(score),
    headline: fixCount
      ? `Fix ${plural(fixCount, "issue")} to reach 100`
      : "All checks passing",
    subline: issues.length
      ? issues.join(" · ")
      : `${plural(totalItems, "item")} · ${percentageFilled}% full`,
    checks,
    actions,
    passCount,
    fixCount,
  };
};

/** Fetch + normalize the health of a bin. Returns null when unavailable. */
export const getBinHealth = async (
  binId: string,
): Promise<BinHealth | null> => {
  const response = await RackBinService.getBinHealth(
    AuthService.getLoggedInUserId() || "",
    binId,
  );
  if (response?.statusCode !== 200) return null;
  return normalizeHealth(response);
};
