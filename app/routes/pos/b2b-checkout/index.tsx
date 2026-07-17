import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronRight,
  IndianRupee,
  MapPin,
  Pencil,
  Phone,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppSteps, { type StepData } from "~/components/core/steps/AppSteps";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import CommonService from "~/services/CommonService";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import FranchiseService from "~/services/FranchiseService";
import PageAccessService from "~/services/PageAccessService";
import PaylaterService from "~/services/PaylaterService";
import PosService from "~/services/PosService";
import PrepaidInfoModal from "~/shared/configs/modals/PrepaidInfoModal";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import DeliverRoute from "../billing/modals/b2b-checkout/components/DeliverRoute";
import OtpVerification from "../billing/modals/b2b-checkout/components/OtpVerification";
import Summary from "../billing/modals/b2b-checkout/components/Summary";
import OrderPlacedModal from "../billing/modals/order-placed/OrderPlacedModal";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["SALE-ORDER.POS-BILLING"]);
}

type CartSummary = {
  subtotal: number;
  couponDiscount: number;
  coinsDiscount: number;
  totalDiscount: number;
  finalPrice: number;
  orderAmount: number;
};

type PrepaidPayment = {
  type: string;
  amount: number;
  referenceNumber: string;
  proof: any[];
  remarks: string;
  paidVia: string;
  methodId: string;
};

