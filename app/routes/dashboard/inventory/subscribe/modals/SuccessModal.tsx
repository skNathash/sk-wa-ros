import { Check, Sparkles } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";

interface props {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  showViewRequestButton?: boolean;
  title?: string;
  description?: React.ReactNode;
  primaryActionLabel?: string;
  primaryAction?: string;
  secondaryActionLabel?: string;
}

const SuccessModal: React.FC<props> = ({
  show,
  callback,
  showViewRequestButton = true,
  title = "Request Submitted!",
  description = (
    <>
      Your request has been submitted successfully. Our team will review your
      request and get back to you shortly.
    </>
  ),
  primaryActionLabel = "View Requests",
  primaryAction = "view-requests",
  secondaryActionLabel = "Close",
}) => {
  const handleClose = () => callback({ action: "close" });

  const handlePrimaryAction = () => {
    callback({ action: primaryAction });
  };

  return (
    <AppModal show={show} callback={callback} noPadding overFlowHidden>
      <AppModal.Content noPadding>
        <div className="tw:relative tw:overflow-hidden">
          {/* Decorative gradient banner */}
          <div className="tw:relative tw:h-28 tw:sm:h-32 tw:bg-linear-to-br tw:from-emerald-500 tw:via-emerald-400 tw:to-teal-500 tw:overflow-hidden">
            <div className="tw:absolute tw:-top-10 tw:-right-10 tw:h-40 tw:w-40 tw:rounded-full tw:bg-white/15 tw:blur-2xl" />
            <div className="tw:absolute tw:-bottom-14 tw:-left-6 tw:h-36 tw:w-36 tw:rounded-full tw:bg-white/10 tw:blur-2xl" />
            <div className="tw:absolute tw:inset-0 tw:opacity-20 tw:bg-[radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] tw:bg-size-[18px_18px]" />
            <Sparkles
              className="tw:absolute tw:top-4 tw:right-6 tw:text-white/70"
              size={18}
            />
            <Sparkles
              className="tw:absolute tw:top-10 tw:right-16 tw:text-white/50"
              size={12}
            />
            <Sparkles
              className="tw:absolute tw:bottom-6 tw:left-10 tw:text-white/60"
              size={14}
            />
          </div>

          {/* Floating check badge */}
          <div className="tw:relative tw:-mt-12 tw:flex tw:justify-center">
            <div className="tw:relative">
              <div className="tw:absolute tw:inset-0 tw:rounded-full tw:bg-emerald-400/30 tw:blur-xl tw:animate-pulse" />
              <div className="tw:relative tw:flex tw:h-24 tw:w-24 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:shadow-lg tw:ring-1 tw:ring-emerald-100">
                <div className="tw:flex tw:h-18 tw:w-18 tw:items-center tw:justify-center tw:rounded-full tw:bg-linear-to-br tw:from-emerald-500 tw:to-teal-500 tw:p-4 tw:shadow-md tw:shadow-emerald-500/30">
                  <Check
                    size={36}
                    strokeWidth={3}
                    className="tw:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Title + description */}
          <div className="tw:px-5 tw:sm:px-8 tw:pt-5 tw:pb-2 tw:text-center">
            <h2 className="tw:text-xl tw:sm:text-2xl tw:font-semibold tw:text-gray-900 tw:tracking-tight">
              {title}
            </h2>
            <div className="tw:mt-2 tw:text-sm tw:sm:text-[15px] tw:leading-relaxed tw:text-gray-500 tw:max-w-md tw:mx-auto">
              {description}
            </div>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:border-t tw:border-gray-100 tw:bg-gray-50/60">
        <div
          className={`tw:w-full tw:flex tw:flex-col-reverse tw:sm:flex-row tw:items-stretch tw:sm:items-center tw:gap-2 tw:sm:gap-3 ${
            secondaryActionLabel
              ? showViewRequestButton
                ? "tw:sm:justify-between"
                : "tw:sm:justify-end"
              : "tw:sm:justify-end"
          }`}
        >
          {secondaryActionLabel ? (
            <AppButton
              color="light"
              fill="outline"
              onClick={handleClose}
              className="tw:w-full tw:sm:w-auto"
            >
              {secondaryActionLabel}
            </AppButton>
          ) : null}

          {showViewRequestButton ? (
            <AppButton
              color="primary"
              onClick={handlePrimaryAction}
              className="tw:w-full tw:sm:w-auto"
            >
              {primaryActionLabel}
            </AppButton>
          ) : (
            <AppButton
              color="success"
              onClick={handlePrimaryAction}
              className="tw:w-full tw:sm:w-auto"
            >
              {primaryActionLabel}
            </AppButton>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SuccessModal;
