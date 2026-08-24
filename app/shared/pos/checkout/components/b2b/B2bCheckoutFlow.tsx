import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import { Button } from "~/components/ui/button";
import useAppToast from "~/hooks/useAppToast";
import CartService from "~/services/CartService";
import PosService from "~/services/PosService";
import OtpVerifySection, {
  type OtpSectionHandle,
} from "../otp/OtpVerifySection";
import type { UpiConfig } from "../upi/helper";
import B2bDeliverySection from "./B2bDeliverySection";
import B2bPaymentSection from "./B2bPaymentSection";
import {
  buildB2bOrderParams,
  EMPTY_B2B_CONTEXT,
  fetchB2bContext,
  type B2bContext,
  type B2bPaymentMode,
} from "./helper";

type Step = "payment" | "delivery" | "otp";

const STEP_TITLE: Record<Step, string> = {
  payment: "Payment",
  delivery: "Delivery",
  otp: "Verification",
};

type Props = {
  /** Opens the flow — every open re-reads the retailer's policy. */
  show: boolean;
  cartId: string;
  /** The retailer buying. Falls back to the buyer riding on the cart. */
  retailerId: string;
  /** Assisted order: the retailer always confirms it by OTP. */
  assisted?: boolean;
  /** What the order is raised for, after cart discounts. */
  payableAmount: number;
  totalItems?: number;
  callback: (payload: { action: string; data?: any }) => void;
};

/**
 * The B2B side of the checkout flow — the whole body and footer of the modal,
 * so the B2C flow above it stays exactly as it reads.
 *
 * A B2B cart already carries its buyer, so there is no customer step: the flow
 * opens on payment, picks up the delivery route when the store runs any, and
 * ends on the retailer's OTP when the store asks for one. The order itself is
 * always raised by the verify call — with a code when one was collected,
 * without one when it wasn't.
 */
