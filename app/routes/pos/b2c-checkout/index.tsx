import { ArrowLeft, Building2, ChevronRight, Phone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppHeader from "~/components/core/header/AppHeader";
import AppSteps from "~/components/core/steps/AppSteps";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import FranchiseService from "~/services/FranchiseService";
import LoyaltyPointService from "~/services/LoyaltyPointService";
import PageAccessService from "~/services/PageAccessService";
import PosService from "~/services/PosService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import OtpVerification from "../billing/modals/b2b-checkout/components/OtpVerification";
import CustomerAddress from "../billing/modals/checkout/components/customer/address/CustomerAddress";
import SelectCustomer from "../billing/modals/checkout/components/customer/SelectCustomer";
import Payment from "../billing/modals/checkout/components/payment/Payment";
import ConfirmationSummary from "../billing/modals/checkout/components/summary/ConfirmationSummary";
import OrderPlacedModal from "../billing/modals/order-placed/OrderPlacedModal";
import CheckoutSummaryPanel from "./components/CheckoutSummaryPanel";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["SALE-ORDER.POS-BILLING"]);
}

type Summary = {
  subtotal: number;
  couponDiscount: number;
  coinsDiscount: number;
  totalDiscount: number;
  finalPrice: number;
  orderAmount: number;
};

const getSteps = (
  t: any,
  isB2C: boolean,
  assisted?: boolean,
  quickCheckout?: boolean,
) => {
  // Quick-checkout B2B: the customer (retailer) is resolved from the cart,
  // so checkout is just payment → confirmation.
  if (quickCheckout) {
    return [
      { title: t("checkoutModal.steps.choosePayment"), key: "payment" },
      { title: t("checkoutModal.steps.confirmation"), key: "confirmation" },
    ];
  }
  const steps = [
    { title: t("checkoutModal.steps.selectCustomer"), key: "customer" },
  ];
  if (isB2C) {
    steps.push({
      title: t("checkoutModal.steps.address", "Address"),
      key: "address",
    });
  }
  if (!assisted) {
    steps.push({
      title: t("checkoutModal.steps.choosePayment"),
      key: "payment",
    });
  }
  steps.push({
    title: t("checkoutModal.steps.confirmation"),
    key: "confirmation",
  });
  if (assisted) {
    steps.push({
      title: t("checkoutModal.steps.verification", "Verification"),
      key: "verification",
    });
  }
  return steps;
};

