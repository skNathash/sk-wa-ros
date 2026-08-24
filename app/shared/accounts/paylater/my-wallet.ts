import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";
import type { VariantColor } from "~/types/CommonTypes";

/**
 * The paylater wallet a seller has issued to the logged-in user, normalised off
 * the paylater request document (`GET accounts/paylater/requests`, filtered to
 * me + that seller).
 *
 * Only fields the endpoint actually carries live here — the wallet feed has no
 * tier, credit-score or per-order repayment schedule, so consumers render what
 * the wallet knows: the limit, what is drawn against it and when it falls due.
 */
export interface PaylaterWallet {
  id: string;
  status: string;
  statusLabel: string;
  statusColor: VariantColor;
  kycStatus: string;
  kycStatusColor: VariantColor;
  sellerId: string;
  sellerName: string;
  creditLimit: number;
  creditAvailable: number;
  /** Still owed back to the seller — drawn minus repaid. */
  creditUsed: number;
  /** Lifetime drawn against the wallet, repayments included. */
  totalDrawn: number;
  /** Lifetime repaid against the wallet. */
  totalRepaid: number;
  /** Share of the limit still owed, 0–100. */
  utilisedPercentage: number;
  validityStartDate: string;
  validityEndDate: string;
  /** "30 Days", "1 Year", … as chosen when the wallet was approved. */
  validityPeriod: string;
  /** "Active" / "Expired", as reported by the API. */
  validityStatus: string;
  /** "Over due" / "Due today" / "Expires in N days", prepared by the service. */
  expiryStatus: string;
  isOverdue: boolean;
  isDueToday: boolean;
  /** The wallet ran past its validity window — no fresh credit can be drawn. */
  isExpired: boolean;
  /** Approved and inside its validity window: spendable right now. */
  isSpendable: boolean;
  requestedOn: string;
  raw: Record<string, any>;
}

const toNumber = (value: any) => (Number.isFinite(Number(value)) ? Number(value) : 0);

/** Paylater request document -> the shape the UI renders. */
export const toPaylaterWallet = (raw: Record<string, any>): PaylaterWallet => {
  const creditLimit = toNumber(raw.creditLimit);
  const creditAvailable = toNumber(raw.creditAvailable);
  // `totalPayableAmount` is what the wallet still owes; fall back to the
  // limit-minus-available figure the service derives only when it is absent.
  // A payable of 0 is a real value (nothing owed) and must not fall through.
  const creditUsed =
    raw.totalPayableAmount != null
      ? toNumber(raw.totalPayableAmount)
      : toNumber(raw.outstandingBalance);

  const isExpired =
    raw.validityStatus === "Expired" || !!raw.isOverdue;
  const isSpendable = raw.status === "Approved" && !isExpired;

  return {
    id: raw._id || "",
    status: raw.status || "",
    statusLabel: raw._statusLbl || raw.status || "",
    statusColor: (raw._statusColor as VariantColor) || "default",
    kycStatus: raw.kycStatus || "",
    kycStatusColor: (raw.kycStatusColor as VariantColor) || "default",
    sellerId: raw.franchiseInfo?.id || "",
    sellerName: raw.franchiseInfo?.name || "",
    creditLimit,
    creditAvailable,
    creditUsed,
    totalDrawn: toNumber(raw.totalAmountUsed),
    totalRepaid: toNumber(raw.totalAmountPaid),
    utilisedPercentage: creditLimit
      ? Math.min(100, Math.max(0, Math.round((creditUsed / creditLimit) * 100)))
      : 0,
    validityStartDate: raw.validityStartDate || "",
    validityEndDate: raw.validityEndDate || "",
    validityPeriod: raw.validityPeriod || "",
    validityStatus: raw.validityStatus || "",
    expiryStatus: raw.validityStatus === "Expired" ? "Expired" : raw.expiryStatus || "",
    isOverdue: !!raw.isOverdue,
    isDueToday: !!raw.isDueToday,
    isExpired,
    isSpendable,
    requestedOn: raw.createdAt || "",
    raw,
  };
};

/**
 * Latest paylater request the logged-in user has with this seller, raw off the
 * service (already run through `formatPaylaterRequest`).
 */
export const getMyPaylaterRequest = async (sellerId: string) => {
  const userId = AuthService.getLoggedInUserId();
  if (!userId || !sellerId) return null;

  const params: Record<string, any> = {
    page: 1,
    count: 1,
    filter: {
      "userInfo.id": userId,
      "franchiseInfo.id": sellerId,
    },
    sort: { createdAt: -1 },
  };

  const resp: any = await PaylaterService.getRequests(params);
  const list = Array.isArray(resp?.data?.data) ? resp.data.data : [];
  if (!list.length) return null;

  return PaylaterService.formatPaylaterRequest(list)[0];
};

/**
 * Latest paylater wallet between the logged-in user and this seller.
 * Returns null when the seller has not issued one.
 */
export const getPaylaterWallet = async (
  sellerId: string,
): Promise<PaylaterWallet | null> => {
  const request = await getMyPaylaterRequest(sellerId);
  return request ? toPaylaterWallet(request) : null;
};

/** Tone for the utilisation ring/bar — warns before the limit runs out. */
export const utilisationTone = (
  percentage: number,
): "success" | "warning" | "danger" => {
  if (percentage >= 80) return "danger";
  if (percentage >= 50) return "warning";
  return "success";
};
