import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Divider from "~/components/core/divider/Divider";
import AppModal from "~/components/core/modal/AppModal";
import AppSteps from "~/components/core/steps/AppSteps";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CartService from "~/services/CartService";
import LoyaltyPointService from "~/services/LoyaltyPointService";
import PosService from "~/services/PosService";
import OtpVerification from "../b2b-checkout/components/OtpVerification";
import CustomerAddress from "./components/customer/address/CustomerAddress";
import SelectCustomer from "./components/customer/SelectCustomer";
import Payment from "./components/payment/Payment";
import ConfirmationSummary from "./components/summary/ConfirmationSummary";

type CheckoutModalProps = {
  show: boolean;
  callback: (args: { action: string; data?: any }) => void;
  totalDeals: number;
  cartId: string;
  assisted?: boolean;
  summary?: {
    subtotal: number;
    couponDiscount: number;
    coinsDiscount: number;
    totalDiscount: number;
    finalPrice: number;
    orderAmount: number;
  };
};

const getSteps = (t: any, isB2C: boolean, assisted?: boolean) => {
  const steps = [
    {
      title: t("checkoutModal.steps.selectCustomer"),
      key: "customer",
    },
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

const CheckoutModal = ({
  show,
  callback,
  totalDeals,
  cartId,
  summary,
  assisted,
}: CheckoutModalProps) => {
  const { t } = useTranslation(["posbilling"]);

  const appToast = useAppToast();

  const formMethods = useForm({
    defaultValues: {
      option: "b2c",
      smartcoins: 0,
      coupon_code: "",
      loyaltyPoints: "",
      paymentMethod: "cash",
      customer: null as any,
      retailer: null as any,
      paymentDetails: {
        refNo: "",
        proof: [],
        change: 0,
      },
      upiPayment: "",
      upiReferenceNumber: "",
      selectedPaymentMethods: [],
      changeToReturn: 0,
    },
  });

  const [currentStep, setCurrentStep] = useState("customer");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal is opened
  useEffect(() => {
    if (show) {
      formMethods.reset();
      setCurrentStep("customer");
    }
  }, [show, formMethods]);

  const handleClose = () => {
    callback({
      action: "close",
    });
  };

  const handleStepChange = (stepKey: string) => {
    setCurrentStep(stepKey);
  };

  const showAddressStep = () =>
    !!assisted && formMethods.getValues("option") === "b2c";

  const nextStepAfterCustomer = () => {
    if (showAddressStep()) return "address";
    if (assisted) return "confirmation";
    return "payment";
  };

  const handleCustomerCallback = (args: { action: string; data?: any }) => {
    if (args.action === "next") {
      if (assisted) {
        formMethods.setValue("paymentMethod", "paylater");
      }
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
      handleStepChange(showAddressStep() ? "address" : "customer");
    } else if (args.action === "next") {
      handleStepChange("confirmation");
    }
  };

  const placeOrder = async () => {
    setIsSubmitting(true);
    try {
      const values = formMethods.getValues();
      const option = values.option;

      // Validate required data
      if (!cartId) {
        appToast.show({ msg: "Cart ID is required", color: "error" });
        setIsSubmitting(false);
        return;
      }

      // Delegate based on selected option
      if (option === "walkin") {
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

  /**
   * Prepare common payload pieces used by both walkin and B2C flows
   */
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

    const paymentDetails = values.paymentDetails || {};

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

  /**
   * Place order for walkin customer using PosService.createPosOrder
   */
  const placeWalkinOrder = async (values: any) => {
    try {
      const { customerInfo, paymentMode, paymentType } = preparePayload(values);

      const payload: any = {
        cartId,
        paymentType,
        paymentMode,
        customerInfo,
      };

      // if (assisted) payload.assistedOrder = true;

      // Call POS order creation API
      const resp = await PosService.createPosOrder(payload);

      if (resp?.statusCode === 200) {
        appToast.show({
          msg: t("checkoutModal.messages.orderPlaced"),
          color: "success",
        });
        PosService.triggerOrderPlacedEvent({ cartId, order: resp.data });
        callback({ action: "complete", data: resp.data });
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

  /**
   * Place order for B2C customer using PosService.createPosOrder.
   * Handles loyalty blocking when redemption/coins are present.
   */
  const placeB2COrder = async (values: any) => {
    // Validate customer
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
      shippingAddress,
    } = preparePayload(values);

    // Basic validation
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

    // Handle loyalty blocking if applicable
    let capturedRedeemRefId: string | undefined = undefined;
    try {
      const redemptionValue = Number((values as any).redemptionValue) || 0;
      const coinsToRedeem = Number((values as any).loyaltyPoints) || 0;
      if (redemptionValue > 0 && coinsToRedeem > 0) {
        const blockPayload = {
          customerId: customerInfo.customerId,
          franchiseId: AuthService.getLoggedInUserId(),
          initialCartValue: summary?.orderAmount || 0,
          coinsIntendedToRedeem: coinsToRedeem,
          orderType: "STORE_ORDER",
          orderAmount: summary?.orderAmount || 0,
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

    // Use customer's address object if available
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
    };

    // Mirror cart checkout: when using paylater, include paymentMethod field
    if (paymentType === "PAYLATER" || paymentMode?.type === "paylater") {
      payload.paymentType = "COD";
      payload.paymentMethod = "PAYLATER";
    }

    if (capturedRedeemRefId) {
      payload.redeemRefId = capturedRedeemRefId;
    }

    //if (assisted) payload.assistedOrder = true;

    try {
      // Use the same POS order API as walkin flow
      const resp = await PosService.createPosOrder(payload);
      if (resp?.statusCode === 200) {
        appToast.show({
          msg: t("checkoutModal.messages.orderPlaced"),
          color: "success",
        });
        PosService.triggerOrderPlacedEvent({ cartId, order: resp.data });
        callback({ action: "complete", data: resp.data });
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
      if (assisted) {
        sendAssistedOtp();
      } else {
        placeOrder();
      }
    }
  };

  const handleVerificationCallback = (args: { action: string; data?: any }) => {
    if (args.action === "back") {
      handleStepChange("confirmation");
    } else if (args.action === "complete") {
      callback({ action: "complete", data: args.data });
    }
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
            totalAmount={summary?.orderAmount || 0}
            assisted={assisted}
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
            totalValue={summary?.finalPrice ?? summary?.orderAmount ?? 0}
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
    <AppModal show={show} callback={handleClose} className="tw:max-h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">
          {t("checkoutModal.title")} ({totalDeals} deals)
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]">
        <div className="tw:w-full tw:overflow-hidden tw:text-center">
          <AppSteps
            steps={getSteps(t, showAddressStep(), assisted)}
            activeKey={currentStep}
            borderMinWidth={30}
            className="tw:w-full tw:mb-0!"
          />
        </div>
        <Divider className="tw:my-2!" />
        <div className="tw:px-0.5">
          <FormProvider {...formMethods}>{renderCurrentStep()}</FormProvider>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default CheckoutModal;
