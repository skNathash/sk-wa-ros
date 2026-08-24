import clsx from "clsx";
import { ChevronRight, MapPin } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import { brandAccents } from "../../brands/helper";
import type { BrandVendor } from "../helper";

/**
 * One vendor supplying the brand. Same visual language as the vendor mini
 * cards in the grouped "Vendors by brand" view (initials chip, city · distance,
 * BOUGHT ribbon + accent border when already purchased from) laid out as a
 * full-width list row.
 */

const VendorCard = ({
  vendor,
  accent = "green",
  callback,
}: {
  vendor: BrandVendor;
  /** Key into `brandAccents` — the brand's accent colour. */
  accent?: string;
  callback: (a: { action: string; data: Record<string, any> }) => void;
}) => {
  const colors = brandAccents[accent] || brandAccents.green;

  const handleClick = () => callback({ action: "view", data: vendor });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
      className="tw:h-full tw:cursor-pointer"
    >
      <AppCard
        className={clsx(
          "tw:relative tw:mb-0 tw:h-full tw:transition-shadow tw:hover:shadow-sm",
          vendor.purchasedBefore && ["tw:border", colors.cardBorder],
        )}
        noPadding
        /* The BOUGHT ribbon sits above the card edge — clipping would eat it. */
        noOverflow
      >
        {vendor.purchasedBefore && (
          <span className="tw:absolute tw:-top-2 tw:left-3 tw:rounded-sm tw:bg-amber-300 tw:px-1.5 tw:py-px tw:text-[9px] tw:font-bold tw:tracking-wide tw:text-amber-900">
            BOUGHT
          </span>
        )}

        <div className="tw:flex tw:items-center tw:gap-3 tw:p-3">
          {/* Initials chip — accent-tinted, matches the brand group cards. */}
          <span
            className={clsx(
              "tw:inline-flex tw:h-9 tw:min-w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:px-1 tw:text-[10px] tw:font-bold",
              colors.chipBg,
              colors.chipText,
            )}
          >
            {vendor.initials}
          </span>

          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <span className="tw:min-w-0 tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                {vendor.name}
              </span>
              {vendor.vendorId && (
                <>
                  <span className="tw:text-gray-300">·</span>
                  <span className="tw:shrink-0 tw:text-xs tw:text-gray-400">
                    {vendor.vendorId}
                  </span>
                </>
              )}
            </div>

            <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
              {vendor.city && (
                <span className="tw:inline-flex tw:min-w-0 tw:items-center tw:gap-0.5">
                  <MapPin size={11} className="tw:shrink-0" />
                  <span className="tw:truncate">{vendor.city}</span>
                </span>
              )}
              {vendor.distanceKm != null && (
                <>
                  {vendor.city && <span className="tw:text-gray-300">·</span>}
                  <span className="tw:shrink-0">{vendor.distanceKm} km</span>
                </>
              )}
            </div>
          </div>

          <ChevronRight size={16} className="tw:shrink-0 tw:text-gray-300" />
        </div>
      </AppCard>
    </div>
  );
};

export default VendorCard;
