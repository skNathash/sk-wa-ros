import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import SellerService from "~/services/SellerService";

/** The four onboarding routes the page offers, in screen order. */
export type OnboardMode = "zero-form" | "voice" | "qr" | "paylater";

/** `?mode=` values the directory pane links in, mapped to a tab key. */
export const MODE_BY_PARAM: Record<string, OnboardMode> = {
  "type-mobile": "zero-form",
  "zero-form": "zero-form",
  voice: "voice",
  "counter-qr": "qr",
  qr: "qr",
  paylater: "paylater",
};

export const defaultFormData = {
  name: "",
  mobile: "",
  gender: "",
  email: "",
  address: "",
  pincode: "",
  state: "",
  district: "",
  town: "",
  verifyWithOtp: false,
};

export const preparePayload = (data: any) => {
  const user = AuthService.getLoggedInUser();

  const payload: Record<string, any> = {
    mobile: data.mobile.trim(),
    email: data.email?.trim() || "",
    address: {
      city: data.city || data.town || user?.city || user?.town || "",
      state: data.state || user?.state || "",
      postcode: data.pincode || user?.pincode || "",
      district: data.district || user?.district || "",
      landmark: "",
    },
  };

  // Remove empty address fields
  if (!payload.address.state) {
    delete payload.address.state;
  }
  if (!payload.address.postcode) {
    delete payload.address.postcode;
  }
  if (!payload.address.district) {
    delete payload.address.district;
  }
  if (!payload.address.city) {
    delete payload.address.city;
  }

  // Zero-form onboarding sends only a mobile number; the name fills in later
  // from the first bill or WhatsApp, so it stays out of the payload until then.
  const name = data.name?.trim();
  if (name) {
    payload.name = name;
  }

  if (data.gender) {
    payload.gender = data.gender;
  }

  // Paylater-first onboarding creates the customer around a credit limit, so
  // the unlock details ride along with the create call.
  if (data.paylater) {
    payload.paylater = data.paylater;
  }

  return payload;
};

export const validateForm = (data: any, t: any) => {
  let msg = "";

  // Mobile validation — the only mandatory field, everything else accretes
  // from the customer's bills.
  if (!data.mobile?.trim()) {
    msg = t("pleaseProvideMobile");
  } else if (!CommonService.isValidMobileNo(data.mobile)) {
    msg = t("pleaseProvideValidMobile");
  }
  // Pincode validation
  else if (
    data.pincode?.trim() &&
    !CommonService.isValidPincode(data.pincode)
  ) {
    msg = t("pleaseProvideValidPincode");
  }

  return {
    status: !msg,
    msg: msg,
  };
};

/* ------------------------------------------------------------------ *
 * Paylater-first
 * ------------------------------------------------------------------ */

export interface PaylaterFormData {
  name: string;
  mobile: string;
  limit: number;
  validity: string;
}

/**
 * Same `{ status, msg }` contract as validateForm — the tab toasts the first
 * miss, so the checks run in the order the fields sit on screen. Unlike the
 * other routes every field is mandatory here: the credit block rides along
 * with the create call, so nothing can accrete later.
 */
export const validatePaylaterForm = (data: PaylaterFormData, t: any) => {
  let msg = "";

  if (!data.limit) {
    msg = t("pleaseProvideCreditLimit");
  } else if (!data.validity?.trim()) {
    msg = t("pleaseProvideValidityPeriod");
  } else if (!data.name?.trim()) {
    msg = t("pleaseProvideCustomerName");
  } else if (!data.mobile?.trim()) {
    msg = t("pleaseProvideMobile");
  } else if (!CommonService.isValidMobileNo(data.mobile)) {
    msg = t("pleaseProvideValidMobile");
  }

  return {
    status: !msg,
    msg: msg,
  };
};

/* ------------------------------------------------------------------ *
 * Voice add
 * ------------------------------------------------------------------ */

/** Digits dictated as words, in the languages the mic offers. */
const DIGIT_WORDS: Record<string, string> = {
  zero: "0",
  oh: "0",
  one: "1",
  two: "2",
  to: "2",
  three: "3",
  four: "4",
  for: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  double: "",
};

/** Command words that introduce the utterance and are never part of a name. */
const FILLER_WORDS = new Set([
  "add",
  "create",
  "new",
  "customer",
  "number",
  "mobile",
  "phone",
  "is",
  "and",
  "plus",
]);

export interface ParsedVoiceCustomer {
  name: string;
  mobile: string;
  /** The transcript we parsed, kept for display. */
  transcript: string;
}

/**
 * Pull a name and a mobile number out of a dictated line such as
 * "Add Anita nine eight four five six one two zero three four". Digits may
 * arrive as words or as a plain number, so both are folded into one string
 * and the trailing 10 digits become the mobile.
 */
export const parseVoiceCustomer = (transcript: string): ParsedVoiceCustomer => {
  const tokens = (transcript || "")
    .replace(/[^\p{L}\p{N}\s+]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  let digits = "";
  const nameParts: string[] = [];

  tokens.forEach((token) => {
    const lower = token.toLowerCase();

    if (/^\d+$/.test(token)) {
      digits += token;
      return;
    }

    if (lower in DIGIT_WORDS) {
      digits += DIGIT_WORDS[lower];
      return;
    }

    if (FILLER_WORDS.has(lower)) return;

    nameParts.push(token);
  });

  // Indian mobiles are 10 digits; drop a dictated 91/+91 country prefix.
  if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(digits.length - 10);
  }

  const name = nameParts
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

  return {
    name,
    mobile: digits.slice(0, 10),
    transcript: (transcript || "").trim(),
  };
};

/* ------------------------------------------------------------------ *
 * Matches from recent bills
 * ------------------------------------------------------------------ */

export interface RecentBill {
  id: string;
  /** Bill / order number shown on the row. */
  billNo: string;
  amount: number;
  itemCount: number;
  date: string | null;
}

/**
 * The bills already raised against a mobile number. Shown while the retailer
 * types so they can see the history that will be attributed to the customer
 * they are about to create.
 */
export const getRecentBills = async (
  mobile: string,
  limit = 3,
): Promise<RecentBill[]> => {
  if (!CommonService.isValidMobileNo(mobile)) return [];

  const response = await SellerService.getSellerOrders(
    AuthService.getLoggedInUserId() || "",
    {
      page: 1,
      count: limit,
      filter: { "customerInfo.mobile": mobile },
      sort: { orderedDate: -1 },
    },
  );

  return ((response?.data?.data || []) as any[]).map((order) => ({
    id: order?._id || order?.orderId,
    billNo: order?.orderRefNo || order?.orderId || "",
    amount: Number(order?.payableAmount || order?.orderAmount || 0),
    itemCount: Array.isArray(order?.items) ? order.items.length : 0,
    date: order?.orderedDate || order?.createdAt || null,
  }));
};
