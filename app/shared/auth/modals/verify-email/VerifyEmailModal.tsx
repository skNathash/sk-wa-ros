import { MailIcon, PencilLine, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import SplitInput from "~/components/core/split-input/SplitInput";
import Timer from "~/components/core/timer/Timer";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  email: string;
  autoTrigger?: boolean;
  updateFranchise?: boolean;
};

type Step = "email" | "otp";

type EmailFormValues = {
  email: string;
};

function VerifyEmailModal({
  show,
  callback,
  email: initialEmail,
  autoTrigger = false,
  updateFranchise = false,
}: Props) {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<EmailFormValues>({
    defaultValues: { email: initialEmail },
  });

  const emailVal = watch("email");

  const [step, setStep] = useState<Step>("email");
  const [editing, setEditing] = useState(!initialEmail);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const otpRequestIdRef = useRef("");
  const otpValRef = useRef<number | null>(null);
  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    if (show) {
      reset({ email: initialEmail });
      setStep("email");
      setEditing(!initialEmail);
      autoTriggeredRef.current = false;
    }
  }, [show, initialEmail]);

  useEffect(() => {
    if (show && autoTrigger && !autoTriggeredRef.current && emailVal) {
      autoTriggeredRef.current = true;
      sendOtp(emailVal);
    }
  }, [show, autoTrigger, emailVal]);

  const sendOtp = async (email: string) => {
    if (!email || !CommonService.isValidEmail(email)) {
      appToast.show({ msg: t("pleaseEnterValidEmail"), color: "danger" });
      return;
    }

    setSending(true);
    try {
      const res = await FranchiseService.sendEmailOtp({
        refType: "Franchise",
        email,
      });
      if ((res.statusCode === 200 || res.statusCode === 201) && res.data) {
        otpRequestIdRef.current = res.data?.data?.otpRequestId || "";
        setStep("otp");
        setShowResend(false);
        appToast.show({ msg: "OTP shared to the email", color: "success" });
      } else {
        appToast.show({
          msg: res.data?.message || t("somethingWentWrong"),
          color: "danger",
        });
      }
    } catch {
      appToast.show({ msg: t("somethingWentWrong"), color: "danger" });
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpValRef.current || otpValRef.current.toString().length !== 6) {
      appToast.show({ msg: t("pleaseEnterValid6DigitOtp"), color: "danger" });
      return;
    }

    setVerifying(true);
    try {
      const res = await FranchiseService.verifyEmailOtp({
        otpRequestId: otpRequestIdRef.current,
        otp: String(otpValRef.current),
      });
      if (res.statusCode === 200) {
        if (updateFranchise) {
          const updateRes = await FranchiseService.updateFranchise({
            emailRequestId: otpRequestIdRef.current,
            email: emailVal,
          });
          if (updateRes.statusCode === 200) {
            appToast.show({
              msg: t("emailVerifiedSuccessfully"),
              color: "success",
            });
            callback({ action: "verified", data: { email: emailVal, emailRequestId: otpRequestIdRef.current } });
          } else {
            appToast.show({
              msg: updateRes.data?.message || t("somethingWentWrong"),
              color: "danger",
            });
          }
        } else {
          appToast.show({
            msg: t("emailVerifiedSuccessfully"),
            color: "success",
          });
          callback({ action: "verified", data: { email: emailVal, emailRequestId: otpRequestIdRef.current } });
        }
      } else {
        appToast.show({
          msg: res.data?.message || t("invalidOtp"),
          color: "danger",
        });
      }
    } catch {
      appToast.show({ msg: t("somethingWentWrong"), color: "danger" });
    } finally {
      setVerifying(false);
    }
  };

  const resendOtp = () => {
    setShowResend(false);
    sendOtp(emailVal);
  };

  const splitInpCb = useCallback((e: { value: number }) => {
    otpValRef.current = e.value;
  }, []);

  const timerCb = (e: any) => {
    setShowResend(e.action === "completed");
  };

  const close = () => {
    callback({ action: "close" });
  };

  const onEmailSubmit = (data: EmailFormValues) => {
    setEditing(false);
    sendOtp(data.email);
  };

  return (
    <AppModal
      show={show}
      className="verify-email-modal transparent-modal backdrop-op-5"
      backdropDismiss={false}
    >
      <AppModal.Content>
        <div className="tw:relative tw:mt-2">
          {/* Close */}
          <button
            className="tw:absolute tw:right-0 tw:top-0 tw:text-gray-400 hover:tw:text-gray-600 tw:p-1 tw:rounded-full hover:tw:bg-gray-100"
            onClick={close}
            type="button"
          >
            <XIcon size={20} />
          </button>

          {step === "email" ? (
            <>
              {/* Email Step */}
              <div className="tw:text-center tw:mb-4 tw:mt-2">
                <div className="tw:inline-flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:rounded-full tw:bg-blue-50 tw:mb-2">
                  <MailIcon size={20} className="tw:text-blue-600" />
                </div>
                <h2 className="tw:text-lg tw:font-bold tw:text-gray-900">
                  {t("verifyEmail")}
                </h2>
                <p className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  {t("weWillSendOtpToEmail")}
                </p>
              </div>

              <form onSubmit={handleSubmit(onEmailSubmit)}>
                <div className="tw:mb-4">
                  {editing ? (
                    <AppInput
                      name="email"
                      type="email"
                      register={register}
                      rules={{
                        required: t("pleaseEnterValidEmail"),
                        validate: (value: string) =>
                          CommonService.isValidEmail(value) ||
                          t("pleaseEnterValidEmail"),
                      }}
                      error={errors.email?.message}
                      placeholder={t("enterEmail")}
                      autoFocus
                    />
                  ) : (
                    <div className="tw:flex tw:items-center tw:justify-between tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg tw:px-3 tw:py-2">
                      <span className="tw:text-sm tw:font-medium tw:text-gray-900 tw:truncate">
                        {emailVal || t("noEmailProvided")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="tw:text-app-primary hover:tw:text-app-primary-dark tw:ml-2 tw:flex-shrink-0"
                      >
                        <PencilLine size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="tw:text-end">
                  <AppButton
                    color="primary"
                    fill="solid"
                    expand="block"
                    type="submit"
                    disabled={sending}
                  >
                    {sending ? (
                      <span className="tw:inline-flex tw:items-center tw:gap-2">
                        <AppSpinner />
                        <span>{t("sending")}...</span>
                      </span>
                    ) : (
                      t("sendOtp")
                    )}
                  </AppButton>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* OTP Step */}
              <div className="tw:text-center tw:mb-4 tw:mt-2">
                <h2 className="tw:text-lg tw:font-bold tw:text-gray-900">
                  {t("enter6DigitOtp")}
                </h2>
                <p className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  {t("otpVerificationCodeSent")}
                </p>
              </div>

              {/* Email display */}
              <div className="tw:flex tw:justify-center tw:mb-4">
                <div className="tw:flex tw:items-center tw:gap-2 tw:bg-gray-50 tw:border tw:border-gray-200 tw:px-3 tw:py-1.5 tw:rounded-full">
                  <span className="tw:text-xs tw:text-gray-500">
                    {t("sentTo")}
                  </span>
                  <span className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate tw:max-w-[180px]">
                    {emailVal}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setEditing(true);
                    }}
                    className="tw:text-app-primary hover:tw:text-app-primary-dark tw:ml-1"
                  >
                    <PencilLine size={14} />
                  </button>
                </div>
              </div>

              {/* OTP Input */}
              <div className="tw:mb-4 tw:flex tw:justify-center">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    verifyOtp();
                  }}
                  noValidate
                  autoComplete="off"
                >
                  <SplitInput count={6} callback={splitInpCb} />
                  <input type="submit" className="tw:hidden" />
                </form>
              </div>

              {/* Resend / Timer */}
              <div className="tw:flex tw:justify-between tw:items-center tw:gap-2 tw:flex-wrap">
                <div className="tw:text-sm">
                  <span className="tw:text-gray-500">
                    {t("didntReceiveOtp")}
                  </span>
                  {sending ? (
                    <span className="tw:inline-flex tw:items-center tw:gap-2 tw:ml-2">
                      <AppSpinner />
                      <span className="tw:text-sm tw:text-gray-500">
                        {t("sending")}...
                      </span>
                    </span>
                  ) : showResend ? (
                    <button
                      type="button"
                      onClick={resendOtp}
                      className="tw:ml-2 tw:font-semibold tw:text-app-primary hover:tw:text-app-primary-dark hover:tw:underline"
                    >
                      {t("resendOtp")}
                    </button>
                  ) : (
                    <span className="tw:ml-2 tw:inline-flex tw:items-center tw:gap-1 tw:font-medium tw:text-gray-700">
                      <Timer callback={timerCb} />
                      <span>{t("sec")}</span>
                    </span>
                  )}
                </div>

                <AppButton
                  color="primary"
                  fill="solid"
                  expand="block"
                  onClick={verifyOtp}
                  disabled={verifying}
                >
                  {verifying ? (
                    <span className="tw:inline-flex tw:items-center tw:gap-2">
                      <AppSpinner />
                      <span>{t("verifying")}...</span>
                    </span>
                  ) : (
                    t("verifyOtp")
                  )}
                </AppButton>
              </div>
            </>
          )}
        </div>
      </AppModal.Content>
    </AppModal>
  );
}

export default VerifyEmailModal;
