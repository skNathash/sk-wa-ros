import { format } from "date-fns";
import AuthService from "~/services/AuthService";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import FranchiseService from "~/services/FranchiseService";
import PaylaterService from "~/services/PaylaterService";

/**
 * The rails a B2B bill is settled on at the counter. The retailer either pays
 * the seller now (UPI / QR, sent as a PREPAID order) or draws on the credit
 * line the seller sanctioned them (PAYLATER).
 */
export type B2bPaymentMode = "upi" | "paylater";

/** How each rail travels to the order API. */
export const B2B_PAYMENT_METHOD: Record<B2bPaymentMode, string> = {
  upi: "PREPAID",
  paylater: "PAYLATER",
};

/** Everything the B2B flow has to know before it can show its first step. */
export type B2bContext = {
  retailer: Record<string, any> | null;
  /** Rails the seller's payment policy allows for this retailer. */
  modes: B2bPaymentMode[];
  paylater: { eligible: boolean; balance: number };
  /** The store has at least one active delivery route, so the flow gets a step. */
  hasDeliveryStep: boolean;
  /** The retailer confirms the order by OTP before it is raised. */
  otpRequired: boolean;
};

export const EMPTY_B2B_CONTEXT: B2bContext = {
  retailer: null,
  modes: [],
  paylater: { eligible: false, balance: 0 },
  hasDeliveryStep: false,
  otpRequired: false,
};

/**
 * One read of everything the B2B flow branches on — the retailer, which rails
 * the seller's policy allows them, whether a delivery route can be picked and
 * whether the order needs the retailer's OTP.
 *
 * All four are independent, so they go out together: the flow can't decide its
 * steps until the slowest of them lands anyway.
 *
 * An assisted order is always confirmed by the retailer, so it never consults
 * the store's OTP setting.
 */
export const fetchB2bContext = async (
  retailerId: string,
  assisted = false,
): Promise<B2bContext> => {
  if (!retailerId) return EMPTY_B2B_CONTEXT;

  const franchiseId = AuthService.getLoggedInUserId();

  const [retailerRes, paylaterRes, policyRes, otpRes, routesRes] =
    await Promise.allSettled([
      FranchiseService.getFranchise(retailerId),
      PaylaterService.validateEligibility({
        userInfo: { id: retailerId, type: "franchise" },
        franchiseInfo: { id: franchiseId },
      }),
      FranchiseService.getSpecificUserConfig(retailerId, franchiseId, "B2B"),
      assisted
        ? Promise.resolve(null)
        : FranchiseService.getFranchiseSettings({
            configType: "B2B_ORDER_CONFIG",
          }),
      DeliveryRoutesService.getRoutesList({
        page: 1,
        limit: 1,
        filter: { isActive: true },
      }),
    ]);

  const value = (result: PromiseSettledResult<any>) =>
    result.status === "fulfilled" ? result.value : null;

  const franchise = value(retailerRes)?.data?.data;
  const retailer = franchise?._id
    ? {
        ...franchise,
        formatAddress: [
          franchise.city || franchise.town,
          franchise.district,
          franchise.state,
          franchise.postcode,
        ]
          .filter(Boolean)
          .join(", "),
      }
    : { _id: retailerId, name: "" };

  const paylaterData = value(paylaterRes)?.data?.data ?? {};
  const paylater = {
    eligible: !!paylaterData.eligible,
    balance: Number(paylaterData.paylaterInfo?.creditAvailable ?? 0) || 0,
  };

  // `prepaid` is what lets the retailer pay the seller now — the UPI rail.
  const allowed = value(policyRes)?.data?.data?.allowedPayments ?? {
    cod: true,
    prepaid: false,
  };

  const modes: B2bPaymentMode[] = [];
  if (allowed.prepaid) modes.push("upi");
  if (paylater.eligible) modes.push("paylater");

  const otpRequired = assisted
    ? true
    : value(otpRes)?.data?.data?.configValue?.enableOtpForPOS === true;

  const routes = value(routesRes);
  const hasDeliveryStep =
    routes?.statusCode === 200 && (routes.data?.data || []).length > 0;

  return { retailer, modes, paylater, hasDeliveryStep, otpRequired };
};

/** The UPI details a PREPAID B2B order carries. */
export type B2bUpiPayment = {
  /** `paymentMethod` on the seller's config — what the order calls `paidVia`. */
  method: string;
  /** `refCode` on the same config. */
  refCode: string;
  /** UTR the retailer reads back. */
  reference: string;
};

export type B2bOrderParamsContext = {
  mode: B2bPaymentMode;
  amount: number;
  upi?: B2bUpiPayment;
  route?: Record<string, any> | null;
};

/**
 * The params a B2B order is raised with. They ride on the OTP verify call —
 * that endpoint is what actually creates the order, whether or not a code was
 * collected first.
 */
export const buildB2bOrderParams = ({
  mode,
  amount,
  upi,
  route,
}: B2bOrderParamsContext) => {
  const params: Record<string, any> = {
    paymentMethod: B2B_PAYMENT_METHOD[mode],
  };

  if (mode === "upi") {
    params.paymentMode = [
      {
        type: "UPI",
        paidVia: upi?.method || "",
        refNo: upi?.refCode || "",
        paymentTransactionId: upi?.reference || "",
        proof: [],
        amount: Number(amount) || 0,
        paidAmount: Number(amount) || 0,
        change: 0,
      },
    ];
  }

  if (route?.deliveryDate || route?._id) {
    params.routeInfo = {
      ...(route.deliveryDate
        ? { deliveryDate: format(route.deliveryDate, "yyyy-MM-dd") }
        : {}),
      routeId: route._id,
    };
  }

  return params;
};
