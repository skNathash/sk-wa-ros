import { ChevronLeft, Package, Phone, ShieldCheck, Check } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import LogisticsService from "~/services/LogisticsService";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  data?: {
    orderId?: string;
    orderRefNo?: string;
    assignmentResponse?: any;
    deliveryPersonName?: string;
    deliveryPersonContact?: string;
    customerName?: string;
    itemCount?: number;
  };
};

const OTP_LENGTH = 6;

/**
 * Hand-off desk: the counter releases the sealed bag to the runner only once
 * the runner's pickup code matches. Laid out as a two-step board — a red
 * queue band for the shipment being released, a green strip for the runner
 * taking it, then the code entry and the bag manifest below.
 */
const DeliveryAssignOtpVerifyModal = ({ show, callback, data }: Props) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const [verifying, setVerifying] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      otp: "",
    },
  });

  const otp = watch("otp");
  const complete = (otp || "").length === OTP_LENGTH;

  useEffect(() => {
    if (show) {
      reset({ otp: "" });
    }
  }, [show, reset]);

  const onSubmit = async (formData: { otp: string }) => {
    if (!formData.otp || formData.otp.length !== OTP_LENGTH) {
      appToast.show({
        msg: t("pleaseEnterValid6DigitOtp"),
        color: "danger",
      });
      return;
    }

    if (!data?.assignmentResponse?.shipmentId) {
      appToast.show({
        msg: t("shipmentIdNotFoundPleaseTryAgain"),
        color: "danger",
      });
      return;
    }

    setVerifying(true);
    try {
      const response = await LogisticsService.verifyDeliveryCode({
        shipmentId: data.assignmentResponse.shipmentId,
        approveAuthCode: formData.otp,
        remarks: t("verifyingDeliveryCode"),
      });

      if (response.statusCode === 200) {
        appToast.show({
          msg: t("deliveryCodeVerifiedSuccessfully"),
          color: "success",
        });
        callback({ action: "success", data: response.data });
        reset();
      } else {
        appToast.show({
          msg: response.data?.message || t("failedToVerifyDeliveryCode"),
          color: "danger",
        });
      }
    } catch (error) {
      appToast.show({
        msg: t("anErrorOccurredWhileVerifyingTheCode"),
        color: "danger",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    reset();
    callback({ action: "close" });
  };

  const handleBack = () => {
    reset();
    callback({ action: "back" });
  };

  const runnerName = data?.deliveryPersonName;
  const storeName = AuthService.getLoggedInUser()?.name || "Store";
  const storeInitials = (storeName || "S").charAt(0).toUpperCase();

  // Header sub-line: who the bag is going out for, and how big it is.
  const headerMeta = [
    data?.customerName,
    data?.itemCount ? `${data.itemCount} items` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AppModal
      show={show}
      callback={handleClose}
      noPadding
      overFlowHidden
      className="app-modal-flush tw:gap-0 tw:h-[38rem] tw:max-h-[85vh] tw:overflow-hidden"
    >
      {/* Queue band — the shipment being released. */}
      <div className="tw:shrink-0 tw:bg-gradient-to-r tw:from-red-700 tw:to-red-600 tw:px-4 tw:py-4 tw:text-white">
        <div className="tw:flex tw:items-start tw:gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={verifying}
            aria-label="Back"
            className="tw:mt-0.5 tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:bg-white/15 tw:transition-colors tw:hover:bg-white/25"
          >
            <ChevronLeft className="tw:h-4 tw:w-4" />
          </button>

          <div className="tw:min-w-0 tw:flex-1">
            <span className="tw:block tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.12em] tw:text-white/70">
              Hand-off queue
            </span>
            <p className="tw:mt-0.5 tw:truncate tw:text-lg tw:font-semibold">
              {runnerName}
              {data?.orderRefNo && (
                <>
                  <span className="tw:mx-1.5 tw:text-white/60">→</span>
                  <span className="tw:font-bold">{data.orderRefNo}</span>
                </>
              )}
            </p>
            {headerMeta && (
              <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-white/75">
                {headerMeta}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Runner strip — who is physically taking the bag off the counter. */}
      <div className="tw:shrink-0 tw:bg-gradient-to-r tw:from-teal-800 tw:to-emerald-600 tw:px-4 tw:py-3 tw:text-white">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/20 tw:text-base tw:font-bold">
            {storeInitials}
          </div>

          <div className="tw:min-w-0 tw:flex-1">
            <span className="tw:block tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.12em] tw:text-white/70">
              Collecting this bag at
            </span>
            <p className="tw:truncate tw:text-sm tw:font-semibold">
              {storeName}
            </p>
            {data?.deliveryPersonContact && (
              <p className="tw:truncate tw:text-xs tw:text-white/75">
                {data.deliveryPersonContact}
              </p>
            )}
          </div>

          {data?.deliveryPersonContact && (
            <a
              href={`tel:${data.deliveryPersonContact}`}
              aria-label="Call runner"
              className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/20 tw:transition-colors tw:hover:bg-white/30"
            >
              <Phone className="tw:h-4 tw:w-4" />
            </a>
          )}
        </div>
      </div>

      <AppModal.Content className="tw:bg-slate-50">
        <form onSubmit={handleSubmit(onSubmit)} className="tw:py-4">
          {/* Step 1 — the runner reads their code out. */}
          <div className="tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-4">
            <div className="tw:flex tw:items-center tw:gap-2.5">
              <span className="tw:flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-red-600 tw:text-[11px] tw:font-bold tw:text-white">
                1
              </span>
              <p className="tw:text-sm tw:font-medium tw:text-slate-800">
                Pickup OTP · runner shows you
              </p>
            </div>
            <p className="tw:mt-2 tw:pl-8 tw:text-xs tw:text-slate-500">
              Ask {runnerName} for the {OTP_LENGTH}-digit pickup code on their
              phone.
            </p>
          </div>

          {/* Step 2 — the counter types it to release the bag. */}
          <div className="tw:mt-3 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-4">
            <div className="tw:mb-4 tw:flex tw:items-center tw:gap-2.5">
              <span className="tw:flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-600 tw:text-[11px] tw:font-bold tw:text-white">
                2
              </span>
              <p className="tw:text-sm tw:font-medium tw:text-slate-800">
                You type it — match to release the bag
              </p>
            </div>

            <Controller
              name="otp"
              control={control}
              render={({ field }) => (
                <OtpBoxes
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.otp?.message}
                />
              )}
            />
          </div>

          {/* Bag manifest — what is leaving the counter. */}
          {(data?.orderRefNo || data?.itemCount) && (
            <div className="tw:mt-3 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-4">
              <span className="tw:block tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.12em] tw:text-slate-400">
                Bag manifest
              </span>
              <div className="tw:mt-3 tw:flex tw:items-center tw:gap-3">
                <div className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-violet-50">
                  <Package className="tw:h-4 tw:w-4 tw:text-violet-600" />
                </div>
                <div className="tw:min-w-0 tw:flex-1">
                  {data?.orderRefNo && (
                    <p className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                      {data.orderRefNo}
                    </p>
                  )}
                  {!!data?.itemCount && (
                    <p className="tw:truncate tw:text-xs tw:text-slate-500">
                      {data.itemCount} items
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Single-use note — the code cannot be reused after the match. */}
          <div className="tw:mt-3 tw:flex tw:gap-2.5 tw:rounded-xl tw:border tw:border-blue-100 tw:bg-blue-50 tw:p-3">
            <ShieldCheck className="tw:mt-0.5 tw:h-4 tw:w-4 tw:shrink-0 tw:text-blue-600" />
            <p className="tw:text-xs tw:text-blue-900">
              The pickup code is single-use. Once it matches, the shipment moves
              out of the hand-off queue and onto the runner.
            </p>
          </div>
        </form>
      </AppModal.Content>

      {/* Status bar — waiting vs. matched, with the release action. */}
      <AppModal.Footer className="tw:border-t tw:border-slate-200 tw:bg-white">
        <div className="tw:flex tw:w-full tw:items-center tw:gap-3">
          <div className="tw:min-w-0 tw:flex-1">
            <span
              className={clsx(
                "tw:block tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.12em]",
                complete ? "tw:text-emerald-600" : "tw:text-slate-400",
              )}
            >
              {complete ? "Ready to release" : "Waiting for OTP match"}
            </span>
            <p className="tw:text-xs tw:tabular-nums tw:text-slate-500">
              {(otp || "").length}/{OTP_LENGTH} digits entered
            </p>
          </div>

          <AppButton
            type="button"
            onClick={handleSubmit(onSubmit)}
            isLoading={verifying}
            disabled={!complete}
          >
            <Check className="tw:h-4 tw:w-4" />
            Confirm hand-off
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

type OtpBoxesProps = {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
};

const OtpBoxes = ({ value, onChange, error }: OtpBoxesProps) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = (value || "")
    .padEnd(OTP_LENGTH, " ")
    .split("")
    .slice(0, OTP_LENGTH);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      onChange((value || "").slice(0, -1));
      return;
    }
    if (e.key === "Tab") return;
    e.preventDefault();

    if (/^[0-9]$/.test(e.key)) {
      const cursorIndex = Math.min((value || "").length, OTP_LENGTH - 1);
      const next = ((value || "").slice(0, cursorIndex) + e.key).slice(
        0,
        OTP_LENGTH,
      );
      onChange(next);
      if (next.length === OTP_LENGTH) {
        inputRef.current?.blur();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    onChange(raw);
    if (raw.length === OTP_LENGTH) {
      inputRef.current?.blur();
    }
  };

  const activeIndex = Math.min((value || "").length, OTP_LENGTH - 1);

  return (
    <div className="tw:flex tw:w-full tw:justify-center tw:gap-2">
      <div
        className="tw:flex tw:w-full tw:justify-center tw:gap-2"
        onClick={() => inputRef.current?.focus()}
      >
        {digits.map((digit, i) => (
          <div
            key={i}
            className={clsx(
              "tw:flex tw:h-14 tw:flex-1 tw:max-w-14 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-xl tw:border-2 tw:text-2xl tw:font-bold tw:transition-all tw:duration-150",
              focused && i === activeIndex
                ? "tw:border-emerald-600 tw:bg-emerald-50"
                : error
                  ? "tw:border-red-400 tw:bg-red-50"
                  : "tw:border-red-200 tw:bg-red-50/40",
              digit !== " " ? "tw:text-red-700" : "tw:text-transparent",
            )}
          >
            {digit === " " ? (
              <span className="tw:h-1.5 tw:w-1.5 tw:rounded-full tw:bg-slate-300" />
            ) : (
              digit
            )}
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="OTP"
        className="tw:sr-only"
        autoFocus
      />
    </div>
  );
};

export default DeliveryAssignOtpVerifyModal;
