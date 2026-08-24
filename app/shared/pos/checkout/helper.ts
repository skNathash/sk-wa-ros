import CommonService from "~/services/CommonService";
import PosService from "~/services/PosService";
import type { PaymentModeKey } from "./components/payment-modes/helper";

/** The checkout flow type, as it arrives on the modal props. */
export type CheckoutType = "b2c" | "b2b";

/** Price block the cart API returns under `priceBreakdown`. */
export type CartSummary = {
  subtotal: number;
  couponDiscount: number;
  coinsDiscount: number;
  totalDiscount: number;
  finalPrice: number;
  orderAmount: number;
};

export const EMPTY_SUMMARY: CartSummary = {
  subtotal: 0,
  couponDiscount: 0,
  coinsDiscount: 0,
  totalDiscount: 0,
  finalPrice: 0,
  orderAmount: 0,
};

/** Everything the checkout needs out of one cart read. */
export type CartDetails = {
  items: any[];
  summary: CartSummary;
  discount: number;
  customerInfo: Record<string, any>;
  raw: Record<string, any>;
};

export const EMPTY_CART: CartDetails = {
  items: [],
  summary: EMPTY_SUMMARY,
  discount: 0,
  customerInfo: {},
  raw: {},
};

/**
 * Reads one cart by id. Mirrors the b2c-checkout page: the id alone identifies
 * the cart, and assisted carts only surface with the `assistedOrder` flag on.
 */
export const fetchCartDetails = async (
  cartId: string,
  assisted = false,
): Promise<CartDetails> => {
  if (!cartId) return EMPTY_CART;

  const filter: Record<string, any> = { _id: cartId };
  if (assisted) filter.assistedOrder = true;

  const response = await PosService.getCart({ filter });
  const data = response.data?.data?.[0] || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    summary: { ...EMPTY_SUMMARY, ...(data.priceBreakdown || {}) },
    discount: data.discountInfo?.totalAmount || 0,
    customerInfo: data.customerInfo || {},
    raw: data,
  };
};

/**
 * Cash a counter is likely to be handed for `cartValue`: the exact amount
 * first, then the round-ups a customer actually reaches for (next ten, fifty,
 * hundred…) and the notes that clear the bill on their own.
 */
export const buildCashSuggestions = (cartValue: number): number[] => {
  const value = Math.ceil(Number(cartValue) || 0);
  if (value <= 0) return [];

  const suggestions = new Set<number>([value]);

  [10, 50, 100, 500].forEach((step) => {
    const roundedUp = Math.ceil(value / step) * step;
    if (roundedUp > value) suggestions.add(roundedUp);
  });

  [100, 200, 500, 1000, 2000].forEach((note) => {
    if (note > value) suggestions.add(note);
  });

  return [...suggestions].sort((a, b) => a - b).slice(0, 6);
};

/** Rounds the way every money figure in this flow is rounded. */
export const toAmount = (value: number) =>
  CommonService.roundedByDecimalPlace(Number(value) || 0, 2);

/**
 * What the customer actually settles: the cart total less the cart discount and
 * whatever coins were redeemed, never below zero.
 */
export const getPayableAmount = (
  summary: CartSummary,
  discount = 0,
  redemption = 0,
) =>
  toAmount(
    Math.max(
      (summary?.finalPrice ?? summary?.orderAmount ?? 0) -
        (discount || 0) -
        (redemption || 0),
      0,
    ),
  );

/** One settled rail, as the order API wants it. */
type PaymentModePayload = {
  type: string;
  amount: number;
  paidAmount: number;
  paidVia: string;
  refNo: string;
  proof: string[];
  change: number;
};

export type CheckoutFormData = {
  option?: string;
  customer?: any;
  paymentMode?: PaymentModeKey | "split";
  /** Cash handed over. Can exceed the cash share — the surplus is change. */
  tendered?: number;
  /** Per-rail amounts when the bill is split. */
  splitAmounts?: Partial<Record<PaymentModeKey, number>>;
  /** UPI config the customer scanned (`paymentMethod` from the payment config). */
  upiPayment?: string;
  /** UTR / reference the customer read back. */
  reference?: string;
  loyaltyPoints?: number | string;
  redemptionValue?: number;
  [key: string]: any;
};

