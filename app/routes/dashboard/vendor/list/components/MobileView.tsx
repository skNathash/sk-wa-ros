import { AlertTriangle, MapPin, Phone } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import { useTranslation } from "react-i18next";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

const MobileView = ({
  item,
  callback,
}: {
  item: Record<string, any>;
  callback: (a: { action: string; data: Record<string, any> }) => void;
}) => {
  const { t } = useTranslation(["common"]);

  const mobile = item._contact?.mobile || item.mobile || "";

  const unpaidValue = item.summary?.unpaidValue || 0;
  const hasDue = unpaidValue > 0;
  const hasAlert =
    (item.summary?.pendingDeliveries || 0) > 0 ||
    (item.summary?.unpaidInvoices || 0) > 0;

  const avatarLetter = (item.name?.trim()?.[0] || "#").toUpperCase();

  const handleClick = () => {
    callback({ action: "view", data: item });
  };

  return (
    <div
      className="tw:cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      <AppCard
        className="tw:mb-3 tw:transition-shadow hover:tw:shadow-sm"
        noPadding={true}
      >
        <div className="tw:flex tw:items-start tw:gap-3 tw:p-3">
          {/* Initial badge */}
          <div className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-[#efe8dd] tw:text-sm tw:font-bold tw:text-stone-700">
            {avatarLetter}
          </div>

          {/* Identity + alert */}
          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <span className="tw:min-w-0 tw:truncate tw:font-medium tw:text-base tw:text-gray-900">
                {item.name}
              </span>
              {hasAlert && (
                <span className="tw:h-2 tw:w-2 tw:shrink-0 tw:rounded-full tw:bg-amber-500" />
              )}
            </div>

            <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-500">
              {item._vendorType && (
                <VendorTypeBadge
                  type={item._vendorType}
                  color={item._vendorTypeColor}
                  // No info popover here — the whole card is a tap target that
                  // navigates to the vendor, so a nested trigger would fight it.
                  hideInfo
                  size="xs"
                  className="tw:shrink-0"
                />
              )}
              {mobile && (
                <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:shrink-0">
                  <Phone size={12} className="tw:shrink-0 tw:text-gray-400" />
                  {mobile}
                </span>
              )}
              {mobile && <span className="tw:text-gray-300">·</span>}
              <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:shrink-0">
                <MapPin size={12} className="tw:shrink-0 tw:text-gray-400" />
                {item._distance ?? "--"} km
              </span>
            </div>

            {hasAlert && (
              <div className="tw:mt-1.5 tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-amber-700">
                <AlertTriangle size={12} className="tw:shrink-0" />
                <span>
                  {(item.summary?.unpaidInvoices || 0) > 0
                    ? `${item.summary?.unpaidInvoices} ${t("unpaid")}`
                    : `${item.summary?.pendingDeliveries} ${t("pendingDeliveries")}`}
                </span>
              </div>
            )}
          </div>

          {/* Amount + status */}
          <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:text-right">
            {hasDue ? (
              <>
                <Amount
                  value={unpaidValue}
                  decimalPlaces={0}
                  className="tw:font-bold tw:text-base tw:text-red-600"
                />
                <span className="app-label tw:mt-0.5 tw:text-red-600">
                  {t("due")}
                </span>
              </>
            ) : (
              <>
                <span className="tw:font-bold tw:text-base tw:text-gray-900">
                  --
                </span>
                <span className="app-label tw:mt-0.5 tw:text-gray-400">
                  {t("nil")}
                </span>
              </>
            )}
          </div>
        </div>
      </AppCard>
    </div>
  );
};

export default MobileView;
