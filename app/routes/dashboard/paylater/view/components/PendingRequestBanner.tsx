import { ArrowRight, BellRing } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import Rbac from "~/components/core/rbac/Rbac";

interface PendingRequestBannerProps {
  request: any;
  /** Opens the guided review flow. */
  onReview: () => void;
}

/**
 * The ask, called out above the detail card while the request is still
 * undecided: how much, for how long, and why. The button opens the guided
 * review; the footer's approve/reject stay available for a straight decision.
 */
const PendingRequestBanner = ({
  request,
  onReview,
}: PendingRequestBannerProps) => {
  const amount = Number(request?.requestedLimit ?? request?.creditLimit) || 0;

  return (
    <div className="tw:mb-4 tw:flex tw:flex-col tw:gap-3 tw:rounded-xl tw:bg-amber-50 tw:p-4 tw:md:flex-row tw:md:items-center tw:md:justify-between">
      <div className="tw:flex tw:min-w-0 tw:items-start tw:gap-3">
        <div className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-amber-400 tw:text-white">
          <BellRing size={18} />
        </div>

        <div className="tw:min-w-0">
          <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-amber-700">
            Pending request
            {request?.createdAt ? (
              <span className="tw:ml-1">
                ·{" "}
                <DateFormat value={request.createdAt} formatStr="dd MMM yyyy" />
              </span>
            ) : null}
          </p>

          <p className="tw:mt-0.5 tw:text-base tw:font-bold tw:text-slate-900">
            {request?.userInfo?.name || "This buyer"} is asking for{" "}
            {amount ? <Amount value={amount} decimalPlaces={0} /> : "a"}{" "}
            PayLater
            {request?.validityPeriod ? ` · ${request.validityPeriod}` : ""}
          </p>

          {request?.reason ? (
            <p className="tw:mt-0.5 tw:truncate tw:text-sm tw:italic tw:text-amber-800">
              &quot;{request.reason}&quot;
            </p>
          ) : null}
        </div>
      </div>

      <Rbac roles={["ACCOUNTS.PAYLATER-REQUEST-REVIEW"]}>
        <AppButton
          color="warning"
          className="tw:shrink-0 tw:font-semibold"
          onClick={onReview}
        >
          Review request
          <ArrowRight size={14} />
        </AppButton>
      </Rbac>
    </div>
  );
};

export default PendingRequestBanner;
