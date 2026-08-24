import { ArrowRight, Check, MessageSquareText } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import SplitInput from "~/components/core/split-input/SplitInput";
import Timer from "~/components/core/timer/Timer";
import useAppToast from "~/hooks/useAppToast";

import "./OtpModal.css";

type Props = {
  show: boolean;
  verify: (a: { otp: number }) => void;
  resend: () => void;
  close: () => void;
  mobile: string;
  inpCount?: number;
  validating?: boolean;
  resending?: boolean;
};

// "9876543210" reads as a wall of digits — split it the way the
// number is spoken so a mistyped mobile is easy to spot.
const formatMobile = (mobile: string) => {
  const isNum = typeof mobile == "number";
  const digits = ((isNum ? mobile.toString() : mobile) || "")
    .replace(/\D/g, "")
    .slice(-10);
  return digits.length === 10
    ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    : mobile;
};

function OtpModal({
  show = false,
  verify,
  resend,
  mobile,
  close,
  inpCount = 6,
  validating = false,
  resending = false,
}: Props) {
  const appToast = useAppToast();
  const { t } = useTranslation(["common"]);

  const valRef = useRef<string>("");

  const [showResend, setShowResend] = useState(false);
  const [filled, setFilled] = useState(0);

  const validatingRef = useRef(false);

  const splitInpCb = useCallback((e: { raw: string }) => {
    valRef.current = e.raw;
    setFilled(e.raw.length);
  }, []);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    doVerify();
  };

  const doVerify = () => {
    if (validatingRef.current) {
      return;
    }

    validatingRef.current = true;

    let msg = "";

    if (!valRef.current) {
      msg = t("pleaseProvideOtp");
    } else if (valRef.current.length != inpCount) {
      // Prefer existing 6-digit message if inpCount is 6
      msg =
        inpCount === 6
          ? t("pleaseEnterValid6DigitOtp")
          : t("pleaseProvideValidOtp");
    } else {
      msg = "";
    }

    if (msg) {
      validatingRef.current = false;
      appToast.show({
        msg: msg,
        color: "danger",
      });
      return;
    }

    verify({
      otp: Number(valRef.current),
    });

    validatingRef.current = false;
  };

  const timerCb = (e: any) => {
    setShowResend(e.action == "completed" ? true : false);
  };

  const doResend = () => {
    setShowResend(false);
    resend();
  };

  const complete = filled === inpCount;

  return (
    <AppModal
      show={show}
      className="otp-modal transparent-modal backdrop-op-5"
      backdropDismiss={false}
    >
      <AppModal.Content>
        <div className="sk-otp">
          <div className="sk-otp-head">
            <span className="sk-otp-head-title">Enter the code</span>
            <span className="sk-otp-head-desc">
              We sent a {inpCount}-digit code to verify it's you.
            </span>
          </div>

          {/* Where the code went — "Change" doubles as the way out
              of the modal, so no separate close affordance. */}
          <div className="sk-otp-sent">
            <span className="sk-otp-sent-icon">
              <MessageSquareText size={15} />
            </span>
            <span className="sk-otp-sent-body">
              <span className="sk-otp-sent-label">Sent to</span>
              <span className="sk-otp-sent-num">{formatMobile(mobile)}</span>
            </span>
            <button
              type="button"
              className="sk-otp-sent-change"
              onClick={close}
              title={t("edit")}
            >
              {t("change")}
            </button>
          </div>

          {/* Code boxes */}
          <form onSubmit={submit} noValidate autoComplete="off">
            <div className="sk-otp-inputs">
              <SplitInput count={inpCount} callback={splitInpCb} />
            </div>
            <input type="submit" className="tw:hidden" />
          </form>

          {/* Resend */}
          <div className="sk-otp-meta">
            <span>{t("didntReceiveOtp")}</span>

            {resending ? (
              <span className="sk-otp-meta-right">
                <AppSpinner />
                <span>{t("sending")}</span>
              </span>
            ) : showResend ? (
              <button
                type="button"
                className="sk-otp-resend"
                onClick={doResend}
              >
                {t("resendOtp")}
              </button>
            ) : (
              <span className="sk-otp-meta-right">
                <span>Resend in</span>
                <span className="sk-otp-timer">
                  <Timer callback={timerCb} />
                </span>
              </span>
            )}
          </div>

          <button
            type="button"
            className="sk-otp-submit"
            onClick={doVerify}
            disabled={validating || !complete}
          >
            <span className="sk-otp-submit-left">
              <span className="sk-otp-submit-icon">
                {validating ? <AppSpinner /> : <Check size={16} />}
              </span>
              <span>
                <span className="sk-otp-submit-main">
                  {validating ? "Verifying..." : "Verify code"}
                </span>
                <span className="sk-otp-submit-sub">
                  {complete
                    ? "Code entered — tap to verify"
                    : `Enter all ${inpCount} digits first`}
                </span>
              </span>
            </span>
            <ArrowRight size={18} />
          </button>
        </div>
      </AppModal.Content>
    </AppModal>
  );
}

export default OtpModal;
