import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import { LockKeyhole } from "lucide-react";
import Timer from "~/components/core/timer/Timer";
import useAppToast from "~/hooks/useAppToast";
import CartService from "~/services/CartService";

export type OtpSectionHandle = {
  /** Verifies the entered code. Resolves false when it didn't go through. */
  verify: () => Promise<boolean>;
};

type Props = {
  cartId: string;
  mobile?: string;
  name?: string;
  totalItems?: number;
  totalValue?: number;
  /** Merged into the verify payload — the order details the OTP confirms. */
  extraParams?: Record<string, any>;
  /** Fires `{ action: "verified", data }` once the code checks out. */
  callback: (payload: { action: string; data?: any }) => void;
  className?: string;
};

const RESEND_SECONDS = 60;

/**
 * Assisted-order verification. The customer reads back the code sent to their
 * mobile, and verifying it is what actually places the order — so the modal
 * footer drives it, and this block only collects the code.
 */
const OtpVerifySection = forwardRef<OtpSectionHandle, Props>(
  (
    {
      cartId,
      mobile,
      name,
      totalItems = 0,
      totalValue = 0,
      extraParams,
      callback,
      className,
    },
    ref,
  ) => {
    const appToast = useAppToast();
    const [otp, setOtp] = useState("");
    const [resending, setResending] = useState(false);
    const [locked, setLocked] = useState(true);
    const [timerKey, setTimerKey] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setOtp("");
      setLocked(true);
      setTimerKey((key) => key + 1);
      inputRef.current?.focus();
    }, [cartId]);

    const handleResend = async () => {
      setResending(true);
      try {
        const resp = await CartService.resendOtp(cartId, {});
        if (resp?.statusCode === 200) {
          appToast.show({ msg: "Verification code resent", color: "success" });
          setLocked(true);
          setTimerKey((key) => key + 1);
        } else {
          appToast.show({
            msg: resp?.data?.message || "Failed to resend code",
            color: "error",
          });
        }
      } catch (e) {
        console.error("Error resending OTP", e);
        appToast.show({ msg: "Failed to resend code", color: "error" });
      } finally {
        setResending(false);
      }
    };

    const verify = async () => {
      if (!/^[0-9]{4,6}$/.test(otp)) {
        appToast.show({ msg: "Please enter a valid code", color: "warning" });
        return false;
      }

      try {
        const resp = await CartService.verifyOtp(cartId, {
          ...(extraParams || {}),
          otp,
        });

        if (resp?.statusCode !== 200) {
          appToast.show({
            msg: resp?.data?.message || "Failed to verify OTP",
            color: "error",
          });
          return false;
        }

        appToast.show({ msg: "OTP verified", color: "success" });
        callback({ action: "verified", data: resp.data });
        return true;
      } catch (e) {
        console.error("Error verifying OTP", e);
        appToast.show({ msg: "Failed to verify OTP", color: "error" });
        return false;
      }
    };

    // Verification is driven from the modal footer so this block never owns a
    // second primary action.
    useImperativeHandle(ref, () => ({ verify }));

    return (
      <div className={clsx("tw:space-y-2.5", className)}>
        <div className="tw:flex tw:items-center tw:justify-between tw:rounded-xl tw:bg-slate-50 tw:px-3 tw:py-2 tw:text-xs">
          <span className="tw:text-slate-600">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
          <span className="tw:font-bold tw:tabular-nums tw:text-slate-800">
            ₹{totalValue.toFixed(2)}
          </span>
        </div>

        <div className="tw:flex tw:flex-col tw:items-center tw:gap-1.5 tw:text-center">
          <span className="tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-50 tw:text-emerald-700">
            <LockKeyhole className="tw:size-4" strokeWidth={1.75} />
          </span>
          <div className="tw:text-sm tw:font-semibold tw:text-slate-800">
            Enter OTP
          </div>
          <p className="tw:text-[11px] tw:text-slate-500">
            A verification code has been sent to{" "}
            <span className="tw:font-semibold tw:tabular-nums tw:text-slate-700">
              {mobile || "the customer"}
            </span>
            {name ? ` (${name})` : ""}
          </p>
        </div>

        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="Enter code"
          className="tw:h-11 tw:w-full tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:text-center tw:text-lg tw:font-bold tw:tracking-[0.4em] tw:tabular-nums tw:text-slate-800 tw:outline-none tw:placeholder:text-base tw:placeholder:font-normal tw:placeholder:tracking-normal tw:placeholder:text-slate-300"
        />

        <div className="tw:flex tw:items-center tw:justify-between tw:text-[11px] tw:text-slate-500">
          <span>Didn't receive the code?</span>
          <button
            type="button"
            disabled={locked || resending}
            onClick={handleResend}
            className="tw:cursor-pointer tw:font-semibold tw:text-emerald-700 tw:transition-colors hover:tw:underline tw:disabled:cursor-not-allowed tw:disabled:text-slate-400"
          >
            {resending ? (
              "Resending…"
            ) : locked ? (
              <span>
                Resend in{" "}
                <Timer
                  key={timerKey}
                  seconds={RESEND_SECONDS}
                  callback={(e?: { action?: string }) =>
                    e?.action === "completed" && setLocked(false)
                  }
                />
                s
              </span>
            ) : (
              "Resend"
            )}
          </button>
        </div>
      </div>
    );
  },
);

OtpVerifySection.displayName = "OtpVerifySection";

export default OtpVerifySection;