const B2bCheckoutPage = () => {
  const { t } = useTranslation(["posbilling", "menu"]);
  const appNav = useAppNav();
  const appToast = useAppToast();

  const [searchParams] = useSearchParams();
  const cartId = searchParams.get("cartId") || "";
  const assisted = searchParams.get("assisted") === "true";
  const retailerId = searchParams.get("retailerId") || "";

  const [cart, setCart] = useState<any[]>([]);
  const [summary, setSummary] = useState<CartSummary>({
    subtotal: 0,
    couponDiscount: 0,
    coinsDiscount: 0,
    totalDiscount: 0,
    finalPrice: 0,
    orderAmount: 0,
  });
  const [retailer, setRetailer] = useState<any>(null);
  const [loadingCart, setLoadingCart] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isProceeding, setIsProceeding] = useState(false);

  const [currentStep, setCurrentStep] = useState("payment");
  const [steps, setSteps] = useState<StepData[]>([]);
  const [enableOtpForPOS, setEnableOtpForPOS] = useState(false);

  const [fetchingPaylater, setFetchingPaylater] = useState(false);
  const [paylaterEligible, setPaylaterEligible] = useState(false);
  const [paylaterBalance, setPaylaterBalance] = useState(0);
  const [allowedPayments, setAllowedPayments] = useState<{
    cod: boolean;
    prepaid: boolean;
  }>({ cod: true, prepaid: false });
  const [selectedMethod, setSelectedMethod] = useState<
    "COD" | "PREPAID" | "PAYLATER"
  >("COD");

  const [prepaidOptions, setPrepaidOptions] = useState<any[]>([]);
  const [showPrepaidModal, setShowPrepaidModal] = useState(false);
  const [prepaidPayment, setPrepaidPayment] = useState<PrepaidPayment | null>(
    null,
  );

  const [selectedRoute, setSelectedRoute] = useState<any>(null);

  const [orderPlacedModal, setOrderPlacedModal] = useState<{
    show: boolean;
    orderId?: string | number | null;
    orderRefNo?: string | number | null;
    reserveOrderId?: string | number | null;
    reserveOrderRefNo?: string | number | null;
  }>({
    show: false,
    orderId: null,
    orderRefNo: null,
    reserveOrderId: null,
    reserveOrderRefNo: null,
  });

  const totalItems = cart.length;
  const rawTotal = summary?.finalPrice ?? summary?.subtotal ?? 0;
  const orderAmount = summary?.orderAmount ?? Math.round(rawTotal);

  const backToBilling = useCallback(
    (replace = false) => {
      const params = {
        type: "b2b",
        ...(retailerId ? { retailerId } : {}),
        ...(assisted ? { assisted: "true" } : {}),
      };
      if (replace) appNav.replace(`/pos/billing`, params);
      else appNav.to(`/pos/billing`, params);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assisted, retailerId],
  );

  const fetchPaylaterDetails = useCallback(async (retailerId: string) => {
    if (!retailerId) {
      setFetchingPaylater(false);
      return;
    }

    setFetchingPaylater(true);
    try {
      const [paylaterResp, configResp] = await Promise.all([
        PaylaterService.validateEligibility({
          userInfo: {
            id: retailerId,
            type: "franchise",
          },
          franchiseInfo: {
            id: AuthService.getLoggedInUserId(),
          },
        }),
        FranchiseService.getSpecificUserConfig(
          retailerId,
          AuthService.getLoggedInUserId(),
          "B2B",
        ),
      ]);

      // Paylater Details
      const d = paylaterResp.data || {};
      const eligible = d?.data?.eligible;
      const available = d?.data?.paylaterInfo?.creditAvailable ?? 0;

      setPaylaterBalance(Number(available) || 0);
      setPaylaterEligible(paylaterResp?.statusCode === 200 && eligible);

      // Payment Config
      const config = configResp?.data?.data?.allowedPayments || {
        cod: true,
        prepaid: false,
      };
      setAllowedPayments(config);

      // Default to the first available option in display order
      // (COD -> Prepaid -> Paylater). Prepaid still requires payment
      // details to be captured via the modal before proceeding.
      if (config.cod) {
        setSelectedMethod("COD");
      } else if (config.prepaid) {
        setSelectedMethod("PREPAID");
      } else if (
        paylaterResp?.statusCode === 200 &&
        eligible &&
        available > 0
      ) {
        setSelectedMethod("PAYLATER");
      } else {
        setSelectedMethod("COD");
      }
    } catch (e) {
      console.error("Error checking paylater eligibility:", e);
      setPaylaterEligible(false);
    } finally {
      setFetchingPaylater(false);
    }
  }, []);

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
        backToBilling(true);
        return;
      }
      setCart(items);
      if (data.priceBreakdown) setSummary(data.priceBreakdown);
    } catch (e) {
      console.error("Error fetching cart for B2B checkout", e);
    } finally {
      setLoadingCart(false);
    }
  }, [cartId, assisted, backToBilling]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Retailer details + paylater/payment config come from the retailerId
  // query param (set by the billing page), not from the cart response
  useEffect(() => {
    if (!retailerId) return;

    fetchPaylaterDetails(retailerId);

    let cancelled = false;
    const fetchRetailer = async () => {
      try {
        const franResp = await FranchiseService.getFranchise(retailerId);
        const fran = franResp?.data?.data;
        if (cancelled) return;
        if (fran?._id) {
          setRetailer({
            ...fran,
            formatAddress: [
              fran.city || fran.town,
              fran.district,
              fran.state,
              fran.postcode,
            ]
              .filter(Boolean)
              .join(", "),
          });
        } else {
          setRetailer({ _id: retailerId, name: "" });
        }
      } catch (e) {
        console.error("Error fetching retailer details", e);
        if (!cancelled) setRetailer({ _id: retailerId, name: "" });
      }
    };
    fetchRetailer();
    return () => {
      cancelled = true;
    };
  }, [retailerId, fetchPaylaterDetails]);

  // OTP config + delivery routes decide the steps of the flow
  useEffect(() => {
    let mounted = true;
    const fetchConfig = async () => {
      setLoadingConfig(true);
      let otpEnabled = true;
      if (!assisted) {
        try {
          const settingsResp = await FranchiseService.getFranchiseSettings({
            configType: "B2B_ORDER_CONFIG",
          });
          const configValue = settingsResp?.data?.data?.configValue;
          otpEnabled = configValue?.enableOtpForPOS === true;
        } catch {
          otpEnabled = false;
        }
      }

      const resp = await DeliveryRoutesService.getRoutesList({
        page: 1,
        limit: 1,
        filter: {
          isActive: true,
        },
      });

      const nextSteps: StepData[] = [{ key: "payment", title: "Payment" }];
      if (resp?.statusCode === 200 && (resp.data.data || []).length > 0) {
        nextSteps.push({ key: "delivery", title: "Delivery" });
      }
      nextSteps.push({ key: "verification", title: "Create Order" });

      if (!mounted) return;
      setEnableOtpForPOS(otpEnabled);
      setSteps(nextSteps);
      setLoadingConfig(false);
    };
    fetchConfig();
    return () => {
      mounted = false;
    };
  }, [assisted]);

  // Seller's own prepaid payment options (retailer pays the logged-in seller)
  useEffect(() => {
    const fetchPrepaidOptions = async () => {
      try {
        const fid = AuthService.getLoggedInUserId();
        const cfgRes: any = await FranchiseService.getActiveOrderConfigs([fid]);
        const cfgs = cfgRes?.data?.data || [];
        const cfg = cfgs.find((c: any) => c?.franchiseInfo?.id === fid) || {};
        setPrepaidOptions(cfg?.paymentMethodConfig || []);
      } catch (e) {
        console.error("Error fetching prepaid payment options", e);
      }
    };
    fetchPrepaidOptions();
  }, []);

  const hasDeliveryStep = steps.some((s) => s.key === "delivery");

  const openPrepaidModal = () => {
    if (prepaidOptions.length === 0) {
      appToast.show({
        msg: "No prepaid payment options found",
        color: "error",
      });
      return;
    }
    setShowPrepaidModal(true);
  };

  const handleMethodSelect = (method: "COD" | "PREPAID" | "PAYLATER") => {
    if (method === "PREPAID") {
      // Capture payment details first; selection happens on modal submit
      openPrepaidModal();
      return;
    }
    setSelectedMethod(method);
  };

  const handlePrepaidModalCallback = (a: { action: string; data: any }) => {
    if (a.action === "close") {
      setShowPrepaidModal(false);
      return;
    }

    if (a.action === "submit") {
      setShowPrepaidModal(false);
      const formData = a.data || {};
      const paymentMethod = formData.paymentMethod || {};

      const methodId =
        paymentMethod.refCode ||
        paymentMethod.value ||
        paymentMethod.paymentMethod ||
        paymentMethod.displayName ||
        "";
      const methodLabel =
        paymentMethod.displayName ||
        paymentMethod.merchantName ||
        paymentMethod.name ||
        paymentMethod.paymentMethod ||
        "PREPAID";

      setPrepaidPayment({
        type: methodLabel,
        amount: Number(formData.amount) || orderAmount || 0,
        referenceNumber: formData.transactionId || "",
        proof: (formData.images || []).map((i: any) => i.id || i) || [],
        remarks: formData.remarks || "",
        paidVia: paymentMethod.paymentMethod || methodLabel,
        methodId,
      });
      setSelectedMethod("PREPAID");
    }
  };

  const buildOrderParams = () => {
    const params: Record<string, any> = {};
    if (selectedMethod) {
      params.paymentMethod = selectedMethod;
    }
    if (selectedMethod === "PREPAID" && prepaidPayment) {
      params.remarks = prepaidPayment.remarks || "";
      params.paymentMode = [
        {
          type: "UPI",
          paidVia: prepaidPayment.paidVia || prepaidPayment.type || "",
          refNo: prepaidPayment.methodId || "",
          paymentTransactionId: prepaidPayment.referenceNumber || "",
          proof: prepaidPayment.proof || [],
          amount: Number(prepaidPayment.amount) || 0,
          paidAmount: Number(prepaidPayment.amount) || 0,
          change: 0,
        },
      ];
    }
    if (selectedRoute?.deliveryDate || selectedRoute?._id) {
      params.routeInfo = {
        deliveryDate: format(selectedRoute.deliveryDate, "yyyy-MM-dd"),
        routeId: selectedRoute._id,
      };
    }
    return params;
  };

  const handleOrderComplete = (data: any) => {
    const orderResp = data?.data || data || {};
    setOrderPlacedModal({
      show: true,
      orderId: orderResp?.order?.orderId || null,
      orderRefNo: orderResp?.order?.orderRefNo || null,
      reserveOrderId: orderResp?.reserveOrder?.orderId || null,
      reserveOrderRefNo: orderResp?.reserveOrder?.orderRefNo || null,
    });
  };

  const handleProceedClick = async () => {
    setIsProceeding(true);
    if (!cartId) {
      appToast.show({ msg: "Cart ID not found", color: "error" });
      setIsProceeding(false);
      return;
    }

    try {
      const params = buildOrderParams();

      if (!enableOtpForPOS) {
        const resp = await CartService.verifyOtp(cartId, params);
        if (resp?.statusCode === 200) {
          appToast.show({ msg: "Order placed successfully", color: "success" });
          handleOrderComplete(resp.data);
        } else {
          appToast.show({
            msg: resp?.data?.message || "Failed to place order",
            color: "error",
          });
        }
      } else {
        const resp = await CartService.generateOtp(cartId, {});
        if (resp?.statusCode === 200) {
          appToast.show({ msg: "OTP sent successfully", color: "success" });
          setCurrentStep("verification");
        } else {
          appToast.show({
            msg: resp?.data?.message || "Failed to generate OTP",
            color: "error",
          });
        }
      }
    } catch (e) {
      console.error("Error placing order", e);
      appToast.show({ msg: "Failed to place order", color: "error" });
    }
    setIsProceeding(false);
  };

  const handleOtpCallback = useCallback(
    (args: { action: string; data?: any }) => {
      if (args.action === "back") {
        if (args.data === "review") setCurrentStep("payment");
      } else if (args.action === "complete") {
        handleOrderComplete(args.data);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  const shareCart = async () => {
    const link = `${window.location.origin}/products/cart/shared/${cartId}`;
    const storeName = retailer?.name || "Store";
    const sellerName = AuthService.getLoggedInUser()?.name || "Seller";

    const message = `Hello ${storeName},Your B2B order is ready for review. Please use the link below to confirm your order by sharing the OTP with your StoreKing Seller, ${sellerName}. This will authorise us to place the order on your behalf\n${link}`;

    const waUrl = CommonService.prepareWhatsappMessage(message, "");
    CommonService.windowOpenHandler(waUrl, () => {});
  };

  const handleNextClick = () => {
    if (currentStep === "payment") {
      if (hasDeliveryStep) {
        setCurrentStep("delivery");
      } else {
        handleProceedClick();
      }
    } else if (currentStep === "delivery") {
      handleProceedClick();
    }
  };

  const handleBackClick = () => {
    if (currentStep === "delivery") {
      setCurrentStep("payment");
    }
  };

  const handleOrderPlacedCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    setOrderPlacedModal({
      show: false,
      orderId: null,
      orderRefNo: null,
      reserveOrderId: null,
      reserveOrderRefNo: null,
    });
    if (payload.action === "view-order") {
      appNav.to(`/dashboard/orders/view/${payload.data.orderId}`);
    } else {
      backToBilling();
    }
  };

  const nextDisabled =
    (selectedMethod === "PAYLATER" && orderAmount > paylaterBalance) ||
    (selectedMethod === "PREPAID" && !prepaidPayment);

  const stepIndex = steps.findIndex((s) => s.key === currentStep);
  const safeStepIndex = stepIndex < 0 ? 0 : stepIndex;
  const progressPct = Math.max(
    0,
    Math.min(100, ((safeStepIndex + 1) / Math.max(steps.length, 1)) * 100),
  );
  const nextStepTitle = steps[safeStepIndex + 1]?.title;

  const stepHelper: Record<string, string> = {
    payment: t(
      "b2bCheckout.helper.payment",
      "Review the order and choose how the retailer will pay.",
    ),
    delivery: t(
      "b2bCheckout.helper.delivery",
      "Choose the delivery route for this order.",
    ),
    verification: enableOtpForPOS
      ? t(
          "b2bCheckout.helper.verification",
          "Enter the OTP sent to the retailer's mobile to confirm the order.",
        )
      : t("b2bCheckout.helper.createOrder", "Confirm and create the order."),
  };

  const renderRetailerCard = () =>
    retailer ? (
      <div className="tw:rounded-xl tw:border tw:border-primary/20 tw:bg-primary/5 tw:overflow-hidden">
        <div className="tw:px-3 tw:py-1.5 tw:bg-primary/10 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-primary">
          {t("b2bCheckout.orderingFor", "Ordering for")}
        </div>
        <div className="tw:p-3 tw:flex tw:items-start tw:gap-3">
          <span className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-full tw:bg-primary tw:text-white tw:shrink-0">
            <Building2 size={20} />
          </span>
          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
              <div className="tw:font-semibold tw:text-sm tw:text-gray-900 tw:truncate">
                {retailer.name || "-"}
              </div>
              <div className="tw:text-[11px] tw:font-medium tw:text-gray-500 tw:shrink-0">
                ID: {retailer.franchiseId || "-"}
              </div>
            </div>
            <div className="tw:text-xs tw:text-gray-700 tw:mt-1 tw:flex tw:items-center tw:gap-1.5">
              <Phone size={12} className="tw:text-gray-400 tw:shrink-0" />
              {retailer.mobile || "-"}
            </div>
            {retailer.formatAddress && (
              <div className="tw:text-xs tw:text-gray-700 tw:mt-1 tw:flex tw:items-start tw:gap-1.5">
                <MapPin
                  size={12}
                  className="tw:text-gray-400 tw:shrink-0 tw:mt-0.5"
                />
                <span>{retailer.formatAddress}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null;

  const renderPaymentStep = () => (
    <div className="tw:space-y-4">
      {/* Retailer + summary shown inline on mobile; desktop has the sidebar */}
      <div className="tw:md:hidden tw:space-y-4">
        {renderRetailerCard()}
        <Summary summary={summary} totalItems={totalItems} />
      </div>

      {fetchingPaylater ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:py-6">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:space-y-3">
          <div className="tw:flex tw:items-center tw:justify-between">
            <div className="tw:text-xs tw:font-bold tw:text-gray-500 tw:uppercase tw:tracking-wider">
              Payment Mode
            </div>
          </div>

          <div className="tw:flex tw:gap-2">
            {allowedPayments.cod && (
              <button
                onClick={() => handleMethodSelect("COD")}
                className={`tw:flex-1 tw:md:flex-none tw:md:min-w-32 tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-2.5 tw:px-4 tw:rounded-lg tw:border tw:cursor-pointer tw:transition-all ${
                  selectedMethod === "COD"
                    ? "tw:bg-blue-50 tw:border-blue-500 tw:text-blue-700 tw:ring-1 tw:ring-blue-500"
                    : "tw:bg-white tw:border-gray-200 tw:text-gray-600 tw:hover:bg-gray-50"
                }`}
              >
                <IndianRupee size={16} />
                <span className="tw:text-sm tw:font-semibold">COD</span>
              </button>
            )}
            {allowedPayments.prepaid && (
              <button
                onClick={() => handleMethodSelect("PREPAID")}
                className={`tw:flex-1 tw:md:flex-none tw:md:min-w-32 tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-2.5 tw:px-4 tw:rounded-lg tw:border tw:cursor-pointer tw:transition-all ${
                  selectedMethod === "PREPAID"
                    ? "tw:bg-blue-50 tw:border-blue-500 tw:text-blue-700 tw:ring-1 tw:ring-blue-500"
                    : "tw:bg-white tw:border-gray-200 tw:text-gray-600 tw:hover:bg-gray-50"
                }`}
              >
                <Wallet size={16} />
                <span className="tw:text-sm tw:font-semibold">Prepaid</span>
              </button>
            )}
            {paylaterEligible && (
              <button
                onClick={() => handleMethodSelect("PAYLATER")}
                className={`tw:flex-1 tw:md:flex-none tw:md:min-w-32 tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-2.5 tw:px-4 tw:rounded-lg tw:border tw:cursor-pointer tw:transition-all ${
                  selectedMethod === "PAYLATER"
                    ? "tw:bg-blue-50 tw:border-blue-500 tw:text-blue-700 tw:ring-1 tw:ring-blue-500"
                    : "tw:bg-white tw:border-gray-200 tw:text-gray-600 tw:hover:bg-gray-50"
                }`}
              >
                <Wallet size={16} />
                <span className="tw:text-sm tw:font-semibold">Paylater</span>
              </button>
            )}
          </div>

          {selectedMethod === "PREPAID" && !prepaidPayment && (
            <div className="tw:p-2.5 tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-md tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
              <div className="tw:text-xs tw:text-amber-700 tw:font-medium">
                Add the prepaid payment details to continue.
              </div>
              <button
                type="button"
                onClick={openPrepaidModal}
                className="tw:ml-auto tw:text-xs tw:font-semibold tw:text-amber-700 tw:underline tw:cursor-pointer"
              >
                Add details
              </button>
            </div>
          )}

          {selectedMethod === "PREPAID" && prepaidPayment && (
            <div className="tw:p-1.5 tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-md tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
              <div className="tw:text-xs tw:font-semibold tw:text-blue-700 tw:bg-blue-100 tw:px-1.5 tw:py-0.5 tw:rounded">
                {prepaidPayment.type || "Prepaid"}
              </div>
              <div className="tw:text-xs tw:text-blue-600 tw:font-medium">
                <Amount value={prepaidPayment.amount} />
              </div>
              {prepaidPayment.referenceNumber && (
                <div className="tw:text-xs tw:text-gray-500">
                  Ref: {prepaidPayment.referenceNumber}
                </div>
              )}
              {prepaidPayment.proof?.length > 0 && (
                <div className="tw:text-xs tw:text-gray-500">
                  Proof: {prepaidPayment.proof.length} file
                  {prepaidPayment.proof.length > 1 ? "s" : ""}
                </div>
              )}
              <button
                type="button"
                onClick={openPrepaidModal}
                className="tw:ml-auto tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-blue-600 hover:tw:text-blue-800 tw:cursor-pointer"
              >
                <Pencil size={12} />
                Edit
              </button>
            </div>
          )}

          {selectedMethod === "PAYLATER" && (
            <div className="tw:p-3 tw:rounded-lg tw:bg-blue-50/50 tw:border tw:border-blue-100 tw:animate-in tw:fade-in tw:duration-300">
              <div className="tw:flex tw:justify-between tw:items-center">
                <div className="tw:text-[10px] tw:text-blue-700 tw:font-semibold tw:uppercase tw:tracking-tight">
                  Paylater Limit
                </div>
                <div className="tw:text-sm tw:font-bold tw:text-blue-900">
                  <Amount value={paylaterBalance} />
                </div>
              </div>
              <div className="tw:text-[10px] tw:text-blue-600 tw:mt-1 tw:flex tw:items-center tw:gap-1">
                <div className="tw:w-1 tw:h-1 tw:bg-blue-400 tw:rounded-full" />
                Amount will be debited from this limit.
              </div>

              {orderAmount > paylaterBalance && (
                <div className="tw:mt-2 tw:p-2 tw:rounded tw:bg-red-50 tw:text-[10px] tw:text-red-600 tw:font-medium tw:border tw:border-red-100">
                  Insufficient limit to place this order via Paylater.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!assisted && (
        <div className="tw:text-center">
          <AppButton onClick={shareCart} size="small" fill="clear">
            <ImgRender src="whatsapp-logo.png" className="tw:w-6 tw:h-6" />
            <span>Share Cart via WhatsApp</span>
          </AppButton>
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "delivery":
        return (
          <DeliverRoute
            franchiseId={retailer?._id ?? ""}
            callback={(args: { action: string; data?: any }) => {
              if (args.action === "fetched" || args.action === "changed") {
                setSelectedRoute(args.data ?? null);
              }
            }}
          />
        );
      case "verification":
        return (
          <OtpVerification
            mobile={retailer?.mobile ?? ""}
            retailerName={retailer?.name ?? ""}
            cartId={cartId}
            totalItems={totalItems}
            totalValue={orderAmount}
            paymentMethod={
              selectedMethod !== "COD" ? selectedMethod : undefined
            }
            extraParams={
              selectedMethod === "PREPAID" && prepaidPayment
                ? {
                    remarks: prepaidPayment.remarks || "",
                    paymentMode: buildOrderParams().paymentMode,
                  }
                : undefined
            }
            callback={handleOtpCallback}
            routeInfo={selectedRoute}
          />
        );
      case "payment":
      default:
        return renderPaymentStep();
    }
  };

  return (
    <>
      <AppHeader
        title={
          assisted
            ? t("header.assistedOrder")
            : t("b2bCheckout.title", "B2B Checkout")
        }
      />
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
                  onClick={() => backToBilling()}
                  className="tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-medium tw:text-gray-700 tw:cursor-pointer tw:px-2.5 tw:py-1 tw:rounded-md tw:hover:bg-gray-100 tw:transition-colors"
                >
                  <ArrowLeft size={16} />
                  {t("backToCart", "Back to cart")}
                </button>
              </div>

              <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:gap-5">
                {/* Main content */}
                <div className="tw:flex-1 tw:min-w-0">
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
                          {Math.max(steps.length, 1)}
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
                      {loadingConfig ? (
                        <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
                          <AppSpinner />
                        </div>
                      ) : (
                        renderCurrentStep()
                      )}
                    </div>

                    {/* Step footer actions */}
                    {!loadingConfig &&
                      (currentStep === "payment" ||
                        currentStep === "delivery") && (
                        <div className="tw:bg-gray-50/50 tw:border-t tw:border-gray-100 tw:px-4 tw:md:px-5 tw:py-3">
                          <div className="tw:flex tw:justify-between tw:items-center">
                            <div>
                              {currentStep !== "payment" && (
                                <AppButton
                                  onClick={handleBackClick}
                                  isLoading={isProceeding}
                                  fill="outline"
                                  color="light"
                                >
                                  <ArrowLeft size={16} /> Back
                                </AppButton>
                              )}
                            </div>

                            <div>
                              <AppButton
                                color="primary"
                                onClick={handleNextClick}
                                isLoading={isProceeding}
                                disabled={nextDisabled}
                              >
                                {currentStep === "delivery" ||
                                (!hasDeliveryStep && currentStep === "payment")
                                  ? !enableOtpForPOS
                                    ? "Create Order"
                                    : "Send OTP"
                                  : "Next"}{" "}
                                <ArrowRight size={16} />
                              </AppButton>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Desktop sidebar: retailer + order summary */}
                <div className="tw:hidden tw:md:block tw:md:w-1/3 tw:shrink-0">
                  <div className="tw:sticky tw:top-20 tw:space-y-3">
                    {renderRetailerCard()}
                    <Summary summary={summary} totalItems={totalItems} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PrepaidInfoModal
        show={showPrepaidModal}
        clientOnly
        optionalProof
        paymentOptions={prepaidOptions as any}
        orderAmount={orderAmount}
        callback={handlePrepaidModalCallback}
        initialValues={
          prepaidPayment
            ? {
                transactionId: prepaidPayment.referenceNumber || "",
                remarks: prepaidPayment.remarks || "",
                images: (prepaidPayment.proof || []).map((id: any) => ({
                  id,
                })),
                amount: prepaidPayment.amount,
                paymentMethodId: prepaidPayment.methodId || "",
              }
            : undefined
        }
      />

      <OrderPlacedModal
        show={orderPlacedModal.show}
        orderId={orderPlacedModal.orderId ?? undefined}
        orderRefNo={orderPlacedModal.orderRefNo ?? undefined}
        reserveOrderId={orderPlacedModal.reserveOrderId ?? undefined}
        reserveOrderRefNo={orderPlacedModal.reserveOrderRefNo ?? undefined}
        isB2b={true}
        isAssisted={assisted}
        callback={handleOrderPlacedCallback}
      />

      <BusyLoader show={loadingCart || isProceeding} />
    </>
  );
};

export default B2bCheckoutPage;

export const meta = () => {
  return [
    { title: "POS B2B Checkout" },
    { name: "description", content: "POS B2B Checkout" },
  ];
};
