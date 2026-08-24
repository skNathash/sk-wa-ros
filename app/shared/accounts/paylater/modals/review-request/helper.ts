import { subMonths } from "date-fns";
import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";
import PaylaterService from "~/services/PaylaterService";

/** The seller's decision, held by the modal and filled in on the last step. */
export type DecisionFormData = {
  approvedLimit: number | null;
  validityPeriod: string;
  note: string;
};

/** One KYC/field-verification proof carried on the request itself. */
export interface ReviewDocument {
  id: string;
  title: string;
  refNo: string;
  front: string;
  back: string;
}

/** Credit this buyer already holds with sellers other than the reviewer. */
export interface ActiveCreditsElsewhere {
  totalLimit: number;
  outstanding: number;
  sellerCount: number;
  overdueCount: number;
  /**
   * Share of the buyer's other wallets that are not overdue — how they repay
   * people who are not you. `null` when they hold no credit elsewhere.
   */
  onTimeRate: number | null;
}

/** What this buyer has done with the reviewing seller over the last 6 months. */
export interface BuyerStory {
  orders: number;
  spent: number;
  avgTicket: number;
  /** Share of orders that reached the buyer. `null` when there is no history. */
  fillRate: number | null;
  hasHistory: boolean;
}

export interface TrustScore {
  score: number;
  /** Short qualifier shown under the score, e.g. "SK-verified · Newer buyer". */
  label: string;
  tone: "success" | "warning" | "danger";
}

export const EMPTY_STORY: BuyerStory = {
  orders: 0,
  spent: 0,
  avgTicket: 0,
  fillRate: null,
  hasHistory: false,
};

export const EMPTY_CREDITS: ActiveCreditsElsewhere = {
  totalLimit: 0,
  outstanding: 0,
  sellerCount: 0,
  overdueCount: 0,
  onTimeRate: null,
};

/** Orders that actually reached the buyer — the numerator of the fill rate. */
const FULFILLED_STATUSES = ["Delivered", "Completed", "Closed"];

/** The request being reviewed, formatted the same way every PayLater screen does. */
export const getReviewRequest = async (
  requestId: string,
): Promise<Record<string, any> | null> => {
  if (!requestId) return null;
  const resp: any = await PaylaterService.getRequest(requestId);
  const data = resp?.data?.data || null;
  if (!data) return null;
  return PaylaterService.formatPaylaterRequest([data])[0] || null;
};

/**
 * Credit the same buyer holds elsewhere. Reads every wallet keyed to the buyer
 * and drops the reviewer's own — what is left is exposure this decision stacks
 * on top of. Same call the "My PayLater" page uses, pointed at the buyer.
 */
export const getActiveCreditsElsewhere = async (
  userId: string,
  currentRequestId?: string,
): Promise<ActiveCreditsElsewhere> => {
  if (!userId) return EMPTY_CREDITS;

  const myId = AuthService.getLoggedInUserId();

  try {
    const resp: any = await PaylaterService.getRequests({
      page: 1,
      count: 200,
      filter: {
        "userInfo.id": userId,
        status: { $in: ["Approved", "Paused"] },
      },
      sort: { createdAt: -1 },
    });

    const rows = Array.isArray(resp?.data?.data) ? resp.data.data : [];
    const wallets = PaylaterService.formatPaylaterRequest(rows).filter(
      (w: any) =>
        w._id !== currentRequestId && (!myId || w.franchiseInfo?.id !== myId),
    );

    const sellers = new Set(
      wallets.map((w: any) => w.franchiseInfo?.id).filter(Boolean),
    );

    const overdueCount = wallets.filter((w: any) => w.isOverdue).length;

    return {
      totalLimit: wallets.reduce(
        (sum: number, w: any) => sum + (Number(w.creditLimit) || 0),
        0,
      ),
      outstanding: wallets.reduce(
        (sum: number, w: any) => sum + (Number(w.outstandingBalance) || 0),
        0,
      ),
      sellerCount: sellers.size,
      overdueCount,
      onTimeRate: wallets.length
        ? Math.round(((wallets.length - overdueCount) / wallets.length) * 100)
        : null,
    };
  } catch (e) {
    return EMPTY_CREDITS;
  }
};