const B2cCheckoutPage = () => {
  const { t } = useTranslation(["posbilling", "menu"]);
  const { isMobile } = useScreenView();
  const appNav = useAppNav();
  const appToast = useAppToast();

  const [searchParams] = useSearchParams();
  const cartId = searchParams.get("cartId") || "";
  const assisted = searchParams.get("assisted") === "true";

  const [discountVal, setDiscountVal] = useState<number>(0);
  // Quick-checkout B2B cart: fulfills like B2C (stock debit, invoice,
  // Delivered) but the buyer is the retailer resolved from the cart.
  const quickCheckout = searchParams.get("quickCheckout") === "true";
  // Retailer id passed from the billing page via the URL — the only source
  // used to resolve the buyer retailer in quick checkout.
  const retailerIdInUrl = searchParams.get("retailerId") || "";

  const [cart, setCart] = useState<any[]>([]);
  const [summary, setSummary] = useState<Summary>({
    subtotal: 0,
    couponDiscount: 0,
    coinsDiscount: 0,
    totalDiscount: 0,
    finalPrice: 0,
    orderAmount: 0,
  });
  const [loadingCart, setLoadingCart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Quick checkout: the buyer retailer resolved from the cart's customerInfo.
  const [retailer, setRetailer] = useState<any | null>(null);
  const [currentStep, setCurrentStep] = useState(
    quickCheckout ? "payment" : "customer",
  );
  const [orderPlacedModal, setOrderPlacedModal] = useState<{
    show: boolean;
    orderId?: string | number | null;
    orderRefNo?: string | number | null;
  }>({ show: false, orderId: null, orderRefNo: null });

  const formMethods = useForm({
    defaultValues: {
      option: "b2c",
      smartcoins: 0,
      coupon_code: "",
      loyaltyPoints: "",
      paymentMethod: "cash",
      customer: null as any,
      retailer: null as any,
      paymentDetails: { refNo: "", proof: [], change: 0 },
      upiPayment: "",
      upiReferenceNumber: "",
      selectedPaymentMethods: [],
      changeToReturn: 0,
      roundOffOrderAmount: false,
    },
  });

  const totalDeals = cart.length;

  const fetchCart = useCallback(async () => {
    if (!cartId) return;
    setLoadingCart(true);
    try {
      const filter: Record<string, any> = { _id: cartId };
      if (assisted) filter.assistedOrder = true;
      const response = await PosService.getCart({ filter });
      const data = response.data?.data?.[0] || {};
      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length === 0) {
        appNav.replace(`/pos/billing`, {
          type: quickCheckout ? "b2b" : "b2c",
          ...(quickCheckout ? { quickCheckout: "true" } : {}),
          ...(assisted ? { assisted: "true" } : {}),
        });
        return;
      }
      setCart(items);
      if (data.priceBreakdown) setSummary(data.priceBreakdown);
      setDiscountVal(data.discountInfo?.totalAmount || 0);
      // Quick checkout: resolve the buyer retailer (id from the URL only)
      // for display only — the form `customer` carries just name/mobile
      // (no _id, so B2C paylater/coins checks stay disabled). The order API
      // resolves customerInfo from the cart itself.
      if (quickCheckout) {
        const info = data.customerInfo || {};
        const retailerId = retailerIdInUrl;
        if (info.name) {
          setRetailer({ name: info.name, _id: retailerId });
          formMethods.setValue("customer", {
            name: info.name,
            mobile: info.mobile || "",
          } as any);
        }
        if (retailerId) {
          try {
            const fResp = await FranchiseService.getFranchise(retailerId);
            const fr = fResp?.data?.data;
            if (fr?._id) {
              setRetailer(fr);
              formMethods.setValue("customer", {
                name: fr.name || info.name || "",
                mobile: fr.mobile || "",
              } as any);
            }
          } catch (e) {
            console.error("Error fetching retailer info for quick checkout", e);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching cart for checkout", e);
    } finally {
      setLoadingCart(false);
    }
  }, [cartId, assisted, quickCheckout, retailerIdInUrl]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    formMethods.reset();
    setCurrentStep(quickCheckout ? "payment" : "customer");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId]);

  const showAddressStep = () =>
    !!assisted && formMethods.getValues("option") === "b2c";

  const nextStepAfterCustomer = () => {
    if (showAddressStep()) return "address";
    if (assisted) return "confirmation";
    return "payment";
  };

  const handleStepChange = (stepKey: string) => setCurrentStep(stepKey);

  const handleCustomerCallback = (args: { action: string; data?: any }) => {
    if (args.action === "next") {
      if (assisted) formMethods.setValue("paymentMethod", "paylater");
      handleStepChange(nextStepAfterCustomer());
    }
  };

  const handleAddressCallback = (args: { action: string; data?: any }) => {
    if (args.action === "back") {
      handleStepChange("customer");
    } else if (args.action === "next") {
      if (assisted) {
        formMethods.setValue("paymentMethod", "paylater");
        handleStepChange("confirmation");
      } else {
        handleStepChange("payment");
      }
    }
  };

  const handlePaymentCallback = (args: { action: string; data?: any }) => {
    if (args.action === "back") {
      // Quick checkout has no customer step — back returns to the cart.
      if (quickCheckout) {
        handleBackToCart();
        return;
      }
      handleStepChange(showAddressStep() ? "address" : "customer");
    } else if (args.action === "next") {
      handleStepChange("confirmation");
    }
  };

  const preparePayload = (values: any) => {
    const paymentMethod = values.paymentMethod;
    const customer = values["customer"];

    const paymentTypeMap: Record<string, string> = {
      cash: "COD",
      card: "PREPAID",
      gpay: "PREPAID",
      phonepe: "PREPAID",
      paylater: "PAYLATER",
    };

    const isWalkin = values.option === "walkin";

    const customerInfo: any = isWalkin
      ? {
          customerType: "Customer",
          customerId: "guest_customer",
          isGuestCustomer: true,
        }
      : {
          customerType: "Customer",
          name: customer?.name || "",
          customerId: customer?._id,
          mobile: customer?.mobile || "",
          isGuestCustomer: false,
        };

    const mobileNo = customer?.mobile || "";
    const addressStr = customer?.address?.city
      ? `${customer.address.city}, ${customer.address.state}`
      : "";

    const billingAddress = {
      mobileNo: mobileNo ? Number(mobileNo) : 0,
      address: addressStr,
    };

    const shippingAddress = {
      mobileNo: mobileNo ? Number(mobileNo) : 0,
      address: addressStr,
    };

    return {
      isWalkin,
      customer,
      customerInfo,
      billingAddress,
      shippingAddress,
      roundOffOrderAmount: !!values.roundOffOrderAmount,
      paymentMode: values.selectedPaymentMethods.map((method: any) => ({
        type: method.value,
        amount:
          values.changeToReturn > 0
            ? method.amount - values.changeToReturn
            : method.amount,
        paidAmount: method.amount,
        paidVia: method.value === "upi" ? values.upiPayment : method.value,
        refNo: method.value === "upi" ? values.upiReferenceNumber : "",
        proof: [],
        change: values.changeToReturn ?? 0,
      })),
      paymentType: paymentTypeMap[paymentMethod] || "COD",
    };
  };

  const placeWalkinOrder = async (values: any) => {
    try {
      const { customerInfo, paymentMode, paymentType, roundOffOrderAmount } =
        preparePayload(values);
      const payload: any = {
        cartId,
        paymentType,
        paymentMode,
        customerInfo,
        roundOffOrderAmount,
      };
      const resp = await PosService.createPosOrder(payload);
      if (resp?.statusCode === 200) {
        appToast.show({
          msg: t("checkoutModal.messages.orderPlaced"),
          color: "success",
        });
        PosService.triggerOrderPlacedEvent({ cartId, order: resp.data });
        handleOrderComplete(resp.data);
      } else {
        appToast.show({
          msg:
            resp?.data?.message ||
            t("checkoutModal.messages.failedToPlaceOrder"),
          color: "error",
        });
      }
    } catch (e) {
      console.error("Error placing walkin order:", e);
      appToast.show({
        msg: t("checkoutModal.messages.errorPlacingOrder"),
        color: "error",
      });
    }
  };

  // Quick-checkout B2B order: customerInfo and addresses are resolved from
  // the cart (Retailer/franchise), so only payment details are sent.
  const placeQuickCheckoutOrder = async (values: any) => {
    try {
      const { paymentMode, paymentType, roundOffOrderAmount } =
        preparePayload(values);
      const payload: any = {
        cartId,
        paymentType,
        paymentMode,
        roundOffOrderAmount,
      };

      if (paymentType === "PAYLATER") {
        payload.paymentType = "COD";
        payload.paymentMethod = "PAYLATER";
      }

      const resp = await PosService.createPosOrder(payload);
      if (resp?.statusCode === 200) {
        appToast.show({
          msg: t("checkoutModal.messages.orderPlaced"),
          color: "success",
        });
        PosService.triggerOrderPlacedEvent({ cartId, order: resp.data });
        handleOrderComplete(resp.data);
      } else {
        appToast.show({
          msg:
            resp?.data?.message ||
            t("checkoutModal.messages.failedToPlaceOrder"),
          color: "error",
        });
      }
    } catch (e) {
      console.error("Error placing quick checkout order:", e);
      appToast.show({
        msg: t("checkoutModal.messages.errorPlacingOrder"),
        color: "error",
      });
    }
  };

  const placeB2COrder = async (values: any) => {
    const customer = values["customer"];
    if (!customer?._id) {
      appToast.show({ msg: "Please select a valid customer", color: "error" });
      return;
    }

    const {
      customerInfo,
      paymentMode,
      paymentType,
      billingAddress,
      roundOffOrderAmount,
    } = preparePayload(values);

    if (!customerInfo.customerId) {
      appToast.show({
        msg: "Customer ID is required for B2C orders",
        color: "error",
      });
      return;
    }
    if (!billingAddress.mobileNo) {
      appToast.show({ msg: "Mobile number is required", color: "error" });
      return;
    }

    let capturedRedeemRefId: string | undefined = undefined;
    try {
      const redemptionValue = Number((values as any).redemptionValue) || 0;
      const coinsToRedeem = Number((values as any).loyaltyPoints) || 0;
      if (redemptionValue > 0 && coinsToRedeem > 0) {
        const redeemableAmount = Math.max(
          (summary?.orderAmount || 0) - discountVal,
          0,
        );
        const blockPayload = {
          customerId: customerInfo.customerId,
          franchiseId: AuthService.getLoggedInUserId(),
          initialCartValue: redeemableAmount,
          coinsIntendedToRedeem: coinsToRedeem,
          orderType: "STORE_ORDER",
          orderAmount: redeemableAmount,
          blockCoin: true,
        };
        const blockResp =
          await LoyaltyPointService.redeemAtStorePoints(blockPayload);
        if (blockResp.statusCode !== 200) {
          appToast.show({
            msg: blockResp.data?.message || "Failed to block coins",
            color: "error",
          });
          return;
        }
        capturedRedeemRefId = blockResp.data?.data?.redeemRefId;
      }
    } catch (e) {
      console.error("Error blocking coins:", e);
      appToast.show({
        msg: t("checkoutModal.messages.errorPlacingOrder"),
        color: "error",
      });
      return;
    }

    const addrDetails = customer?.address
      ? Object.fromEntries(
          Object.entries({
            landmark: customer.address.landmark,
            city: customer.address.city,
            district: customer.address.district,
            state: customer.address.state,
            pincode: customer.address.pincode,
            line1: customer.address.line1,
            line2: customer.address.line2,
          }).filter(([_, v]) => v != null && v !== ""),
        )
      : {};

    const payload: any = {
      cartId,
      shippingAddress: addrDetails,
      billingAddress: addrDetails,
      paymentType,
      paymentMode,
      customerInfo,
      roundOffOrderAmount,
    };

    if (paymentType === "PAYLATER" || paymentMode?.type === "paylater") {
      payload.paymentType = "COD";
      payload.paymentMethod = "PAYLATER";
    }

    if (capturedRedeemRefId) {
      payload.redeemRefId = capturedRedeemRefId;
    }

    try {
      const resp = await PosService.createPosOrder(payload);
      if (resp?.statusCode === 200) {
        appToast.show({
          msg: t("checkoutModal.messages.orderPlaced"),
          color: "success",
        });
        PosService.triggerOrderPlacedEvent({ cartId, order: resp.data });
        handleOrderComplete(resp.data);
      } else {
        appToast.show({
          msg:
            resp?.data?.message ||
            t("checkoutModal.messages.failedToPlaceOrder"),
          color: "error",
        });
      }
    } catch (e) {
      console.error("Error placing B2C order:", e);
      appToast.show({
        msg: t("checkoutModal.messages.errorPlacingOrder"),
        color: "error",
      });
    }
  };

  const placeOrder = async () => {
    setIsSubmitting(true);
    try {
      const values = formMethods.getValues();
      if (!cartId) {
        appToast.show({ msg: "Cart ID is required", color: "error" });
        setIsSubmitting(false);
        return;
      }
      if (quickCheckout) {
        await placeQuickCheckoutOrder(values);
      } else if (values.option === "walkin") {
        await placeWalkinOrder(values);
      } else {
        await placeB2COrder(values);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      appToast.show({
        msg: t("checkoutModal.messages.errorPlacingOrder"),
        color: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendAssistedOtp = async () => {
    if (!cartId) {
      appToast.show({ msg: "Cart ID is required", color: "error" });
      return;
    }
    const customer = formMethods.getValues("customer");
    if (!customer?._id || !customer?.mobile) {
      appToast.show({ msg: "Customer details missing", color: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const resp = await CartService.generateOtp(cartId, {
        customerType: "Customer",
        name: customer.name,
        customerId: customer._id,
        mobile: customer.mobile,
      });
      if (resp?.statusCode === 200) {
        appToast.show({ msg: "OTP sent successfully", color: "success" });
        handleStepChange("verification");
      } else {
        appToast.show({
          msg: resp?.data?.message || "Failed to generate OTP",
          color: "error",
        });
      }
    } catch (e) {
      console.error("Error generating OTP", e);
      appToast.show({ msg: "Failed to generate OTP", color: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmationCallback = (args: { action: string; data?: any }) => {
    if (args.action === "back") {
      if (assisted) {
        handleStepChange(showAddressStep() ? "address" : "customer");
      } else {
        handleStepChange("payment");
      }
    } else if (args.action === "pay") {
      if (assisted) sendAssistedOtp();
      else placeOrder();
    }
  };

  const handleVerificationCallback = (args: { action: string; data?: any }) => {
    if (args.action === "back") {
      handleStepChange("confirmation");
    } else if (args.action === "complete") {
      handleOrderComplete(args.data);
    }
  };

  const handleOrderComplete = (data: any) => {
    const orderResp = data?.data || data || {};
    const orderId = orderResp?.order?.orderId || null;
    const orderRefNo = orderResp?.order?.orderRefNo || null;
    setOrderPlacedModal({ show: true, orderId, orderRefNo });
  };

  const handleOrderPlacedCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    setOrderPlacedModal({ show: false, orderId: null, orderRefNo: null });
    if (payload.action === "view-order") {
      appNav.to(`/dashboard/orders/view/${payload.data.orderId}`);
    } else {
      appNav.to(`/pos/billing`, {
        type: quickCheckout ? "b2b" : "b2c",
        ...(quickCheckout ? { quickCheckout: "true" } : {}),
        ...(assisted ? { assisted: "true" } : {}),
      });
    }
  };

  const handleBackToCart = () => {
    appNav.to(`/pos/billing`, {
      type: quickCheckout ? "b2b" : "b2c",
      ...(quickCheckout ? { quickCheckout: "true" } : {}),
      ...(quickCheckout && retailerIdInUrl
        ? { retailerId: retailerIdInUrl }
        : {}),
      ...(assisted ? { assisted: "true" } : {}),
    });
  };

  const steps = useMemo(
    () => getSteps(t, showAddressStep(), assisted, quickCheckout),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, assisted, quickCheckout, formMethods.watch("option")],
  );

  const stepIndex = steps.findIndex((s) => s.key === currentStep);
  const safeStepIndex = stepIndex < 0 ? 0 : stepIndex;
  const progressPct = Math.max(
    0,
    Math.min(100, ((safeStepIndex + 1) / steps.length) * 100),
  );
  const nextStepTitle = steps[safeStepIndex + 1]?.title;

  const stepHelper: Record<string, string> = {
    customer: t(
      "checkoutModal.helper.customer",
      "Choose the customer for this order. Search by name or mobile.",
    ),
    address: t(
      "checkoutModal.helper.address",
      "Confirm where this order should be delivered.",
    ),
    payment: t(
      "checkoutModal.helper.payment",
      "Select how the customer would like to pay.",
    ),
    confirmation: t(
      "checkoutModal.helper.confirmation",
      "Review everything once. You can still go back to change anything.",
    ),
    verification: t(
      "checkoutModal.helper.verification",
      "Enter the OTP sent to the customer's mobile to confirm the order.",
    ),
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "customer":
        return (
          <SelectCustomer
            callback={handleCustomerCallback}
            assisted={assisted}
          />
        );
      case "address":
        return <CustomerAddress callback={handleAddressCallback} />;
      case "payment":
        return (
          <Payment
            callback={handlePaymentCallback}
            totalAmount={summary?.finalPrice ?? summary?.orderAmount ?? 0}
            assisted={assisted}
            discount={discountVal}
            paylaterUserId={quickCheckout ? retailer?._id : undefined}
            paylaterUserType={quickCheckout ? "franchise" : "customer"}
          />
        );
      case "confirmation":
        return (
          <ConfirmationSummary
            callback={handleConfirmationCallback}
            summary={summary}
            totalDeals={totalDeals}
            isSubmitting={isSubmitting}
            assisted={assisted}
            discount={discountVal}
          />
        );
      case "verification": {
        const customer = formMethods.getValues("customer");
        return (
          <OtpVerification
            mobile={customer?.mobile ?? ""}
            retailerName={customer?.name ?? ""}
            cartId={cartId}
            totalItems={totalDeals}
            totalValue={Math.max(
              0,
              (summary?.finalPrice ?? summary?.orderAmount ?? 0) - discountVal,
            )}
            callback={handleVerificationCallback}
          />
        );
      }
      default:
        return (
          <SelectCustomer
            callback={handleCustomerCallback}
            assisted={assisted}
          />
        );
    }
  };

  return (
    <>
      <AppHeader
        title={
          assisted
            ? t("header.assistedOrder")
            : quickCheckout
              ? t("checkoutModal.quickCheckoutTitle", "B2B Quick Checkout")
              : t("checkoutModal.title", "Checkout")
        }
      />
      <FormProvider {...formMethods}>
        <div className="page-padding app-page page-bg">
          <div className="app-container">
            {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
            <SectionTabs sectionKey="bill" activeTab="pos" noShadow sticky />

            <div className="section-layout">
              {/* Desktop-only left rail — section side menu. */}
              <aside className="section-menu-aside">
                <div className="tw:sticky tw:top-20">
                  <SectionMenu
                    sectionKey="bill"
                    activeTab="pos"
                    title={t("manageSales", { ns: "menu" })}
                  />
                </div>
              </aside>

              <div className="section-content">
                {/* Action bar */}
                <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                  <button
                    type="button"
                    onClick={handleBackToCart}
                    className="tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-medium tw:text-gray-700 tw:cursor-pointer tw:px-2.5 tw:py-1 tw:rounded-md tw:hover:bg-gray-100 tw:transition-colors"
                  >
                    <ArrowLeft size={16} />
                    {t("backToCart", "Back to cart")}
                  </button>
                </div>

                <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:gap-5">
                  {/* Main content */}
                  <div className="tw:flex-1 tw:min-w-0">
                    {/* Stepper + step content as one connected surface */}
                    <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:shadow-sm tw:overflow-hidden tw:mb-3">
                      {/* Desktop stepper */}
                      <div className="tw:hidden tw:md:block tw:px-5 tw:pt-4 tw:pb-2 tw:border-b tw:border-gray-100 tw:bg-gray-50/50">
                        <AppSteps
                          steps={steps}
                          activeKey={currentStep}
                          borderMinWidth={30}
                          className="tw:w-full tw:mb-0! tw:text-center"
                        />
                      </div>

                      {/* Mobile step indicator */}
                      <div className="tw:md:hidden tw:px-4 tw:pt-4 tw:pb-3 tw:border-b tw:border-gray-100 tw:bg-gray-50/50">
                        <div className="tw:flex tw:items-baseline tw:justify-between tw:mb-2">
                          <span className="tw:text-[11px] tw:font-semibold tw:tracking-wide tw:uppercase tw:text-primary">
                            {t("step", "Step")} {safeStepIndex + 1} /{" "}
                            {steps.length}
                          </span>
                          {nextStepTitle && (
                            <span className="tw:text-[11px] tw:text-gray-500 tw:flex tw:items-center tw:gap-0.5">
                              {t("next", "Next")}
                              <ChevronRight size={12} />
                              {nextStepTitle}
                            </span>
                          )}
                        </div>
                        <div className="tw:h-1.5 tw:bg-gray-200 tw:rounded-full tw:overflow-hidden">
                          <div
                            className="tw:h-full tw:bg-primary tw:rounded-full tw:transition-all tw:duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Step header */}
                      <div className="tw:px-4 tw:md:px-5 tw:pt-4 tw:pb-3 tw:border-b tw:border-gray-100">
                        <div className="tw:flex tw:items-center tw:gap-3">
                          <span className="tw:flex tw:items-center tw:justify-center tw:w-7 tw:h-7 tw:rounded-full tw:bg-primary tw:text-white tw:text-xs tw:font-semibold tw:shrink-0">
                            {safeStepIndex + 1}
                          </span>
                          <div className="tw:min-w-0">
                            <h2 className="tw:text-base tw:font-semibold tw:text-gray-900 tw:leading-tight">
                              {steps[safeStepIndex]?.title}
                            </h2>
                            {stepHelper[currentStep] && (
                              <p className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                                {stepHelper[currentStep]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Step body */}
                      <div className="tw:p-4 tw:md:p-5">
                        {/* Quick checkout: show the buyer retailer resolved from the cart */}
                        {quickCheckout && retailer && (
                          <div className="tw:border tw:rounded tw:p-3 tw:bg-gray-50 tw:mb-4">
                            <div className="tw:flex tw:justify-between tw:items-start">
                              <div>
                                <div className="tw:font-semibold tw:text-sm tw:flex tw:items-center tw:gap-1">
                                  <Building2
                                    size={18}
                                    className="tw:text-gray-800"
                                  />
                                  {retailer.name || "-"}
                                </div>
                                <div className="tw:text-xs tw:text-gray-600 tw:mt-1">
                                  ID: {retailer.franchiseId || "-"}
                                </div>
                              </div>
                              <div className="tw:text-right tw:text-xs tw:text-gray-600 tw:flex tw:items-center tw:gap-1">
                                <Phone size={12} />
                                <div>{retailer.mobile || "-"}</div>
                              </div>
                            </div>
                            {retailer.formatAddress && (
                              <div className="tw:text-xs tw:text-gray-600">
                                {retailer.formatAddress}
                              </div>
                            )}
                          </div>
                        )}
                        {renderCurrentStep()}
                      </div>
                    </div>

                    {/* Mobile summary drawer */}
                    {isMobile && (
                      <CheckoutSummaryPanel
                        items={cart}
                        summary={summary}
                        variant="drawer"
                        onEditCart={handleBackToCart}
                        className="tw:mb-2"
                        discount={discountVal}
                      />
                    )}
                  </div>

                  {/* Desktop summary sidebar */}
                  <div className="tw:hidden tw:md:block tw:md:w-1/3 tw:shrink-0">
                    <div className="tw:sticky tw:top-20">
                      <CheckoutSummaryPanel
                        items={cart}
                        summary={summary}
                        variant="sidebar"
                        onEditCart={handleBackToCart}
                        discount={discountVal}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormProvider>

      <OrderPlacedModal
        show={orderPlacedModal.show}
        orderId={orderPlacedModal.orderId ?? undefined}
        orderRefNo={orderPlacedModal.orderRefNo ?? undefined}
        isB2b={false}
        isAssisted={assisted}
        showInvoicePrint
        callback={handleOrderPlacedCallback}
      />

      <BusyLoader show={loadingCart || isSubmitting} />
    </>
  );
};

export default B2cCheckoutPage;

export const meta = () => {
  return [
    { title: "POS Checkout" },
    { name: "description", content: "POS B2C Checkout" },
  ];
};
