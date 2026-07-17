import { CreditCard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import FranchiseService from "~/services/FranchiseService";
import MiscService from "~/services/MiscService";
import PaymentService from "~/services/PaymentService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import ApplyCoupon from "./components/ApplyCoupon";
import CardPayment from "./components/CardPayment";
import PaymentCard from "./components/PaymentCard";
import RetailerDetails from "./components/RetailerDetails";
import {
  getCardPaymentParams,
  getNetBankingParams,
  getUpiParams,
  validateCardPayment,
} from "./helpers";

declare const window: any;

interface ParentDetails {
  name?: string;
  address?: {
    full_address?: string;
  };
  OwnerMobileNo?: string;
  _id?: string;
}

interface CouponApplied {
  code?: string;
  rewardedAmount?: number;
  applied?: boolean;
}

const Payment = () => {
  const { replace } = useAppNav();
  const [selectedPaymentMode, setSelectedPaymentMode] = useState("");
  const retailerDetailsRef = useRef<HTMLDivElement | null>(null);
  const [parentDetails, setParentDetails] = useState<ParentDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [advanceBalance, setAdvanceBalance] = useState<number | null>(null);
  const [codLimit, setCodLimit] = useState<number>(0);
  const [busyLoader, setBusyLoader] = useState({ show: false, msg: "" });
  const [showRequestOrderModal, setShowRequestOrderModal] = useState(false);
  const [couponApplied, setCouponApplied] = useState<CouponApplied | null>(
    null,
  );

  const loggedInUser = AuthService.getLoggedInUser();
  const hasSecondaryWallet = FranchiseService.hasSecondaryWallet();
  const hasCodLimit = FranchiseService.hasCodLimitEnabled();
  const hideBalancePayments = PaymentService.shouldHideBalanceBasedPayments();
  const hasMpsOrder = PaymentService.hasMpsOrder();
  const showRequestOrder = PaymentService.shouldShowRequestOrder(
    parentDetails,
    loggedInUser,
    hasCodLimit,
  );

  const enabledPaymentModes = PaymentService.getEnabledPaymentModes();

  const basePayableAmount = PaymentService.tempData?.amount || 0;
  const beforeTaxAmount =
    PaymentService.tempData?.physicalOrder?.summary?.totalAmountBeforeTax || 0;

  // If a coupon is applied, reduce the payable amount by the rewardedAmount.
  // Ensure payable never goes below zero.
  const payableAmount =
    couponApplied && couponApplied.applied
      ? Math.max(0, basePayableAmount - (couponApplied.rewardedAmount || 0))
      : basePayableAmount;

  const { show: showToast } = useAppToast();

  const [cardPayment, setCardPayment] = useState<any>({
    amount: 0,
    charge: 0,
    displayCharge: 0,
    total: 0,
    paymentType: "",
    cardNumber: "",
    cardHolderName: "",
  });

  useEffect(() => {
    if (!PaymentService.tempData) {
      replace("/products/cart");
    }
  }, []);

  useEffect(() => {
    if (!PaymentService.tempData) return; // Block API calls if no tempData

    const fetchAdvanceBalance = async () => {
      setLoading(true);
      try {
        const accountId = AuthService.getUserAccountId();
        if (accountId) {
          const balanceResponse = await FranchiseService.getBalance(
            AuthService.getLoggedInUserId(true) || "",
          );

          setAdvanceBalance(balanceResponse.balance);
          setCodLimit(balanceResponse.creditWallet || 0); // Fetch COD limit dynamically
        }
      } catch (error) {
        console.error("Error fetching advance balance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvanceBalance();

    const fetchParentDetails = async () => {
      // setLoading(true);
      // try {
      //   const u = AuthService.getLoggedInUser();
      //   let sf = u?.sk_franchise_details?.linkedRmfSellerId;
      //   const sellerResp = await SellerService.getSellerDetails(sf);
      //   if (sellerResp.statusCode == 200) {
      //     const id = sellerResp.data?.[0]?.basicDetails?.linkedFranchiseId;
      //     const franchiseResp = await FranchiseService.getFranchise(id);
      //     setParentDetails(franchiseResp.data);
      //   } else {
      //     setParentDetails(null);
      //   }
      // } catch (error) {
      //   console.error("Error fetching parent details:", error);
      // } finally {
      //   setLoading(false);
      // }
    };

    // fetchParentDetails();
  }, []);

  useEffect(() => {
    if (selectedPaymentMode === "request" && retailerDetailsRef.current) {
      retailerDetailsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedPaymentMode]);

  // Auto-select the first available payment option when page loads
  useEffect(() => {
    if (loading || !PaymentService.tempData) return;

    // Only auto-select if no payment mode is currently selected
    if (selectedPaymentMode) return;

    // Priority order for auto-selection:
    // 1. Advance Balance (if available and sufficient)
    // 2. COD Limit (if available and sufficient)
    // 3. Card Payment (if enabled)
    // 4. Request Order (if available)

    if (!hideBalancePayments && (advanceBalance || 0) >= payableAmount) {
      setSelectedPaymentMode("advance");
    } else if (
      !hideBalancePayments &&
      hasCodLimit &&
      codLimit >= payableAmount
    ) {
      setSelectedPaymentMode("cod");
    } else if (
      (enabledPaymentModes.showCreditCardPayment ||
        enabledPaymentModes.showDebitCardPayment) &&
      getModuleType() !== "physicals"
    ) {
      setSelectedPaymentMode("card");
    } else if (showRequestOrder && hasMpsOrder) {
      setSelectedPaymentMode("request");
    }
  }, [
    loading,
    advanceBalance,
    codLimit,
    hideBalancePayments,
    hasCodLimit,
    enabledPaymentModes,
    showRequestOrder,
    hasMpsOrder,
    payableAmount,
    selectedPaymentMode,
  ]);

  const handleRequestOrderClick = () => {
    setSelectedPaymentMode("request");
  };

  const handleAdvanceClick = () => {
    if ((advanceBalance || 0) >= payableAmount) {
      setSelectedPaymentMode("advance");
    }
  };

  const handleCodClick = () => {
    if (codLimit >= payableAmount) {
      setSelectedPaymentMode("cod");
    }
  };

  const handleRequestClick = () => {
    setSelectedPaymentMode("request");
  };

  const handleMakePayment = async () => {
    try {
      // Card Payment
      if (selectedPaymentMode === "card") {
        const validateCard = validateCardPayment(cardPayment);
        if (!validateCard.valid) {
          showToast({
            msg: validateCard.msg,
            color: "danger",
          });
          return;
        }

        doPgPayment(PaymentService.tempData?.transactionId || "");
        return;
      }

      setBusyLoader({ show: true, msg: "Processing checkout..." });
      const checkoutParams = {
        ...PaymentService.tempData?.physicalOrder?.checkoutParams,
      };

      // If a coupon is applied, include couponCode in checkout params
      if (couponApplied && couponApplied.applied && couponApplied.code) {
        checkoutParams["couponCode"] = couponApplied.code;
      }

      const validatePaymentMode = () => {
        if (selectedPaymentMode === "advance") {
          if ((advanceBalance || 0) < payableAmount) {
            showToast({
              msg: "Insufficient advance balance to complete the payment.",
              color: "danger",
            });
            return false;
          }
        } else if (selectedPaymentMode === "cod") {
          if (codLimit < payableAmount) {
            showToast({
              msg: "Insufficient COD limit to complete the payment.",
              color: "danger",
            });
            return false;
          }
          checkoutParams["payByCreditWallet"] = true;
        } else if (selectedPaymentMode === "request") {
          checkoutParams["payBySFBalance"] = true;
          checkoutParams["sellerId"] =
            AuthService.getLoggedInUser()?.sk_franchise_details?.linkedRmfSellerId;
        } else {
          showToast({
            msg: "Please select a valid payment mode.",
            color: "warning",
          });
          return false;
        }
        return true;
      };

      if (!validatePaymentMode()) {
        setBusyLoader({ show: false, msg: "" });
        return;
      }

      const checkoutResponse = await CartService.checkout(
        "B2B",
        AuthService.getLoggedInUserId(true) || "",
        checkoutParams,
      );

      if (checkoutResponse.statusCode === 200) {
        CartService.clearCartLocal();
        window.dispatchEvent(new CustomEvent("cart-count-updated"));

        const orderIds = (checkoutResponse.data.orders || [])
          .map((order: any) => order._id)
          .join(",");

        if (selectedPaymentMode !== "request") {
          setBusyLoader({ show: true, msg: "Initiating payment..." });
          const initiateParams = CartService.prepareInitiateParams(
            selectedPaymentMode === "advance"
              ? "advanceBalance"
              : selectedPaymentMode,
            PaymentService.tempData?.moduleType || "",
          );

          // For secondary wallet (COD/creditWallet) we need to pass additional
          // query params and set useWallet=true. Prepare them here.
          let isWallet = selectedPaymentMode === "advance";
          let queryParams: Record<string, any> | undefined = undefined;

          if (selectedPaymentMode === "cod") {
            const u = AuthService.getLoggedInUser();
            // ensure secondaryAccounts exists and has at least one entry
            const partnerId = u?.secondaryAccounts?.[0]?.partnerId;
            if (partnerId) {
              queryParams = {
                walletType: "creditWallet",
                partnerId: partnerId,
              };
              isWallet = true;
            }
          }

          const initiatePaymentResponse = await CartService.initiatePayment(
            checkoutResponse.data?.transactionId || "",
            isWallet,
            initiateParams,
            "transId",
            PaymentService.tempData?.moduleType === "unConfirmedOrder",
            queryParams,
          );

          if (initiatePaymentResponse.statusCode === 200) {
            // Poll for Purchase Order creation based on skOrderId(s)
            try {
              const skOrderIds = orderIds
                .split(",")
                .map((id: string) => id.trim())
                .filter(Boolean);

              // Poll POs by skOrderId every 5s until at least one PO is found, then redirect
              let attempts = 0;
              const maxAttempts = 24; // 2 minutes
              let found = false;

              while (attempts < maxAttempts && !found) {
                attempts++;
                // Show busy loader while polling with attempt info
                setBusyLoader({
                  show: true,
                  msg: `Polling for order confirmation... (${attempts}/${maxAttempts})`,
                });
                try {
                  const resp = await PurchaseOrderService.getList({
                    page: 1,
                    count: 10,
                    filter: { skOrderId: { $in: skOrderIds } },
                  });

                  const data = resp?.data?.data || resp?.data || [];
                  if (Array.isArray(data) && data.length > 0) {
                    const firstPo = data[0];
                    const poId = firstPo?._id || firstPo?.orderId;
                    if (poId) {
                      showToast({
                        msg: "Payment successful!",
                        color: "success",
                      });

                      // Clear busy loader before redirect
                      setBusyLoader({ show: false, msg: "" });
                      await new Promise((r) => setTimeout(r, 800));
                      replace(`/products/order-placed?poId=${poId}`);
                      found = true;
                      break;
                    }
                  }
                } catch (e) {
                  // ignore and continue polling
                }

                if (attempts < maxAttempts && !found) {
                  await new Promise((resolve) => setTimeout(resolve, 5000));
                }
              }

              if (!found) {
                // Clear busy loader before final redirect on timeout
                setBusyLoader({ show: false, msg: "" });
                replace(`/products/order-placed?ids=${orderIds}`);
              }
            } catch (err) {
              replace(`/products/order-placed?ids=${orderIds}`);
            }
          } else {
            showToast({
              msg: "Failed to initiate payment.",
              color: "danger",
            });
          }
        } else {
          // Request Order flow with referenceId and OmsService.getRequestOrders
          // const referenceId = checkoutResponse.data?.referenceId;
          // if (referenceId) {
          //   setBusyLoader({ show: true, msg: "Placing request order..." });
          //   await new Promise((resolve) => setTimeout(resolve, 5000));
          //   try {
          //     const reqOrdersResp = await OmsService.getRequestOrders({
          //       filter: { referenceId },
          //     });
          //     const reqOrderArr = reqOrdersResp?.data || [];
          //     const reqOrderIds = reqOrderArr
          //       .map((item: any) => item.orderIds)
          //       .flat()
          //       .join(",");
          //     CartService.clearCartLocal();
          //     showToast({
          //       msg: "Request order placed successfully!",
          //       color: "success",
          //     });
          //     replace(`/products/order-placed?ids=${reqOrderIds}`);
          //   } catch (err) {
          //     showToast({
          //       msg: "Failed to fetch request order details.",
          //       color: "danger",
          //     });
          //   }
          // } else {
          //   showToast({
          //     msg: "Reference ID not found for request order.",
          //     color: "danger",
          //   });
          // }
        }
      } else {
        showToast({
          msg: "Failed to complete checkout.",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error during payment process:", error);
      showToast({
        msg: "An error occurred during the payment process.",
        color: "danger",
      });
    } finally {
      setBusyLoader({ show: false, msg: "" });
    }
  };

  const handleCardPayment = (data: any) => {
    setCardPayment({ ...data.data });
  };

  const getModuleType = () => {
    return PaymentService.tempData?.moduleType || "";
  };

  const isOrderPlacementType = () => {
    // Show coupon UI only for OMS/order placement module types
    const t = getModuleType();
    return t === "physical" || t === "unConfirmedOrder" || t === "groupBuying";
  };

  const handleCouponCallback = (payload: { action: string; data?: any }) => {
    const { action, data } = payload || ({} as any);
    if (action === "apply_error") {
      // Show API error using toast and do not call any parent callback as per requirement
      const err = data?.error;
      const msg =
        (err && (err.message || err.data?.message || err.toString())) ||
        "Failed to apply coupon";
      showToast({ msg, color: "danger" });
      return;
    }

    if (action === "apply_success") {
      const resp = data?.response;
      const code = data?.code || resp?.data?.code || resp?.data?.couponId || "";
      // API may return discount / rewardedAmount / reward depending on endpoint/version
      const reward =
        resp?.data?.discount ||
        resp?.data?.rewardedAmount ||
        resp?.data?.reward ||
        0;
      setCouponApplied({ code, rewardedAmount: reward, applied: true });
    }

    if (action === "remove") {
      setCouponApplied(null);
    }

    // If parent needs to be informed for success/remove, we could call any external callback here.
  };

  const getPgPaymentParams = (transId: string) => {
    if (selectedPaymentMode == "card" || selectedPaymentMode == "cugCard") {
      return getCardPaymentParams(
        transId,
        cardPayment,
        payableAmount,
        getModuleType(),
      );
    } else if (selectedPaymentMode == "netbanking") {
      return getNetBankingParams(transId, payableAmount, getModuleType());
    } else if (selectedPaymentMode == "UPI") {
      return getUpiParams(transId, payableAmount, getModuleType());
    } else {
      return {};
    }
  };

  const doPgPayment = async (transId: string) => {
    let params = getPgPaymentParams(transId);
    setBusyLoader({ show: true, msg: "Processing checkout..." });
    const resp = await PaymentService.confirmPayment(params);
    if (resp.statusCode === 200) {
      openPgWindow(resp.data.url, resp.data.id);
    } else {
      showToast({
        msg: resp.data.message || "Something went wrong",
        color: "danger",
      });
    }
  };

  const openPgWindow = async (url: string, transId: string) => {
    const cordova = MiscService.getCordova();
    if (cordova) {
      let ref = cordova.InAppBrowser.open(url, "_blank", "location=no");
      ref.addEventListener("loadstart", () => {});
      ref.addEventListener("loadstop", (e: any) => {
        let api = "/pg/v1/updateStatus";
        let f1 = api.replace(/\//g, "\\/").replace(/\./g, "\\.");
        //.replace("8082", "8080");
        let rexp = new RegExp(f1, "g");
        if (rexp.test(e.url)) {
          ref.close();
        }
      });
      ref.addEventListener("exit", () => {
        checkPgStatus(transId);
      });
    } else {
      setBusyLoader({ show: true, msg: "Processing checkout..." });
      let wopen = window["open"];
      let win = wopen(url, "_blank", "width=600,height=500");
      var timer = setInterval(async () => {
        if (win && win.closed) {
          clearInterval(timer);
          setBusyLoader({ show: false, msg: "" });
          let t = setTimeout(() => {
            clearTimeout(t);
            checkPgStatus(transId);
          }, 500);
        }
      }, 500);
    }
  };

  const checkPgStatus = async (transId: string) => {
    await setBusyLoader({ show: true, msg: "Processing checkout..." });
    const resp = await PaymentService.checkPaymentStatus(transId);
    if (resp.statusCode === 200) {
      redirectionHandler(transId, resp.data);
    } else {
      redirectionHandler(transId);
    }
  };

  const redirectionHandler = (transId: string, pgStatus: any = {}) => {
    switch (getModuleType()) {
      case "depositMoney":
        checkDepositMoneyTransaction();
        break;
      default:
        console.warn("Invalid Type");
    }
  };

  const checkDepositMoneyTransaction = async () => {
    let iter = 0;
    let errMsg =
      "Sorry!!! we are unable to deposit the amount. Please try again later";
    let successMsg =
      "Deposit recorded Successfully, Balance will be updated shortly";

    let apiCaller = async () => {
      const resp = await AccountService.getReceiptDetail(
        PaymentService.tempData?.transactionId || "",
      );
      if (resp.statusCode === 200) {
        const data = resp.data;

        if (
          iter < 5 &&
          ["Processing", "Created", "Pending"].indexOf(data["status"]) != -1
        ) {
          iter++;
          const t = setTimeout(() => {
            clearTimeout(t);
            apiCaller();
          }, 2000);
        } else {
          let msg = "";
          let status = "";
          if (
            ["Accounted", "Approved", "Pending Approval"].indexOf(
              data["status"],
            ) != -1
          ) {
            msg = successMsg;
            status = "success";
          } else {
            msg = errMsg;
            status = "error";
          }
          setBusyLoader({ show: false, msg: "" });
          showToast({
            msg,
            color: status === "success" ? "success" : "danger",
          });
          replace("/dashboard/deposit-money/create");
        }
      } else {
        setBusyLoader({ show: false, msg: "" });
        showToast({
          msg: resp.data.message || "Something went wrong",
          color: "danger",
        });
      }
    };

    setBusyLoader({ show: true, msg: "Processing checkout..." });
    apiCaller();
  };

  return (
    <>
      <AppHeader title="Payment" />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {loading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
              <p>Loading...</p>
            </div>
          ) : (
            <div className="tw:max-w-4xl tw:mx-auto tw:p-4 tw:space-y-4">
              {/* Payable Amount Block */}
              <InfoBlock bordered={true} shadow={true}>
                <div className="tw:flex tw:items-center tw:justify-between">
                  <div className="tw:!text-lg tw:font-semibold">
                    Payable Amount
                  </div>
                  <div className="tw:text-right">
                    {couponApplied && couponApplied.applied ? (
                      <div>
                        <div className="tw:text-gray-800 tw:text-xl tw:font-bold">
                          <Amount value={payableAmount} />
                        </div>
                        <div className="tw:text-gray-400 tw:text-sm tw:line-through">
                          <Amount value={basePayableAmount} />
                        </div>
                      </div>
                    ) : (
                      <div className="tw:text-gray-800 tw:text-xl tw:font-bold">
                        <Amount value={payableAmount} />
                      </div>
                    )}
                    {beforeTaxAmount > 0 && (
                      <div className="tw:text-gray-500 tw:text-xs tw:mt-1">
                        Before Tax: <Amount value={beforeTaxAmount} />
                      </div>
                    )}
                  </div>
                </div>
              </InfoBlock>
              {/* Apply Coupon - only for order placement (OMS) types */}
              {isOrderPlacementType() && (
                <div className="tw:mt-4 tw:hidden">
                  <ApplyCoupon
                    cartId={
                      PaymentService.tempData?.physicalOrder?.cartId || ""
                    }
                    callback={handleCouponCallback}
                  />
                </div>
              )}
              <h3 className="tw:!text-lg tw:font-semibold tw:mt-4">
                Choose Payment Mode
              </h3>
              {/* Payment Modes */}
              <div className="tw:space-y-4">
                {/* Pay using Advance Balance */}
                {!hideBalancePayments && (
                  <PaymentCard
                    title="Pay using Advance Balance"
                    description="Use your advance balance to pay."
                    balanceLabel="Balance"
                    balance={advanceBalance || 0}
                    isSelected={selectedPaymentMode === "advance"}
                    isDisabled={(advanceBalance || 0) < payableAmount}
                    onClick={handleAdvanceClick}
                    insufficientBalanceMessage={
                      (advanceBalance || 0) < payableAmount
                        ? "Insufficient Balance"
                        : undefined
                    }
                    showBalance={true}
                  />
                )}

                {/* Pay using COD Limit */}
                {!hideBalancePayments && hasCodLimit && (
                  <PaymentCard
                    title="Pay using COD Limit"
                    description="Use your COD limit for payment."
                    balanceLabel="Limit"
                    balance={codLimit}
                    isSelected={selectedPaymentMode === "cod"}
                    isDisabled={codLimit < payableAmount}
                    onClick={handleCodClick}
                    insufficientBalanceMessage={
                      codLimit < payableAmount
                        ? "Insufficient Balance"
                        : undefined
                    }
                    showBalance={true}
                  />
                )}

                {/* Card Payments */}
                {(enabledPaymentModes.showCreditCardPayment ||
                  enabledPaymentModes.showDebitCardPayment) &&
                  getModuleType() !== "physical" && (
                    <PaymentCard
                      title="Pay using Card"
                      description="Pay securely using your Credit or Debit Card."
                      balanceLabel=""
                      balance={0}
                      isSelected={selectedPaymentMode === "card"}
                      isDisabled={false}
                      onClick={() => setSelectedPaymentMode("card")}
                      showBalance={false}
                    >
                      <div className="tw:mt-4">
                        <CardPayment
                          callback={handleCardPayment}
                          amount={payableAmount}
                        />
                      </div>
                    </PaymentCard>
                  )}

                {/* Request Order */}
                {showRequestOrder && hasMpsOrder && (
                  <PaymentCard
                    title="Request Order"
                    description={
                      <span>
                        Request an order for payment.{" "}
                        <span
                          className="tw:text-blue-500 tw:cursor-pointer tw:underline"
                          onClick={() => setShowRequestOrderModal(true)}
                        >
                          How it works
                        </span>
                      </span>
                    }
                    balanceLabel=""
                    balance={0} // No balance for request order
                    isSelected={selectedPaymentMode === "request"}
                    isDisabled={false} // Request order is always enabled
                    onClick={handleRequestClick}
                    showBalance={false}
                  />
                )}

                {selectedPaymentMode === "request" && (
                  <div ref={retailerDetailsRef}>
                    <RetailerDetails parentDetails={parentDetails} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="app-footer tw:p-4">
        <div className="app-container">
          <div className="tw:max-w-4xl tw:mx-auto tw:p-4 tw:text-end">
            <AppButton onClick={handleMakePayment} isLoading={busyLoader.show}>
              <CreditCard className="tw:mr-2" />
              Make Payment
            </AppButton>
          </div>
        </div>
      </div>

      <BusyLoader show={busyLoader.show} message={busyLoader.msg} />
    </>
  );
};

export default Payment;
