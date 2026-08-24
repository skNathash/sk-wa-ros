import {
  CalendarClock,
  CheckCheck,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppCard from "~/components/core/card/AppCard";

interface ShiplaterApprovalProps {
  shiplaterRequest: {
    createdAt: string;
    createdBy: {
      name: string;
      id: string;
      userType: string;
    };
    expectedDeliveryDate: string;
    reason: string;
    status: string;
    respondedAt?: string;
    respondedBy?: {
      name?: string;
    };
    cancelledAt?: string;
    cancelledBy?: {
      name?: string;
    };
    cancelRemarks?: string;
    remarks?: string;
  };
  onApprove?: () => void;
  onReject?: () => void;
}

const ShiplaterApproval = ({
  shiplaterRequest,
  onApprove,
  onReject,
}: ShiplaterApprovalProps) => {
  const { t } = useTranslation(["common"]);
  const isPending = shiplaterRequest.status === "Pending";
  const isApproved = shiplaterRequest.status === "Approved";
  const isCancelled = shiplaterRequest.status === "Cancelled";

  if (!isPending) {
    const actorName = isCancelled
      ? shiplaterRequest.cancelledBy?.name
      : shiplaterRequest.respondedBy?.name;
    const actorAt = isCancelled
      ? shiplaterRequest.cancelledAt
      : shiplaterRequest.respondedAt;
    const statusLabel = isApproved
      ? t("approved")
      : isCancelled
        ? t("cancelled")
        : t("rejected");
    const reasonText = isCancelled
      ? shiplaterRequest.cancelRemarks || shiplaterRequest.remarks
      : shiplaterRequest.reason;
    return (
      <AppCard
        noPadding
        className={`tw:mb-3 tw:rounded-md tw:border ${
          isApproved
            ? "tw:border-green-300 tw:bg-green-50/80"
            : "tw:border-red-300 tw:bg-red-50/80"
        }`}
      >
        <div className="tw:px-2.5 tw:py-1.5 tw:flex tw:items-center tw:gap-2">
          {isApproved ? (
            <CheckCircle size={14} className="tw:text-green-600 tw:shrink-0" />
          ) : (
            <XCircle size={14} className="tw:text-red-600 tw:shrink-0" />
          )}
          <div className="tw:flex-1 tw:text-xs">
            <span
              className={`tw:font-semibold ${
                isApproved ? "tw:text-green-700" : "tw:text-red-700"
              }`}
            >
              {t("shipLaterRequest")} {statusLabel}
            </span>
            {actorName && (
              <span className="tw:text-gray-500">
                {" "}
                {t("by")} {actorName}
              </span>
            )}
            {actorAt && (
              <span className="tw:text-gray-400">
                {" "}
                · <DateFormat value={actorAt} />
              </span>
            )}
            {reasonText && (
              <div className="tw:text-gray-600 tw:mt-0.5">
                <span className="tw:text-gray-500">{t("reason")}:</span>{" "}
                <span className="tw:font-medium">{reasonText}</span>
              </div>
            )}
          </div>
        </div>
      </AppCard>
    );
  }

  return (
    <AppCard
      noPadding
      className="tw:mb-3 tw:rounded-lg tw:border tw:border-amber-200/80 tw:bg-white tw:overflow-hidden tw:relative tw:shadow-sm"
    >
      <div className="tw:h-1 tw:bg-linear-to-r tw:from-amber-300 tw:via-orange-400 tw:to-amber-500" />
      <div
        className="tw:absolute tw:inset-0 tw:opacity-[0.035] tw:pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(180 83 9) 1px, transparent 0)",
          backgroundSize: "14px 14px",
        }}
      />
      <div className="tw:absolute tw:-top-16 tw:-right-16 tw:w-48 tw:h-48 tw:bg-amber-200/30 tw:rounded-full tw:blur-3xl tw:pointer-events-none" />
      <div className="tw:relative tw:px-3.5 tw:py-2.5">
        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-start tw:sm:justify-between tw:gap-2 tw:mb-2">
          <div className="tw:min-w-0">
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
                {t("shipLaterRequest")}
              </h3>
              <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-amber-800 tw:font-semibold tw:bg-amber-100 tw:border tw:border-amber-200 tw:px-1.5 tw:py-0.5 tw:rounded tw:shrink-0">
                {t("actionRequired")}
              </span>
            </div>
            <p className="tw:text-[11px] tw:text-gray-500 tw:leading-snug tw:mt-0.5">
              {t("shipLaterExplanation")}
            </p>
          </div>
          <div className="tw:flex tw:gap-1.5 tw:shrink-0 tw:sm:justify-end">
            <AppButton
              color="danger"
              fill="outline"
              size="small"
              onClick={onReject}
            >
              <XCircle size={14} />
              {t("reject")}
            </AppButton>
            <AppButton color="success" size="small" onClick={onApprove}>
              <CheckCheck size={14} />
              {t("accept")}
            </AppButton>
          </div>
        </div>

        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-stretch tw:gap-3 tw:pt-2 tw:border-t tw:border-gray-100">
          <div className="tw:flex tw:items-center tw:gap-2.5 tw:sm:border-r tw:sm:border-dashed tw:sm:border-amber-200 tw:sm:pr-4">
            <div className="tw:relative tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-md tw:bg-linear-to-br tw:from-amber-400 tw:to-orange-500 tw:shrink-0 tw:shadow-sm tw:shadow-amber-500/30">
              <CalendarClock size={18} className="tw:text-white" />
              <span className="tw:absolute tw:-top-1 tw:-right-1 tw:flex tw:h-2 tw:w-2">
                <span className="tw:absolute tw:inline-flex tw:h-full tw:w-full tw:rounded-full tw:bg-amber-300 tw:opacity-75 tw:animate-ping" />
                <span className="tw:relative tw:inline-flex tw:h-2 tw:w-2 tw:rounded-full tw:bg-amber-500 tw:ring-2 tw:ring-white" />
              </span>
            </div>
            <div className="tw:min-w-0">
              <div className="tw:text-[10px] tw:uppercase tw:tracking-wider tw:text-amber-700/80 tw:font-semibold">
                {t("newDeliveryDate")}
              </div>
              <div className="tw:text-sm tw:font-bold tw:text-gray-900 tw:leading-tight tw:mt-0.5 tw:tracking-tight">
                <DateFormat value={shiplaterRequest.expectedDeliveryDate} />
              </div>
            </div>
          </div>
          <div className="tw:flex tw:flex-1 tw:flex-wrap tw:gap-x-5 tw:gap-y-1.5 tw:text-xs tw:items-center">
            <div className="tw:flex tw:flex-col">
              <span className="tw:text-[10px] tw:uppercase tw:tracking-wider tw:text-gray-400 tw:font-medium">
                {t("requestedBy")}
              </span>
              <span className="tw:text-gray-800 tw:font-medium">
                {shiplaterRequest.createdBy?.name}
              </span>
            </div>
            <div className="tw:flex tw:flex-col">
              <span className="tw:text-[10px] tw:uppercase tw:tracking-wider tw:text-gray-400 tw:font-medium">
                {t("requestedOn")}
              </span>
              <span className="tw:text-gray-800 tw:font-medium">
                <DateFormat value={shiplaterRequest.createdAt} />
              </span>
            </div>
            {shiplaterRequest.reason && (
              <div className="tw:flex tw:flex-col tw:min-w-0 tw:basis-full tw:sm:basis-auto tw:sm:flex-1">
                <span className="tw:text-[10px] tw:uppercase tw:tracking-wider tw:text-gray-400 tw:font-medium">
                  {t("reason")}
                </span>
                <span className="tw:text-gray-800 tw:font-medium tw:wrap-break-word">
                  {shiplaterRequest.reason}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default ShiplaterApproval;
