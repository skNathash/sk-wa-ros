import { MessageCircle, Phone } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import CommonService from "~/services/CommonService";

interface BuyerSummaryProps {
  request: any;
}

/**
 * Who the request is for, at the top of the view — the buyer's identity line
 * with the two ways to reach them. The detail card below still carries every
 * field; this is the header the reviewer reads first.
 */
const BuyerSummary = ({ request }: BuyerSummaryProps) => {
  const user = request?.userInfo || {};
  const mobile = user?.mobile || "";
  const digits = String(mobile).replace(/\D/g, "");

  const handleCall = () => {
    if (!digits) return;
    CommonService.windowOpenHandler(`tel:${mobile}`, () => {});
  };

  const handleMessage = () => {
    if (!digits) return;
    CommonService.windowOpenHandler(
      CommonService.prepareWhatsappMessage("", digits),
      () => {},
    );
  };

  return (
    <div className="tw:mb-4 tw:flex tw:flex-col tw:gap-3 tw:rounded-xl tw:bg-white tw:p-4 tw:shadow-sm tw:md:flex-row tw:md:items-start tw:md:justify-between">
      <div className="tw:flex tw:min-w-0 tw:items-start tw:gap-3">
        {user?.photo ? (
          <ImgRender
            assetId={user.photo}
            alt={user?.name || "Buyer"}
            className="tw:h-14 tw:w-14 tw:shrink-0 tw:rounded-xl tw:object-cover"
          />
        ) : (
          <div className="tw:flex tw:h-14 tw:w-14 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-sky-500 tw:text-lg tw:font-bold tw:text-white">
            {CommonService.prepareInitials(user?.name)}
          </div>
        )}

        <div className="tw:min-w-0">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <h1 className="tw:truncate tw:text-xl tw:font-bold tw:text-slate-900">
              {user?.name || "-"}
            </h1>
            {request?.userCategory ? (
              <AppBadge variant="secondary">{request.userCategory}</AppBadge>
            ) : null}
            {request?._statusLbl ? (
              <AppBadge variant={request?._statusColor || "default"}>
                {request._statusLbl}
              </AppBadge>
            ) : null}
            {request?.kycStatus ? (
              <AppBadge variant={request?.kycStatusColor || "default"}>
                KYC {request.kycStatus}
              </AppBadge>
            ) : null}
          </div>

          {/* Where they are and how long they have been buying. */}
          <p className="tw:mt-1 tw:text-sm tw:text-slate-500">
            {user?._formattedAddress || "-"}
            {request?.createdAt ? (
              <span className="tw:ml-1">
                · buyer since{" "}
                <DateFormat
                  value={user?.createdAt || request.createdAt}
                  formatStr="MMM yyyy"
                />
              </span>
            ) : null}
          </p>

          <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-1 tw:text-xs tw:text-slate-500">
            {mobile ? (
              <span className="tw:flex tw:items-center tw:gap-1">
                <Phone size={12} />
                {mobile}
              </span>
            ) : null}
            {user?.gstNumber ? <span>GSTIN {user.gstNumber}</span> : null}
            {request?.franchiseInfo?.name ? (
              <span>Seller · {request.franchiseInfo.name}</span>
            ) : null}
          </div>
        </div>
      </div>

      {digits ? (
        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
          <AppButton
            size="small"
            color="light"
            fill="outline"
            onClick={handleMessage}
          >
            <MessageCircle size={14} />
            Message
          </AppButton>
          <AppButton
            size="small"
            color="light"
            fill="outline"
            onClick={handleCall}
          >
            <Phone size={14} />
            Call
          </AppButton>
        </div>
      ) : null}
    </div>
  );
};

export default BuyerSummary;
