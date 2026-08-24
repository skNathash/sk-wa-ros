import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Award,
  Building2,
  ChevronLeft,
  Loader2,
  User,
  Users,
} from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import Amount from "~/components/core/amount/Amount";
import { Button } from "~/components/ui/button";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import LoyaltyPointService from "~/services/LoyaltyPointService";
import PosService from "~/services/PosService";
import CustomerSection from "./components/customer/CustomerSection";
import CashTenderSection from "./components/cash-tender/CashTenderSection";
import UpiSection from "./components/upi/UpiSection";
import PaylaterSection, {
  type PaylaterWallet,
} from "./components/paylater/PaylaterSection";
import RedeemSection from "./components/redeem/RedeemSection";
import CheckoutAddressSection, {
  type AddressSectionHandle,
} from "./components/address/CheckoutAddressSection";
import OtpVerifySection, {
  type OtpSectionHandle,
} from "./components/otp/OtpVerifySection";
import type { PaymentModeKey } from "./components/payment-modes/helper";
import PaymentModes from "./components/payment-modes/PaymentModes";
import type {
  SplitAmounts,
  SplitPair,
} from "./components/split-payment/SplitPaymentSection";
import SplitPaymentSection from "./components/split-payment/SplitPaymentSection";
import B2bCheckoutFlow from "./components/b2b/B2bCheckoutFlow";
import {
  EMPTY_CART,
  fetchCartDetails,
  getPayableAmount,
  preparePayload,
  toAmount,
  type CartDetails,
} from "./helper";

type Props = {
  show: boolean;
  /** The checkout flow type. B2C asks for the customer first. */
  type?: "b2c" | "b2b" | string;
  /** Cart being settled — read fresh every time the modal opens. */
  cartId?: string;
  /** Assisted order: no payment is collected, the customer verifies by OTP. */
  assisted?: boolean;
  /**
   * Quick-checkout B2B: the cart carries its buyer but settles exactly like a
   * B2C bill (cash, UPI, split), so it stays on the B2C body.
   */
  quickCheckout?: boolean;
  /** Customer already chosen on the billing screen — opens the flow on them. */
  customer?: any;
  /** The retailer buying, for a plain B2B order. Falls back to the cart's buyer. */
  retailerId?: string;
  callback: (args: { action: string; data?: any }) => void;
};

type CheckoutMode = PaymentModeKey | "split";
type Step = "customer" | "address" | "payment" | "otp";

const SPLIT_MODES: SplitPair = ["cash", "upi"];

const defaultValues = {
  option: "walkin",
  mobile: "",
  name: "",
  customer: null as any,
  isNewCustomer: false,
  paymentMode: "cash" as CheckoutMode,
  tendered: 0,
  upiPayment: "",
  reference: "",
  splitAmounts: {} as SplitAmounts,
  loyaltyPoints: "" as number | "",
  redemptionValue: 0,
  roundOffOrderAmount: false,
};

