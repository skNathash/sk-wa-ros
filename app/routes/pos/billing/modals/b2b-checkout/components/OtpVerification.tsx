import React, { useEffect, useState } from "react";
import { AppInput } from "~/components/core/form/AppInput";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import CartService from "~/services/CartService";
import { useForm } from "react-hook-form";
import Timer from "~/components/core/timer/Timer";
import { Phone, ArrowLeft, Lock, LockKeyhole } from "lucide-react";
import { format } from "date-fns";

const MASKED_PHONE = "XXXXX 7890"; // fallback display; real component can accept props later

type Props = {
  retailerName?: string;
  mobile?: string;
  cartId?: string;
  totalItems?: number;
  totalValue?: number;
  paymentMethod?: string;
  /** Extra params merged into the OTP verify payload (e.g. prepaid payment details) */
  extraParams?: Record<string, any>;
  callback?: (args: { action: string; data?: any }) => void;
  routeInfo?: any;
};

const OtpVerification: React.FC<Props> = ({
  retailerName = "Retailer",
  mobile,
  totalItems = 0,
  totalValue = 0,
  paymentMethod,
  extraParams,
  callback,
  cartId,
  routeInfo,
}) => {
  const { register, getValues, setValue } = useForm();

  const { show } = useAppToast();
  const [isVerifying, setIsVerifying] = useState(false);

  const [isResending, setIsResending] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    setIsLocked(true);
    setTimerKey(0);
    setValue("otp", "");
  }, [setValue]);

  const handleTimerCallback = (e?: { action?: string }) => {
    if (e?.action === "completed") {
      setIsLocked(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const id = cartId || mobile || "";
      const resp = await CartService.resendOtp(id, {} as any);
      if (resp?.statusCode === 200) {
        show({ msg: "Verification code resent", color: "success" });
        // restart timer and lock resend until it completes
        setIsLocked(true);
        setTimerKey((k) => k + 1);
      } else {
        show({
          msg: resp?.data?.message || "Failed to resend code",
          color: "error",
        });
      }
    } catch (err) {
      console.error("Error resending OTP", err);
      show({ msg: "Failed to resend code", color: "error" });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    const otp = getValues("otp");
    if (!/^[0-9]{4,6}$/.test(otp)) {
      show({ msg: "Please enter a valid code", color: "warning" });
      return;
    }

    setIsVerifying(true);

    try {
      const id = cartId || "";
      const params: Record<string, any> = { ...(extraParams || {}), otp };
      if (paymentMethod) {
        params.paymentMethod = paymentMethod;
      }
      // include selected route information in verify payload so order placement can include it
      if (routeInfo?.deliveryDate || routeInfo?._id) {
        params.routeInfo = {
          deliveryDate: format(routeInfo.deliveryDate, "yyyy-MM-dd"),
          routeId: routeInfo._id,
        };
      }
      const resp = await CartService.verifyOtp(id, params);
      if (resp?.statusCode === 200) {
        show({ msg: "OTP verified", color: "success" });
        callback && callback({ action: "complete", data: resp.data });
      } else {
        show({
          msg: resp?.data?.message || "Failed to verify OTP",
          color: "error",
        });
      }
    } catch (err) {
      console.error("Error verifying OTP", err);
      show({ msg: "Failed to verify OTP", color: "error" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    callback && callback({ action: "back", data: "review" });
  };

  return (
    <div className="tw:rounded-xl tw:bg-card">
      {/* Totals block */}
      <div className="tw:bg-muted tw:p-3 tw:rounded-xl tw:mb-3">
        <div className="tw:flex tw:justify-between tw:items-center">
          <div className="tw:text-sm tw:text-muted-foreground">
            Total items
          </div>
          <div className="wa-mono tw:font-semibold tw:text-foreground">
            {totalItems}
          </div>
        </div>
        <div className="tw:flex tw:justify-between tw:items-center tw:mt-2">
          <div className="tw:text-sm tw:text-muted-foreground">
            Total value
          </div>
          <div className="wa-amount tw:font-semibold tw:text-foreground">
            ₹{totalValue.toFixed(2)}
          </div>
        </div>
      </div>
      {/* Centered icon + heading + instruction */}
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:mb-4">
        <div className="tw:w-14 tw:h-14 tw:bg-primary/10 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:mb-3">
          <LockKeyhole className="tw:w-6 tw:h-6 tw:text-primary" />
        </div>

        <h3 className="tw:text-lg tw:font-semibold tw:text-foreground tw:mb-1">
          Enter OTP
        </h3>

        <div className="tw:border tw:rounded-xl tw:p-3 tw:bg-primary/5 tw:border-primary/20 tw:mb-4">
          <p className="tw:text-xs tw:text-muted-foreground tw:text-center tw:m-0">
            A verification code has been sent to{" "}
            <span className="wa-mono tw:font-medium tw:text-foreground">
              {mobile || MASKED_PHONE}
            </span>
            {retailerName ? (
              <span className="tw:text-muted-foreground"> ({retailerName})</span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="tw:mb-3">
        <AppInput
          name="otp"
          register={register}
          placeholder="Enter verification code"
          type="tel"
          inputClassName="wa-mono tw:w-full tw:py-3 tw:px-3 tw:text-lg tw:tracking-widest tw:text-center tw:bg-card tw:border-border"
          maxLength={6}
          autoFocus={true}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            e.target.value = (e.target.value || "")
              .replace(/\D+/g, "")
              .slice(0, 6);
          }}
        />
      </div>

      <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
        <div className="tw:text-sm tw:text-muted-foreground">
          Didn't receive the code?
        </div>

        <button
          type="button"
          disabled={isLocked || isResending}
          onClick={handleResend}
          className={`tw:text-sm tw:font-medium tw:underline tw:underline-offset-2 tw:text-primary tw:cursor-pointer disabled:tw:text-muted-foreground disabled:tw:cursor-not-allowed`}
        >
          {isResending ? (
            "Resending..."
          ) : isLocked ? (
            <span>
              Resend in{" "}
              <Timer
                key={timerKey}
                seconds={60}
                callback={handleTimerCallback}
              />
              s
            </span>
          ) : (
            "Resend"
          )}
        </button>
      </div>
      <div className="tw:flex tw:items-center tw:gap-3 tw:mt-3">
        <AppButton
          onClick={handleBack}
          fill="outline"
          color="light"
          className="tw:flex-1 tw:inline-flex tw:items-center tw:gap-2 tw:justify-center tw:rounded-xl"
        >
          <ArrowLeft size={16} />
          <span className="tw:text-sm">Back to Review</span>
        </AppButton>

        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying}
          className="wa-cta tw:flex-1 tw:flex tw:items-center tw:justify-center tw:gap-1.5 tw:h-10 tw:rounded-xl tw:text-sm tw:font-bold tw:cursor-pointer tw:transition-all tw:disabled:cursor-not-allowed"
        >
          {isVerifying ? "Verifying..." : "Verify & Complete Order"}
        </button>
      </div>
    </div>
  );
};

export default OtpVerification;
