import { CalendarDays, CheckCircle2, XCircle, Clock } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import { useTranslation } from "react-i18next";

interface RequestInfo {
  status?: string;
  requestMessage?: string;
  responseMessage?: string;
  createdAt?: Date;
  approvedAt?: Date;
}

interface RequestStatusProps {
  request?: RequestInfo | null;
}

const RequestStatus: React.FC<RequestStatusProps> = ({ request }) => {
  const { t } = useTranslation();
  const status = request?.status || "";
  if (!status) return null;

  const isRejected = status === "Rejected";
  const isApproved = status === "Approved";
  const borderLeftClass = isRejected
    ? "tw:border-l-4 tw:border-l-red-500"
    : isApproved
    ? "tw:border-l-4 tw:border-l-green-500"
    : "tw:border-l-4 tw:border-l-amber-500";

  return (
    <AppCard
      title={t("requestStatus")}
      className={"tw:mb-4 " + borderLeftClass}
    >
      <div className="tw:flex tw:flex-col tw:gap-2">
        {/* Top row: Status badge aligned right on wide, stacked on small */}
        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-start tw:sm:items-center tw:justify-between tw:gap-2">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-600">
            <CalendarDays className="tw:w-3.5 tw:h-3.5 tw:text-gray-500" />
            <span>{t("requested")}</span>
            <span className="tw:text-gray-900 tw:font-medium tw:text-[12px]">
              {request?.createdAt ? (
                <DateFormat
                  value={request?.createdAt}
                  formatStr="dd MMM yyyy, hh:mm a"
                />
              ) : (
                "-"
              )}
            </span>
          </div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="tw:text-[11px] tw:text-gray-500">
              {t("status")}
            </span>
            <span
              role="status"
              aria-live="polite"
              className={
                "tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[12px] tw:px-3 tw:py-1 tw:rounded-md tw:border tw:font-semibold " +
                (isRejected
                  ? "tw:bg-red-50 tw:text-red-700 tw:border-red-200"
                  : isApproved
                  ? "tw:bg-green-50 tw:text-green-700 tw:border-green-200"
                  : "tw:bg-amber-50 tw:text-amber-800 tw:border-amber-200")
              }
            >
              {isRejected ? (
                <XCircle className="tw:w-4 tw:h-4" />
              ) : isApproved ? (
                <CheckCircle2 className="tw:w-4 tw:h-4" />
              ) : (
                <Clock className="tw:w-4 tw:h-4" />
              )}
              <span className="tw:uppercase">{status}</span>
            </span>
          </div>
        </div>

        {/* Secondary row: Approved On (only if approved) */}
        {isApproved && request?.approvedAt ? (
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-600">
            <CalendarDays className="tw:w-3.5 tw:h-3.5 tw:text-gray-500" />
            <span>{t("approved")}</span>
            <span className="tw:text-gray-900 tw:font-medium tw:text-[12px]">
              <DateFormat
                value={request.approvedAt}
                formatStr="dd MMM yyyy, hh:mm a"
              />
            </span>
          </div>
        ) : null}

        {/* Remarks shown compact only for rejected */}
        {isRejected ? (
          <div className="tw:flex tw:flex-col tw:gap-1">
            <span className="tw:text-gray-600 tw:text-xs">{t("remarks")}</span>
            <div className="tw:text-[13px] tw:text-gray-900 tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-md tw:px-2.5 tw:py-2 tw:leading-5">
              {request?.responseMessage || request?.requestMessage || "-"}
            </div>
          </div>
        ) : null}
      </div>
    </AppCard>
  );
};

export default RequestStatus;