export type PreparePayloadContext = {
  cartId: string;
  type?: CheckoutType | string;
  assisted?: boolean;
  /** Final payable, after discount and coin redemption. */
  payableAmount: number;
  /** Returned by the coin-blocking call made just before submit. */
  redeemRefId?: string;
};

const PAYMENT_TYPE_BY_MODE: Record<string, string> = {
  cash: "COD",
  upi: "PREPAID",
  paylater: "PAYLATER",
  split: "COD",
};

/**
 * Turns the checkout form state into the `createPosOrder` payload.
 *
 * The rails are always sent as a list — a single-rail bill is just a list of
 * one — so cash, UPI and split share one shape. Paylater is the exception the
 * API asks for: it travels as a COD order carrying `paymentMethod: PAYLATER`.
 */
export const preparePayload = (
  values: CheckoutFormData,
  context: PreparePayloadContext,
) => {
  const { cartId, payableAmount, redeemRefId } = context;
  const isB2C = (context.type || "b2c").toLowerCase() !== "b2b";

  const mode = values.paymentMode || "cash";
  const customer = values.customer;
  const isWalkin = values.option === "walkin";
  const splitAmounts = values.splitAmounts || {};

  // Per-rail shares. Cash carries the tendered surplus as change, so the rail
  // is credited with its share and the change is reported alongside it.
  const shares: Array<{ rail: PaymentModeKey; share: number }> =
    mode === "split"
      ? (["cash", "upi"] as PaymentModeKey[])
          .map((rail) => ({ rail, share: toAmount(splitAmounts[rail] || 0) }))
          .filter((entry) => entry.share > 0)
      : mode === "paylater"
        ? []
        : [{ rail: mode as PaymentModeKey, share: toAmount(payableAmount) }];

  const paymentMode: PaymentModePayload[] =
    mode === "paylater"
      ? [
          {
            type: "paylater",
            amount: toAmount(payableAmount),
            paidAmount: toAmount(payableAmount),
            paidVia: "paylater",
            refNo: "",
            proof: [],
            change: 0,
          },
        ]
      : shares.map(({ rail, share }) => {
          const isCash = rail === "cash";
          const paidAmount = isCash
            ? toAmount(Math.max(values.tendered || 0, share))
            : share;
          const change = isCash ? toAmount(paidAmount - share) : 0;

          return {
            type: rail,
            amount: share,
            paidAmount,
            paidVia: rail === "upi" ? values.upiPayment || "upi" : rail,
            refNo: rail === "upi" ? values.reference || "" : "",
            proof: [],
            change,
          };
        });

  const changeToReturn = paymentMode.reduce(
    (sum, entry) => sum + (entry.change || 0),
    0,
  );

  const customerInfo: Record<string, any> = isWalkin
    ? {
        customerType: "Customer",
        customerId: "guest_customer",
        isGuestCustomer: true,
      }
    : {
        customerType: isB2C ? "Customer" : "Retailer",
        name: customer?.name || "",
        customerId: customer?._id,
        mobile: customer?.mobile || "",
        isGuestCustomer: false,
      };

  // The one-line address the order API takes for a counter sale. A walk-in has
  // no customer on file and a B2B cart already carries the buyer's address, so
  // both leave the order to the address the server resolves.
  const mobileNo = customer?.mobile || "";
  const address = {
    mobileNo: mobileNo ? Number(mobileNo) : 0,
    address: customer?.address?.city
      ? `${customer.address.city}, ${customer.address.state}`
      : "",
  };

  const payload: Record<string, any> = {
    cartId,
    paymentType: PAYMENT_TYPE_BY_MODE[mode] || "COD",
    paymentMode,
    roundOffOrderAmount: !!values.roundOffOrderAmount,
  };

  // Quick-checkout style B2B carts resolve the buyer from the cart itself.
  if (isB2C) payload.customerInfo = customerInfo;

  if (isB2C && !isWalkin) {
    payload.billingAddress = address;
    payload.shippingAddress = address;
  }

  if (mode === "paylater") {
    payload.paymentType = "COD";
    payload.paymentMethod = "PAYLATER";
  }

  if (redeemRefId) payload.redeemRefId = redeemRefId;

  return { payload, changeToReturn, customerInfo, isWalkin };
};
