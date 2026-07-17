import {
  ArrowLeft,
  ArrowRight,
  Building2,
  IndianRupee,
  Phone,
  Wallet,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppSteps, { type StepData } from "~/components/core/steps/AppSteps";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import CommonService from "~/services/CommonService";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import FranchiseService from "~/services/FranchiseService";
import PaylaterService from "~/services/PaylaterService";
import DeliverRoute from "./components/DeliverRoute";
import OtpVerification from "./components/OtpVerification";
import Summary from "./components/Summary";
import { format } from "date-fns";

interface B2bCheckoutModalProps {
  show: boolean;
  // data contains { summary, totalItems, retailer }
  data?: { summary?: any; totalItems?: number; retailer?: any } | null;
  callback: (params: { action: string; data?: any }) => void;
  cartId?: string;
  assisted?: boolean;
}

const B2bCheckoutModal: React.FC<B2bCheckoutModalProps> = ({
  show,
  data,
  callback,
  cartId,
  assisted,
}) => {
  const { t } = useTranslation(["posbilling"]);
  const appToast = useAppToast();

  const [display, setDisplay] = useState<
    "summary" | "delivery" | "loading" | "verification"
  >("loading");
  const [isProceeding, setIsProceeding] = useState(false);
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

  const [steps, setSteps] = useState<StepData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [enableOtpForPOS, setEnableOtpForPOS] = useState(false);

  const fetchPaylaterDetails = useCallback(async () => {
    const retailer = data?.retailer;
    if (!retailer?._id) {
      setFetchingPaylater(false);
      return;
    }

    setFetchingPaylater(true);
    try {
      const [paylaterResp, configResp] = await Promise.all([
        PaylaterService.validateEligibility({
          userInfo: {
            id: retailer._id,
            type: "franchise",
          },
          franchiseInfo: {
            id: AuthService.getLoggedInUserId(),
          },
        }),
        FranchiseService.getSpecificUserConfig(
          retailer._id,
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

      // Default selection logic
      if (paylaterResp?.statusCode === 200 && eligible && available > 0) {
        setSelectedMethod("PAYLATER");
      } else if (config.prepaid) {
        setSelectedMethod("PREPAID");
      } else {
        setSelectedMethod("COD");
      }
    } catch (e) {
      console.error("Error checking paylater eligibility:", e);
      setPaylaterEligible(false);
    } finally {
      setFetchingPaylater(false);
    }
  }, [data?.retailer?._id]);

  useEffect(() => {
    if (show) {
      setDisplay("summary");
      // Fetch paylater details when modal opens
      setDisplay("loading");
      setSelectedMethod("COD");
      setSelectedRoute(null);

      fetchPaylaterDetails();

      const fetchData = async () => {
        if (!assisted) {
          try {
            const settingsResp = await FranchiseService.getFranchiseSettings({
              configType: "B2B_ORDER_CONFIG",
            });
            const configValue = settingsResp?.data?.data?.configValue;
            setEnableOtpForPOS(configValue?.enableOtpForPOS === true);
          } catch {
            setEnableOtpForPOS(false);
          }
        } else {
          setEnableOtpForPOS(true);
        }

        const resp = await DeliveryRoutesService.getRoutesList({
          page: 1,
          limit: 1,
          filter: {
            isActive: true,
          },
        });

        let steps: StepData[] = [{ key: "payment", title: "Payment" }];

        if (resp?.statusCode === 200) {
          const data = resp.data.data;
          if (data.length > 0) {
            steps.push({
              key: "delivery",
              title: "Delivery",
            });
          }
        }

        steps.push({ key: "confirmation", title: "Create Order" });
        setSteps(steps);
        setDisplay("summary");
      };
      fetchData();
    }
  }, [show, fetchPaylaterDetails, assisted]);

  const handleClose = () => callback({ action: "close" });

  const handleProceedClick = async () => {
    setIsProceeding(true);
    const id = cartId;
    if (!id) {
      appToast.show({ msg: "Cart ID not found", color: "error" });
      setIsProceeding(false);
      return;
    }

    try {
      const params: Record<string, any> = {};
      if (selectedMethod) {
        params.paymentMethod = selectedMethod;
      }
      if (selectedRoute?.deliveryDate || selectedRoute?._id) {
        params.routeInfo = {
          deliveryDate: format(selectedRoute.deliveryDate, "yyyy-MM-dd"),
          routeId: selectedRoute._id,
        };
      }

      if (!enableOtpForPOS) {
        const resp = await CartService.verifyOtp(id, params);
        if (resp?.statusCode === 200) {
          appToast.show({ msg: "Order placed successfully", color: "success" });
          callback({ action: "complete", data: resp.data });
        } else {
          appToast.show({
            msg: resp?.data?.message || "Failed to place order",
            color: "error",
          });
        }
      } else {
        const resp = await CartService.generateOtp(id, {});
        if (resp?.statusCode === 200) {
          appToast.show({ msg: "OTP sent successfully", color: "success" });
          setDisplay("verification");
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
        if (args.data === "review") setDisplay("summary");
      } else if (args.action === "complete") {
        // forward verification success to parent as complete
        callback({ action: "complete", data: args.data });
      }
    },
    [callback],
  );

  const shareCart = async () => {
    const link = `${window.location.origin}/products/cart/shared/${cartId}`;
    const storeName = data?.retailer?.name || "Store";
    const sellerName = AuthService.getLoggedInUser()?.name || "Seller";

    const message = `Hello ${storeName},Your B2B order is ready for review. Please use the link below to confirm your order by sharing the OTP with your StoreKing Seller, ${sellerName}. This will authorise us to place the order on your behalf\n${link}`;

    const waUrl = CommonService.prepareWhatsappMessage(message, "");
    CommonService.windowOpenHandler(waUrl, () => {});
  };

  const hasDeliveryStep = steps.some((s) => s.key === "delivery");

  const handleNextClick = () => {
    if (display === "summary") {
      if (hasDeliveryStep) {
        setDisplay("delivery");
      } else {
        handleProceedClick();
      }
    } else if (display === "delivery") {
      handleProceedClick();
    }
  };

  const handleBackClick = () => {
    if (display === "delivery") {
      setDisplay("summary");
    } else if (display === "verification") {
      setDisplay("delivery");
    }
  };

  const rawTotal = data?.summary?.finalPrice ?? data?.summary?.subtotal ?? 0;
  const orderAmount = data?.summary?.orderAmount ?? Math.round(rawTotal);
  const canUsePaylater = paylaterEligible && orderAmount <= paylaterBalance;

  return (
    <AppModal
      show={show}
      callback={callback}
      backdropDismiss={false}
      className="tw:md:h-[95vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div>
          <h2 className="tw:text-xl tw:font-bold tw:text-gray-900">
            B2B Checkout
          </h2>
          <p className="tw:text-gray-600 tw:text-sm">
            {data?.retailer?.name
              ? `Confirm order for ${data.retailer.name}`
              : "Confirm order via OTP"}
          </p>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:md:h-[95vh]">
        <div className="tw:space-y-4 tw:py-2">
          <div className="tw:flex tw:justify-center tw:items-center">
            <AppSteps
              steps={steps}
              activeKey={display}
              borderMinWidth={30}
              className="tw:w-auto tw:mb-0"
            />
          </div>

          {display === "loading" ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:py-4">
              <AppSpinner />
            </div>
          ) : display === "summary" ? (
            <>
              {/* Retailer info: show when available */}
              {data?.retailer && (
                <div className="tw:border tw:rounded tw:p-3 tw:bg-gray-50">
                  <div className="tw:flex tw:justify-between tw:items-start">
                    <div>
                      <div className="tw:font-semibold tw:text-sm tw:flex tw:items-center tw:gap-1">
                        <Building2 size={18} className="tw:text-gray-800" />
                        {data.retailer.name}
                      </div>
                      <div className="tw:text-xs tw:text-gray-600 tw:mt-1">
                        ID: {data.retailer.franchiseId || "-"}
                      </div>
                    </div>
                    <div className="tw:text-right tw:text-xs tw:text-gray-600 tw:flex tw:items-center tw:gap-1">
                      <Phone size={12} />
                      <div>{data.retailer.mobile || "-"}</div>
                    </div>
                  </div>

                  {data.retailer.formatAddress && (
                    <div className="tw:text-xs tw:text-gray-600">
                      {data.retailer.formatAddress}
                    </div>
                  )}
                </div>
              )}

              <Summary summary={data?.summary} totalItems={data?.totalItems} />

              {/* ApplyCoupon - commented out as per requirements */}
              {/* <ApplyCoupon /> */}

              {/* Payment Mode chips */}
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
                        onClick={() => setSelectedMethod("COD")}
                        className={`tw:flex-1 tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-2.5 tw:px-3 tw:rounded-lg tw:border tw:transition-all ${
                          selectedMethod === "COD"
                            ? "tw:bg-blue-50 tw:border-blue-500 tw:text-blue-700 tw:ring-1 tw:ring-blue-500"
                            : "tw:bg-white tw:border-gray-200 tw:text-gray-600 hover:tw:bg-gray-50"
                        }`}
                      >
                        <IndianRupee size={16} />
                        <span className="tw:text-sm tw:font-semibold">COD</span>
                      </button>
                    )}
                    {allowedPayments.prepaid && (
                      <button
                        onClick={() => setSelectedMethod("PREPAID")}
                        className={`tw:flex-1 tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-2.5 tw:px-3 tw:rounded-lg tw:border tw:transition-all ${
                          selectedMethod === "PREPAID"
                            ? "tw:bg-blue-50 tw:border-blue-500 tw:text-blue-700 tw:ring-1 tw:ring-blue-500"
                            : "tw:bg-white tw:border-gray-200 tw:text-gray-600 hover:tw:bg-gray-50"
                        }`}
                      >
                        <Wallet size={16} />
                        <span className="tw:text-sm tw:font-semibold">
                          Prepaid
                        </span>
                      </button>
                    )}
                    {paylaterEligible && (
                      <button
                        onClick={() => setSelectedMethod("PAYLATER")}
                        className={`tw:flex-1 tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-2.5 tw:px-3 tw:rounded-lg tw:border tw:transition-all ${
                          selectedMethod === "PAYLATER"
                            ? "tw:bg-blue-50 tw:border-blue-500 tw:text-blue-700 tw:ring-1 tw:ring-blue-500"
                            : "tw:bg-white tw:border-gray-200 tw:text-gray-600 hover:tw:bg-gray-50"
                        }`}
                      >
                        <Wallet size={16} />
                        <span className="tw:text-sm tw:font-semibold">
                          Paylater
                        </span>
                      </button>
                    )}
                  </div>

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

              {/* {!fetchingPaylater && (
                <AppButton
                  color="primary"
                  onClick={handleProceedClick}
                  className="tw:w-full tw:font-bold tw:mt-4"
                  isLoading={isProceeding}
                  disabled={
                    selectedMethod === "PREPAID" &&
                    orderAmount > paylaterBalance
                  }
                >
                  Proceed to get confirmation <ArrowRight size={16} />
                </AppButton>
              )} */}
              {!assisted && (
                <div className="tw:text-center">
                  <AppButton onClick={shareCart} size="small" fill="clear">
                    <ImgRender
                      src="whatsapp-logo.png"
                      className="tw:w-6 tw:h-6"
                    />
                    <span>Share Cart via WhatsApp</span>
                  </AppButton>
                </div>
              )}
            </>
          ) : display === "delivery" ? (
            <DeliverRoute
              franchiseId={data?.retailer?._id ?? ""}
              callback={(args: { action: string; data?: any }) => {
                if (args.action === "fetched" || args.action === "changed") {
                  setSelectedRoute(args.data ?? null);
                }
              }}
            />
          ) : (
            <OtpVerification
              mobile={data?.retailer?.mobile ?? ""}
              retailerName={data?.retailer?.name ?? ""}
              cartId={cartId}
              totalItems={data?.totalItems ?? data?.summary?.totalItems ?? 0}
              totalValue={orderAmount}
              paymentMethod={
                selectedMethod !== "COD" ? selectedMethod : undefined
              }
              callback={handleOtpCallback}
              routeInfo={selectedRoute}
            />
          )}
        </div>
      </AppModal.Content>
      {display == "summary" || display == "delivery" ? (
        <AppModal.Footer className="tw:bg-gray-50/50 tw:border-t tw:border-gray-100 tw:p-3 tw:w-full">
          <div className="tw:flex tw:justify-between tw:items-center tw:py-4 tw:w-full">
            <div>
              {display !== "summary" && (
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
              >
                {display === "delivery" ||
                (!hasDeliveryStep && display === "summary")
                  ? !enableOtpForPOS
                    ? "Create Order"
                    : "Send OTP"
                  : "Next"}{" "}
                <ArrowRight size={16} />
              </AppButton>
            </div>
          </div>
        </AppModal.Footer>
      ) : null}
    </AppModal>
  );
};

export default B2bCheckoutModal;
