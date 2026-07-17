import { PencilLine, PlusIcon, XIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import SplitInput from "~/components/core/split-input/SplitInput";
import Timer from "~/components/core/timer/Timer";
import useAppToast from "~/hooks/useAppToast";

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

  const valRef = useRef<number | null>(null);

  const [showResend, setShowResend] = useState(false);

  const validatingRef = useRef(false);

  const splitInpCb = useCallback((e: { value: number }) => {
    valRef.current = e.value;
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
    } else if (valRef.current.toString().length != inpCount) {
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

  return (
    <>
      <AppModal
        show={show}
        className="otp-modal transparent-modal backdrop-op-5"
        backdropDismiss={false}
      >
        <AppModal.Content>
          <div className="tw:relative tw:mt-2">
            {/* Close button */}
            <button
              className="tw:absolute tw:right-0 tw:top-0 tw:text-gray-400 hover:tw:text-gray-600 tw:transition-colors tw:p-1 tw:rounded-full hover:tw:bg-gray-100"
              onClick={close}
              type="button"
              aria-label="Close"
            >
              <XIcon size={20} />
            </button>

            {/* Header */}
            <div className="tw:text-center tw:mb-6 tw:mt-2">
              <h2 className="tw:text-xl tw:font-bold tw:text-gray-900 tw:mb-1">
                {t("enter6DigitOtp")}
              </h2>
              <p className="tw:text-sm tw:text-gray-500">
                {t("otpVerificationCodeSent")}
              </p>
            </div>

            {/* Mobile number display - Compact */}
            <div className="tw:flex tw:justify-center tw:mb-6">
              <div className="tw:flex tw:items-center tw:gap-2 tw:bg-gray-50 tw:border tw:border-gray-200 tw:px-3 tw:py-1.5 tw:rounded-full">
                <span className="tw:text-xs tw:text-gray-500">
                  {t("otpSentTo", { mobile: "" }).trim()}
                </span>
                <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                  {mobile}
                </span>
                <button
                  className="tw:text-app-primary hover:tw:text-app-primary-dark tw:transition-colors tw:ml-1"
                  onClick={close}
                  type="button"
                  title={t("edit")}
                >
                  <PencilLine size={14} />
                </button>
              </div>
            </div>

            {/* OTP Input */}
            <div className="tw:mb-6 tw:flex tw:justify-center">
              <form onSubmit={submit} noValidate autoComplete="off">
                <SplitInput count={inpCount} callback={splitInpCb} />
                <input type="submit" className="tw:hidden" />
              </form>
            </div>

            {/* Actions */}
            <div className="tw:flex tw:justify-between tw:gap-2 tw:flex-wrap tw:items-center">
              <div className="tw:text-center tw:text-sm">
                <span className="tw:text-gray-500">{t("didntReceiveOtp")}</span>
                {resending ? (
                  <span className="tw:inline-flex tw:items-center tw:gap-2 tw:ml-2">
                    <AppSpinner />
                    <span className="tw:text-sm tw:text-gray-500">
                      {t("sending")}...
                    </span>
                  </span>
                ) : (
                  <>
                    {showResend ? (
                      <button
                        type="button"
                        onClick={doResend}
                        disabled={resending}
                        className="tw:ml-2 tw:font-semibold tw:text-app-primary hover:tw:text-app-primary-dark hover:tw:underline tw:transition-colors"
                      >
                        {t("resendOtp")}
                      </button>
                    ) : (
                      <span className="tw:ml-2 tw:inline-flex tw:items-center tw:gap-1 tw:font-medium tw:text-gray-700">
                        <Timer callback={timerCb} />
                        <span>{t("sec")}</span>
                      </span>
                    )}
                  </>
                )}
              </div>

              <AppButton
                color="primary"
                fill="solid"
                expand="block"
                onClick={doVerify}
                disabled={validating}
              >
                {validating ? (
                  <span className="tw:inline-flex tw:items-center tw:gap-2">
                    <AppSpinner />
                    <span>{t("verifying")}...</span>
                  </span>
                ) : (
                  t("verifyOtp")
                )}
              </AppButton>
            </div>
          </div>
        </AppModal.Content>
      </AppModal>
    </>
  );
}

export default OtpModal;