const CheckoutFlowModal = ({
  show,
  type = "b2c",
  cartId = "",
  assisted = false,
  quickCheckout = false,
  customer: preselectedCustomer = null,
  retailerId = "",
  callback,
}: Props) => {
  const { t } = useTranslation(["posbilling"]);
  const appToast = useAppToast();

  const effectiveType = (type || "b2c").toLowerCase();
  const isB2C = effectiveType !== "b2b";
  /**
   * A plain B2B order runs its own steps — the retailer pays the seller (UPI)
   * or draws on their limit, picks a delivery route and confirms by OTP.
   */
  const isB2bOrder = !isB2C && !quickCheckout;

  const formMethods = useForm({ defaultValues });
  const { control, setValue, getValues, reset } = formMethods;

  const [
    option,
    customer,
    paymentMode,
    tendered,
    upiPayment,
    reference,
    splitAmounts,
    loyaltyPoints,
    redemptionValue,
  ] = useWatch({
    control,
    name: [
      "option",
      "customer",
      "paymentMode",
      "tendered",
      "upiPayment",
      "reference",
      "splitAmounts",
      "loyaltyPoints",
      "redemptionValue",
    ],
  });

  const firstStep: Step = isB2C ? "customer" : "payment";
  const [step, setStep] = useState<Step>(firstStep);
  const [cart, setCart] = useState<CartDetails>(EMPTY_CART);
  const [loadingCart, setLoadingCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasUpiConfig, setHasUpiConfig] = useState(false);
  const [wallet, setWallet] = useState<PaylaterWallet | null>(null);

  const addressRef = useRef<AddressSectionHandle>(null);
  const otpRef = useRef<OtpSectionHandle>(null);

  const redemption = Number(redemptionValue) || 0;
  const billTotal = toAmount(
    cart.summary.finalPrice ?? cart.summary.orderAmount ?? 0,
  );
  /** What the counter actually collects — the one number that must not be missed. */
  const payableAmount = getPayableAmount(
    cart.summary,
    cart.discount,
    redemption,
  );
  /** Bill the coins are redeemed against, before any redemption is applied. */
  const redeemableAmount = getPayableAmount(cart.summary, cart.discount, 0);

  // A fresh cart read every time the modal opens — prices, discounts and the
  // buyer on the cart can all have moved since it was last shown.
  useEffect(() => {
    if (!show) return;

    // A customer carried in from the billing screen opens the flow on them;
    // an assisted order is always raised against a real customer, so it opens
    // on the lookup rather than on walk-in.
    const known = isB2C ? preselectedCustomer : null;
    reset({
      ...defaultValues,
      option: known?._id || assisted ? "b2c" : "walkin",
      mobile: known?.mobile ? String(known.mobile) : "",
      customer: known,
    });
    setStep(firstStep);
    setWallet(null);

    let cancelled = false;
    const load = async () => {
      if (!cartId) {
        setCart(EMPTY_CART);
        return;
      }
      setLoadingCart(true);
      try {
        const details = await fetchCartDetails(cartId, assisted);
        if (cancelled) return;
        setCart(details);
        // A B2B cart already knows its buyer; carry it into the form so the
        // payload and the summary line read the same name.
        if (!isB2C && details.customerInfo?.name) {
          setValue("option", effectiveType);
          setValue("customer", {
            _id: details.customerInfo.customerId,
            name: details.customerInfo.name,
            mobile: details.customerInfo.mobile || "",
          });
        }
      } catch (e) {
        console.error("Error fetching cart for checkout", e);
        if (!cancelled) setCart(EMPTY_CART);
      } finally {
        if (!cancelled) setLoadingCart(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, cartId, assisted, effectiveType, preselectedCustomer?._id]);

  /** Paylater debits a credit line, so it needs a buyer — never a walk-in. */
  const availableModes: PaymentModeKey[] =
    option === "walkin" ? ["cash", "upi"] : ["cash", "upi", "paylater"];

  // Dropping back to walk-in after picking paylater leaves a rail that can no
  // longer be settled; fall back to cash rather than a dead selection.
  useEffect(() => {
    if (option === "walkin" && paymentMode === "paylater") {
      setValue("paymentMode", "cash");
      setWallet(null);
    }
  }, [option, paymentMode, setValue]);

  // Cash starts pre-filled with the exact bill — the common case at a counter.
  useEffect(() => {
    if (getValues("paymentMode") === "cash") {
      setValue("tendered", payableAmount);
    }
  }, [payableAmount, getValues, setValue]);

  /** Drops whatever the previous rail collected, so nothing leaks across. */
  const resetCollected = useCallback(() => {
    setValue("reference", "");
    setValue("tendered", payableAmount);
    setValue("splitAmounts", {});
  }, [payableAmount, setValue]);

  const handleSelect = (payload: { action: string; data?: any }) => {
    if (payload.action === "select" && payload.data?.mode) {
      setValue("paymentMode", payload.data.mode);
      resetCollected();
    }
  };

  const handleSplit = (payload: { action: string; data?: any }) => {
    if (payload.action === "select") {
      setValue("paymentMode", "split");
      // The whole bill starts on cash; typing a UPI amount below moves the
      // balance across, so the two rails always add up without extra taps.
      setValue("splitAmounts", { cash: payableAmount, upi: 0 });
      setValue("tendered", payableAmount);
      setValue("reference", "");
      return;
    }

    if (payload.action === "change") {
      // Editing one rail settles the other with whatever is left, so the two
      // fields always add up to the bill without extra typing.
      const edited: PaymentModeKey = payload.data.mode;
      const other = SPLIT_MODES.find((mode) => mode !== edited)!;
      const amount = Math.min(payload.data.amount, payableAmount);

      const next: SplitAmounts = {
        [edited]: amount,
        [other]: toAmount(Math.max(payableAmount - amount, 0)),
      };
      setValue("splitAmounts", next);
      setValue("tendered", next.cash || 0);
    }
  };

  const handleUpi = (payload: { action: string; data?: any }) => {
    if (payload.action === "configs") {
      setHasUpiConfig((payload.data?.configs || []).length > 0);
      return;
    }
    if (payload.action !== "change") return;

    const { method, reference: ref, amount } = payload.data || {};
    if (method !== undefined) setValue("upiPayment", method);
    if (ref !== undefined) setValue("reference", ref);
    if (amount !== undefined && paymentMode === "split") {
      handleSplit({ action: "change", data: { mode: "upi", amount } });
    }
  };

  const handleRedeem = (payload: { action: string; data?: any }) => {
    if (payload.action !== "change") return;
    setValue("loyaltyPoints", payload.data.coins);
    setValue("redemptionValue", payload.data.redemptionValue || 0);
    resetCollected();
  };

  const splitCovered = SPLIT_MODES.reduce(
    (sum, mode) => sum + ((splitAmounts as SplitAmounts)?.[mode] || 0),
    0,
  );
  const splitUpiAmount = (splitAmounts as SplitAmounts)?.upi || 0;
  const splitCashAmount = (splitAmounts as SplitAmounts)?.cash || 0;

  const isUpiCollected = (amount: number) =>
    amount <= 0 ||
    (hasUpiConfig && !!upiPayment && (reference || "").trim().length > 0);

  const isPaymentValid = useMemo(() => {
    if (payableAmount <= 0) return false;

    if (paymentMode === "cash") return (tendered || 0) >= payableAmount;
    if (paymentMode === "upi") return isUpiCollected(payableAmount);
    if (paymentMode === "paylater")
      return !!wallet?.eligible && wallet.balance >= payableAmount;
    if (paymentMode === "split")
      return (
        toAmount(splitCovered) === payableAmount &&
        (tendered || 0) >= splitCashAmount &&
        isUpiCollected(splitUpiAmount)
      );

    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    paymentMode,
    tendered,
    payableAmount,
    splitCovered,
    splitCashAmount,
    splitUpiAmount,
    reference,
    upiPayment,
    hasUpiConfig,
    wallet,
  ]);

  const isCustomerValid = useMemo(() => {
    if (!isB2C) return true;
    // An assisted order is raised against a real customer, never a walk-in.
    if (assisted) return !!customer?._id;
    if (option === "walkin") return true;
    return !!customer?._id;
  }, [isB2C, assisted, option, customer]);

  /** Blocks the coins for real, returning the ref the order payload carries. */
  const blockCoins = async () => {
    const coins = Number(loyaltyPoints) || 0;
    if (!(redemption > 0 && coins > 0)) return { ok: true, redeemRefId: "" };

    const resp = await LoyaltyPointService.redeemAtStorePoints({
      customerId: customer?._id,
      franchiseId: AuthService.getLoggedInUserId(),
      initialCartValue: redeemableAmount,
      coinsIntendedToRedeem: coins,
      orderType: "STORE_ORDER",
      orderAmount: redeemableAmount,
      blockCoin: true,
    });

    if (resp.statusCode !== 200) {
      appToast.show({
        msg: resp.data?.message || "Failed to block coins",
        color: "error",
      });
      return { ok: false, redeemRefId: "" };
    }

    return { ok: true, redeemRefId: resp.data?.data?.redeemRefId || "" };
  };

  const placeOrder = async () => {
    if (!cartId) {
      appToast.show({ msg: "Cart ID is required", color: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const blocked = await blockCoins();
      if (!blocked.ok) return;

      const { payload, changeToReturn } = preparePayload(getValues(), {
        cartId,
        type: effectiveType,
        assisted,
        payableAmount,
        redeemRefId: blocked.redeemRefId,
      });

      // The service types only the required keys; the flow sends the full order.
      const resp = await PosService.createPosOrder(payload as any);
      if (resp?.statusCode !== 200) {
        appToast.show({
          msg:
            resp?.data?.message ||
            t("checkoutModal.messages.failedToPlaceOrder", {
              defaultValue: "Failed to place order",
            }),
          color: "error",
        });
        return;
      }

      appToast.show({
        msg: t("checkoutModal.messages.orderPlaced", {
          defaultValue: "Order placed",
        }),
        color: "success",
      });
      PosService.triggerOrderPlacedEvent({ cartId, order: resp.data });
      callback({
        action: "success",
        data: { order: resp.data, changeToReturn, payload },
      });
    } catch (e) {
      console.error("Error placing POS order", e);
      appToast.show({
        msg: t("checkoutModal.messages.errorPlacingOrder", {
          defaultValue: "Error placing order",
        }),
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /** Assisted orders are confirmed by the customer, not collected at the counter. */
  const sendOtp = async () => {
    if (!cartId || !customer?._id) {
      appToast.show({ msg: "Customer details missing", color: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const resp = await CartService.generateOtp(cartId, {
        customerType: "Customer",
        name: customer.name,
        customerId: customer._id,
        mobile: customer.mobile,
      });

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
      console.error("Error generating OTP", e);
      appToast.show({ msg: "Failed to generate OTP", color: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvance = async () => {
    if (step === "customer") {
      setStep(assisted ? "address" : "payment");
      return;
    }

    if (step === "address") {
      setSubmitting(true);
      const saved = await addressRef.current?.save();
      setSubmitting(false);
      if (saved) await sendOtp();
      return;
    }

    if (step === "otp") {
      setSubmitting(true);
      await otpRef.current?.verify();
      setSubmitting(false);
      return;
    }

    await placeOrder();
  };

  const handleBack = () => {
    if (step === "payment" && isB2C) setStep("customer");
    else if (step === "address") setStep("customer");
    else if (step === "otp") setStep("address");
    else callback({ action: "close" });
  };

  const steps: Step[] = isB2C
    ? assisted
      ? ["customer", "address", "otp"]
      : ["customer", "payment"]
    : ["payment"];
  const stepIndex = Math.max(steps.indexOf(step), 0);

  const stepTitle: Record<Step, string> = {
    customer: t("checkoutModal.customer.title", { defaultValue: "Customer" }),
    address: "Address",
    payment: "Payment",
    otp: "Verification",
  };

  const canAdvance =
    !submitting &&
    !loadingCart &&
    (step === "customer"
      ? isCustomerValid
      : step === "address" || step === "otp"
        ? true
        : isPaymentValid);

  const advanceLabel =
    step === "customer"
      ? t("checkoutModal.customer.actions.continue", {
          defaultValue: "Continue",
        })
      : step === "address"
        ? "Save & send OTP"
        : step === "otp"
          ? "Verify & place order"
          : t("checkoutModal.actions.confirmPayment", {
              defaultValue: "Confirm Payment",
            });

  /**
   * One quiet line on the later steps recalling who the bill is for, with a way
   * back to the customer step.
   */
  const SelectedCustomerSummary = () => {
    // A quick-checkout B2B cart settles like a B2C bill but is bought by a
    // retailer, so the strip states who without offering a way to change them —
    // the buyer rides on the cart and is picked on the billing screen.
    if (!isB2C) {
      if (!customer?.name) return null;

      return (
        <div className="tw:flex tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-slate-50 tw:px-2.5 tw:py-1.5">
          <Building2 size={14} className="tw:shrink-0 tw:text-slate-500" />
          <span className="tw:truncate tw:text-xs tw:font-semibold tw:text-slate-800">
            {customer.name}
          </span>
          {customer.mobile && (
            <span className="tw:shrink-0 tw:text-xs tw:tabular-nums tw:text-slate-500">
              {customer.mobile}
            </span>
          )}
        </div>
      );
    }

    const isWalkin = option === "walkin";
    const Icon = isWalkin ? User : Users;

    return (
      <div className="tw:flex tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-slate-50 tw:px-2.5 tw:py-1.5">
        <Icon size={14} className="tw:shrink-0 tw:text-slate-500" />

        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-wrap tw:items-center tw:gap-x-2 tw:text-xs">
          <span className="tw:truncate tw:font-semibold tw:text-slate-800">
            {isWalkin
              ? t("checkoutModal.customer.options.walkin", {
                  defaultValue: "Walk-in",
                })
              : customer?.name}
          </span>
          {!isWalkin && customer?.mobile && (
            <span className="tw:tabular-nums tw:tracking-wide tw:text-slate-500">
              {customer.mobile}
            </span>
          )}
          {!isWalkin && (customer?.points ?? null) !== null && (
            <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-emerald-700">
              <Award size={12} className="tw:shrink-0" />
              {t("checkoutModal.customer.customerCard.pointsCount", {
                count: customer?.points,
                defaultValue: `${customer?.points} points`,
              })}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setStep("customer")}
          className="tw:shrink-0 tw:cursor-pointer tw:text-[11px] tw:font-semibold tw:text-emerald-700 hover:tw:underline"
        >
          {t("checkoutModal.customer.actions.change", {
            defaultValue: "Change",
          })}
        </button>
      </div>
    );
  };

  const showRedeem =
    !assisted &&
    isB2C &&
    option !== "walkin" &&
    !!customer?._id &&
    Number(customer?.points ?? 0) > 0;

  return (
    <AppModal
      show={show}
      callback={callback}
      // The drawer caps itself at 80vh; the counter gets the taller sheet the
      // flow was laid out for. Height stays on the content — 90vh is only the
      // ceiling, so short steps sit at their natural height.
      className="tw:max-h-[90vh]  tw:sm:max-w-2xl"
    >
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:pr-2">
          <div className="tw:min-w-0">
            <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
              {t("checkoutModal.title", { defaultValue: "Checkout" })}
            </div>
            {!isB2bOrder && steps.length > 1 && (
              <div className="tw:text-[11px] tw:font-normal tw:text-slate-500">
                {`Step ${stepIndex + 1} of ${steps.length} · ${stepTitle[step]}`}
              </div>
            )}
          </div>

          {/* The number the counter collects, never more than a glance away */}
          <div className="tw:flex tw:shrink-0 tw:items-baseline tw:gap-1.5 tw:rounded-lg tw:bg-emerald-50 tw:px-2.5 tw:py-1">
            <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-700">
              To collect
            </span>
            <span className="tw:text-lg tw:font-bold tw:tabular-nums tw:text-emerald-800">
              <Amount value={payableAmount} />
            </span>
          </div>
        </div>
      </AppModal.Title>

      {isB2bOrder ? (
        <B2bCheckoutFlow
          show={show}
          cartId={cartId}
          retailerId={retailerId || cart.customerInfo?.customerId || ""}
          assisted={assisted}
          payableAmount={payableAmount}
          totalItems={cart.items.length}
          callback={callback}
        />
      ) : (
        <>
          <FormProvider {...formMethods}>
            <AppModal.Content className="tw:min-h-0">
              {loadingCart ? (
                <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-10 tw:text-sm tw:text-slate-500">
                  <Loader2 className="tw:size-4 tw:animate-spin" />
                  Loading cart…
                </div>
              ) : (
                <div className="tw:space-y-2.5 tw:pt-1">
                  {step === "customer" && <CustomerSection />}

                  {step !== "customer" && <SelectedCustomerSummary />}

                  {step === "address" && (
                    <CheckoutAddressSection
                      ref={addressRef}
                      customer={customer}
                      callback={(payload) =>
                        payload.action === "saved" &&
                        setValue("customer", payload.data.customer)
                      }
                    />
                  )}

                  {step === "otp" && (
                    <OtpVerifySection
                      ref={otpRef}
                      cartId={cartId}
                      mobile={customer?.mobile}
                      name={customer?.name}
                      totalItems={cart.items.length}
                      totalValue={payableAmount}
                      callback={(payload) => {
                        if (payload.action !== "verified") return;
                        // The OTP raises the order server-side, so the screen
                        // behind the modal is told the same way a paid order
                        // tells it — the counter lands on a fresh cart either way.
                        PosService.triggerOrderPlacedEvent({
                          cartId,
                          order: payload.data,
                        });
                        callback({
                          action: "success",
                          data: { order: payload.data },
                        });
                      }}
                    />
                  )}

                  {step === "payment" && (
                    <>
                      {showRedeem && (
                        <RedeemSection
                          customerId={customer._id}
                          points={Number(customer.points) || 0}
                          redeemableAmount={redeemableAmount}
                          coins={loyaltyPoints as number | ""}
                          redemptionValue={redemption}
                          callback={handleRedeem}
                        />
                      )}

                      {/* Final payable, spelled out whenever it isn't the bill total */}
                      {(cart.discount > 0 || redemption > 0) && (
                        <div className="tw:space-y-0.5 tw:rounded-xl tw:border tw:border-emerald-200 tw:bg-emerald-50 tw:p-2.5">
                          <SummaryRow label="Bill total" value={billTotal} />
                          {cart.discount > 0 && (
                            <SummaryRow
                              label="Cart discount"
                              value={cart.discount}
                              negative
                            />
                          )}
                          {redemption > 0 && (
                            <SummaryRow
                              label="KingCoins redeemed"
                              value={redemption}
                              negative
                            />
                          )}
                          <div className="tw:mt-1 tw:flex tw:items-center tw:justify-between tw:border-t tw:border-emerald-200 tw:pt-1.5">
                            <span className="tw:text-xs tw:font-semibold tw:text-emerald-900">
                              Final payable
                            </span>
                            <span className="tw:text-lg tw:font-bold tw:tabular-nums tw:text-emerald-800">
                              <Amount value={payableAmount} />
                            </span>
                          </div>
                        </div>
                      )}

                      <PaymentModes
                        value={
                          paymentMode === "split"
                            ? undefined
                            : (paymentMode as PaymentModeKey)
                        }
                        modes={availableModes}
                        callback={handleSelect}
                      />

                      <SplitPaymentSection
                        payableAmount={payableAmount}
                        modes={SPLIT_MODES}
                        amounts={(splitAmounts as SplitAmounts) || {}}
                        active={paymentMode === "split"}
                        callback={handleSplit}
                      />

                      {/* A split bill is settled on both rails at once, so on a
                        counter screen they sit side by side rather than one
                        scrolled below the other. */}
                      <div
                        className={
                          paymentMode === "split"
                            ? "tw:grid tw:gap-2.5 tw:lg:grid-cols-2"
                            : undefined
                        }
                      >
                        {(paymentMode === "cash" ||
                          paymentMode === "split") && (
                          <CashTenderSection
                            payableAmount={
                              paymentMode === "split"
                                ? splitCashAmount
                                : payableAmount
                            }
                            cartValue={
                              paymentMode === "split"
                                ? splitCashAmount
                                : payableAmount
                            }
                            tendered={tendered || 0}
                            compact={paymentMode === "split"}
                            onChange={(value) => setValue("tendered", value)}
                          />
                        )}

                        {(paymentMode === "upi" || paymentMode === "split") && (
                          <UpiSection
                            amount={
                              paymentMode === "split"
                                ? splitUpiAmount
                                : payableAmount
                            }
                            method={upiPayment}
                            reference={reference}
                            amountReadOnly={paymentMode !== "split"}
                            compact={paymentMode === "split"}
                            callback={handleUpi}
                          />
                        )}
                      </div>

                      {paymentMode === "paylater" && (
                        <PaylaterSection
                          amount={payableAmount}
                          user={customer}
                          type={isB2C ? "b2c" : "b2b"}
                          callback={(payload) =>
                            payload.action === "eligibility" &&
                            setWallet(payload.data)
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </AppModal.Content>
          </FormProvider>

          {/* One primary action, always in the same corner, whatever the step. */}
          <AppModal.Footer className="tw:flex-row tw:gap-2">
            <Button
              variant="outline"
              className="tw:h-10 tw:flex-1"
              onClick={handleBack}
            >
              {step !== firstStep && <ChevronLeft size={16} />}
              {step === firstStep
                ? t("checkoutModal.actions.cancel", { defaultValue: "Cancel" })
                : t("checkoutModal.actions.back", { defaultValue: "Back" })}
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
      )}
    </AppModal>
  );
};

const SummaryRow = ({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) => (
  <div className="tw:flex tw:items-center tw:justify-between tw:text-[11px]">
    <span className="tw:text-emerald-800">{label}</span>
    <span className="tw:tabular-nums tw:font-semibold tw:text-emerald-800">
      {negative && "−"}
      <Amount value={value} />
    </span>
  </div>
);

export default CheckoutFlowModal;