/**
 * The buyer's trading history with the reviewing seller over the last 6 months.
 * Count comes from the count endpoint so it stays exact; the money figures are
 * summed over the fetched page, which is capped — deep histories are read as a
 * floor, not an exact total.
 */
export const getBuyerStory = async (userId: string): Promise<BuyerStory> => {
  const myId = AuthService.getLoggedInUserId();
  if (!userId || !myId) return EMPTY_STORY;

  const filter = {
    "customerInfo.customerId": userId,
    createdAt: { $gte: subMonths(new Date(), 6).toISOString() },
  };

  try {
    const [countResp, listResp] = await Promise.all([
      OmsService.getSalesOrders(myId, { outputType: "count", filter }),
      OmsService.getSalesOrders(myId, { page: 1, count: 200, filter }),
    ]);

    const orders = Number(countResp?.data?.data) || 0;
    const rows: any[] = Array.isArray(listResp?.data?.data)
      ? listResp.data.data
      : [];

    if (!orders && !rows.length) return EMPTY_STORY;

    const spent = rows.reduce(
      (sum, row) => sum + (Number(row?.orderAmount) || 0),
      0,
    );
    const fulfilled = rows.filter((row) =>
      FULFILLED_STATUSES.includes(row?.status),
    ).length;

    return {
      orders,
      spent,
      avgTicket: rows.length ? Math.round(spent / rows.length) : 0,
      fillRate: rows.length
        ? Math.round((fulfilled / rows.length) * 100)
        : null,
      hasHistory: true,
    };
  } catch (e) {
    return EMPTY_STORY;
  }
};

/**
 * Proofs attached to the request. `otherDocuments` is the shape the request
 * view and the assign flow both write, so it is read the same way here.
 */
export const getRequestDocuments = (request: any): ReviewDocument[] => {
  const docs = Array.isArray(request?.otherDocuments)
    ? request.otherDocuments
    : [];

  return docs
    .filter((doc: any) => doc && (doc.frontImage || doc.backImage))
    .map((doc: any, idx: number) => ({
      id: doc.id || `doc-${idx}`,
      title: doc.type || doc.documentType || "Document",
      refNo: doc.id || doc.referenceNo || "",
      front: doc.frontImage || "",
      back: doc.backImage || "",
    }));
};

/** One read-only KYC line on step 2. */
export interface KycField {
  label: string;
  value: string;
  /** Address spans the row; everything else pairs up two to a line. */
  full?: boolean;
}

/**
 * The onboarding record behind the request, laid out the way step 2 reads it.
 * Everything is shown even when empty — a blank GSTIN is itself a signal the
 * seller should weigh, so the row stays and reads "—".
 */