const B2bCheckoutFlow = ({
  show,
  cartId,
  retailerId,
  assisted = false,
  payableAmount,
  totalItems = 0,
  callback,
}: Props) => {
  const appToast = useAppToast();
  const otpRef = useRef<OtpSectionHandle>(null);

  const [context, setContext] = useState<B2bContext>(EMPTY_B2B_CONTEXT);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState<Step>("payment");
  const [mode, setMode] = useState<B2bPaymentMode | null>(null);
  const [upiConfigs, setUpiConfigs] = useState<UpiConfig[]>([]);
  const [upiMethod, setUpiMethod] = useState("");
  const [upiReference, setUpiReference] = useState("");
  const [route, setRoute] = useState<any>(null);
  const [paylaterBalance, setPaylaterBalance] = useState(0);
  const [paylaterEligible, setPaylaterEligible] = useState(false);

  // Every open re-reads the policy: the retailer's limit, the rails they are
  // allowed and the routes the store runs can all have moved since last time.
  useEffect(() => {
    if (!show) return;

    setStep("payment");
    setMode(null);
    setUpiMethod("");
    setUpiReference("");
    setRoute(null);

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const next = await fetchB2bContext(retailerId, assisted);
        if (cancelled) return;
        setContext(next);
        setMode(next.modes[0] ?? null);
        setPaylaterEligible(next.paylater.eligible);
        setPaylaterBalance(next.paylater.balance);
      } catch (e) {
        console.error("Error loading B2B checkout context", e);
        if (!cancelled) setContext(EMPTY_B2B_CONTEXT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [show, retailerId, assisted]);

  const steps: Step[] = useMemo(() => {
    const list: Step[] = ["payment"];
    if (context.hasDeliveryStep) list.push("delivery");
    if (context.otpRequired) list.push("otp");
    return list;
  }, [context.hasDeliveryStep, context.otpRequired]);

  const stepIndex = Math.max(steps.indexOf(step), 0);

  const handlePayment = (payload: { action: string; data?: any }) => {
    if (payload.action === "select") {
      setMode(payload.data.mode);
      return;
    }

    if (payload.action === "eligibility") {
      setPaylaterEligible(!!payload.data?.eligible);
      setPaylaterBalance(Number(payload.data?.balance) || 0);
      return;
    }

    if (payload.action !== "upi") return;

    // The UPI block reports its own configs; the order needs the `refCode` off
    // the one that was actually collected into, not just its name.
    const inner = payload.data || {};
    if (inner.action === "configs") {
      setUpiConfigs(inner.data?.configs || []);
      return;
    }
    if (inner.action !== "change") return;
    if (inner.data?.method !== undefined) setUpiMethod(inner.data.method);
    if (inner.data?.reference !== undefined)
      setUpiReference(inner.data.reference);
  };

  const orderParams = useCallback(() => {
    const config = upiConfigs.find((entry) => entry.value === upiMethod);
    return buildB2bOrderParams({
      mode: mode as B2bPaymentMode,
      amount: payableAmount,
      upi: {
        method: upiMethod,
        refCode: config?.refCode || "",
        reference: upiReference,
      },
      route,
    });
  }, [mode, payableAmount, route, upiConfigs, upiMethod, upiReference]);

  const finish = (data: any) => {
    PosService.triggerOrderPlacedEvent({ cartId, order: data });
    callback({ action: "success", data: { order: data } });
  };

  /** No OTP configured — the verify call raises the order on its own. */
  const placeOrder = async () => {
    setSubmitting(true);
    try {
      const resp = await CartService.verifyOtp(cartId, orderParams());
      if (resp?.statusCode !== 200) {
        appToast.show({
          msg: resp?.data?.message || "Failed to place order",
          color: "error",
        });
        return;
      }
      appToast.show({ msg: "Order placed successfully", color: "success" });
      finish(resp.data);
    } catch (e) {
      console.error("Error placing B2B order", e);
      appToast.show({ msg: "Failed to place order", color: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const sendOtp = async () => {
    setSubmitting(true);
    try {
      const resp = await CartService.generateOtp(cartId, {});
      if (resp?.statusCode !== 200) {
        appToast.show({
          msg: resp?.data?.message || "Failed to generate OTP",
          color: "error",
        });
        return;
      }
      appToast.show({ msg: "OTP sent successfully", color: "success" });
      setStep("otp");
    } catch (e) {
      console.error("Error generating OTP for B2B order", e);
      appToast.show({ msg: "Failed to generate OTP", color: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvance = async () => {
    if (!cartId) {
      appToast.show({ msg: "Cart ID is required", color: "error" });
      return;
    }

    if (step === "payment" && context.hasDeliveryStep) {
      setStep("delivery");
      return;
    }

    if (step === "otp") {
      setSubmitting(true);
      await otpRef.current?.verify();
      setSubmitting(false);
      return;
    }

    if (context.otpRequired) await sendOtp();
    else await placeOrder();
  };

  const handleBack = () => {
    if (step === "delivery") setStep("payment");
    else if (step === "otp")
      setStep(context.hasDeliveryStep ? "delivery" : "payment");
    else callback({ action: "close" });
  };

  const isPaymentValid =
    payableAmount > 0 &&
    (mode === "upi"
      ? !!upiMethod && upiReference.trim().length > 0
      : mode === "paylater"
        ? paylaterEligible && paylaterBalance >= payableAmount
        : false);

  // The route is optional — the retailer can be delivered without one picked
  // here, so the delivery step never blocks the flow.
  const canAdvance =
    !submitting && !loading && (step !== "payment" || isPaymentValid);

  const advanceLabel =
    step === "otp"
      ? "Verify & create order"
      : step === "payment" && context.hasDeliveryStep
        ? "Next"
        : context.otpRequired
          ? "Send OTP"
          : "Create order";

  return (
    <>
      <AppModal.Content className="tw:min-h-0">
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-8 tw:text-xs tw:text-slate-500">
            <Loader2 className="tw:size-4 tw:animate-spin" />
            Loading retailer…
          </div>
        ) : (
          <div className="tw:space-y-2.5 tw:pt-1">
            {steps.length > 1 && (
              <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
                {`Step ${stepIndex + 1} of ${steps.length} · ${STEP_TITLE[step]}`}
              </div>
            )}

            {step === "payment" && (
              <B2bPaymentSection
                retailer={context.retailer}
                modes={context.modes}
                mode={mode as B2bPaymentMode}
                amount={payableAmount}
                upiMethod={upiMethod}
                upiReference={upiReference}
                callback={handlePayment}
              />
            )}

            {step === "delivery" && (
              <B2bDeliverySection
                franchiseId={context.retailer?._id || retailerId}
                callback={(payload) => setRoute(payload.data ?? null)}
              />
            )}

            {step === "otp" && (
              <OtpVerifySection
                ref={otpRef}
                cartId={cartId}
                mobile={context.retailer?.mobile}
                name={context.retailer?.name}
                totalItems={totalItems}
                totalValue={payableAmount}
                extraParams={orderParams()}
                callback={(payload) =>
                  payload.action === "verified" && finish(payload.data)
                }
              />
            )}
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer className="tw:gap-2">
        <Button
          variant="outline"
          className="tw:h-10 tw:flex-1"
          onClick={handleBack}
        >
          {step !== "payment" && <ChevronLeft size={16} />}
          {step === "payment" ? "Cancel" : "Back"}
        </Button>

        <Button
          className="tw:h-10 tw:flex-1"
          disabled={!canAdvance}
          onClick={handleAdvance}
        >
          {submitting && <Loader2 className="tw:size-4 tw:animate-spin" />}
          {advanceLabel}
        </Button>
      </AppModal.Footer>
    </>
  );
};

export default B2bCheckoutFlow;