export const getKycFields = (request: any): KycField[] => {
  const user = request?.userInfo || {};
  const bank = user.bankInfo || user.bankDetails || {};

  const accountNo = String(bank.accountNumber || bank.accountNo || "");
  const bankAccount = [
    bank.bankName || bank.bank_name || "",
    accountNo ? `····${accountNo.slice(-4)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return [
    {
      label: "SHOP NAME",
      value: user.shopName || user.businessName || user.name || "",
    },
    {
      label: "OWNER",
      value: user.ownerName || user.contactPerson || user.name || "",
    },
    { label: "GSTIN", value: user.gstNumber || user.gstNo || "" },
    { label: "PAN", value: user.panNumber || user.panNo || "" },
    { label: "PHONE", value: user.mobile || "" },
    { label: "EMAIL", value: user.email || "" },
    {
      label: "REGISTERED ADDRESS",
      value: user._formattedAddress || "",
      full: true,
    },
    { label: "BANK ACCOUNT", value: bankAccount },
    { label: "IFSC", value: bank.ifsc || bank.ifscCode || "" },
  ].map((field) => ({ ...field, value: field.value || "—" }));
};

/**
 * The label over the buyer rail — who this request is from and where their
 * KYC stands, both read off the request rather than assumed.
 */
export const getBuyerPanelHeading = (request: any): string => {
  const segment = request?.userCategory
    ? `${request.userCategory} BUYER`
    : "BUYER";
  const kyc = request?.kycStatus
    ? `KYC ${String(request.kycStatus).toUpperCase()}`
    : "";
  return [segment, kyc].filter(Boolean).join(" · ");
};

/** How far the buyer sits from the seller, when the network carried the figure. */
export const getDistanceKm = (request: any): number | null => {
  const value =
    request?.userInfo?.distanceKm ??
    request?.userInfo?.details?.distanceKm ??
    request?.distanceKm;
  const km = Number(value);
  return Number.isFinite(km) && km > 0 ? km : null;
};

/**
 * A readable confidence number built only from signals the request and the
 * order book actually carry — KYC state, trading history, fill rate and how
 * much credit the buyer already carries elsewhere. It is a summary of the
 * facts on this screen, not a bureau score.
 */
export const computeTrustScore = (
  request: any,
  story: BuyerStory,
  credits: ActiveCreditsElsewhere,
): TrustScore => {
  let score = 40;
  const notes: string[] = [];

  if (request?.kycStatus === "Approved") {
    score += 20;
    notes.push("SK-verified");
  } else if (request?.kycStatus === "Pending") {
    score += 5;
    notes.push("KYC pending");
  } else if (request?.kycStatus) {
    notes.push(`KYC ${String(request.kycStatus).toLowerCase()}`);
  }

  if (getRequestDocuments(request).length >= 2) {
    score += 5;
  }

  if (story.orders >= 25) {
    score += 20;
    notes.push("Regular buyer");
  } else if (story.orders >= 10) {
    score += 14;
    notes.push("Repeat buyer");
  } else if (story.orders > 0) {
    score += 8;
    notes.push("Newer buyer");
  } else {
    notes.push("No history with you");
  }

  if (story.fillRate !== null) {
    if (story.fillRate >= 90) score += 10;
    else if (story.fillRate >= 70) score += 5;
    else score -= 5;
  }

  if (credits.overdueCount > 0) {
    score -= 15;
    notes.push(`${credits.overdueCount} overdue elsewhere`);
  } else if (credits.sellerCount >= 4) {
    score -= 5;
  }

  score = Math.max(5, Math.min(100, Math.round(score)));

  return {
    score,
    label: notes.slice(0, 2).join(" · "),
    tone: score >= 70 ? "success" : score >= 45 ? "warning" : "danger",
  };
};

/** Quick-pick limits around what the buyer asked for. */
export const getLimitPresets = (askedLimit: number) => {
  const asked = Number(askedLimit) || 0;
  if (!asked) return [];
  return [
    { label: "50% of ask", value: Math.round(asked * 0.5) },
    { label: `Full ask ₹${asked.toLocaleString("en-IN")}`, value: asked },
    { label: "150% of ask", value: Math.round(asked * 1.5) },
  ];
};

/** "30 Days" -> "30d", "1 Year" -> "1y" — for the tight header line. */
export const formatTenure = (validityPeriod?: string) => {
  const value = (validityPeriod || "").trim();
  if (!value) return "";
  const match = value.match(/^(\d+)\s*(day|days|year|years|month|months)$/i);
  if (!match) return value;
  const unit = match[2].toLowerCase().startsWith("day")
    ? "d"
    : match[2].toLowerCase().startsWith("month")
      ? "mo"
      : "y";
  return `${match[1]}${unit}`;
};
