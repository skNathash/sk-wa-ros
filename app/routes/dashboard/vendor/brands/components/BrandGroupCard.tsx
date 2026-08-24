import { ArrowRight, MapPin, Tag } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import { cn } from "~/lib/utils";
import { brandAccents, type BrandGroup, type BrandVendor } from "../helper";

/**
 * One brand group in the "Vendors by brand" view — brand header row (tag icon,
 * name, vendor count, "See all") over a horizontal row of vendor mini cards.
 * Vendors this retailer has already bought the brand from get a BOUGHT ribbon
 * and the brand's accent border.
 */

const VendorMiniCard = ({
  vendor,
  accent,
  onClick,
}: {
  vendor: BrandVendor;
  accent: (typeof brandAccents)[string];
  onClick: () => void;
}) => {
  const initials = vendor.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      className={cn(
        "tw:relative tw:min-w-36 tw:shrink-0 tw:cursor-pointer tw:rounded-lg tw:border tw:bg-stone-50 tw:px-3 tw:py-2.5 tw:transition-shadow tw:hover:shadow-sm",
        vendor.purchasedBefore ? accent.cardBorder : "tw:border-gray-200",
      )}
    >
      {vendor.purchasedBefore && (
        <span className="tw:absolute tw:-top-2.5 tw:left-2 tw:rounded-sm tw:bg-amber-300 tw:px-1.5 tw:py-px tw:text-[9px] tw:font-bold tw:tracking-wide tw:text-amber-900">
          BOUGHT
        </span>
      )}
      <div className="tw:flex tw:items-center tw:gap-1.5">
        <span
          className={cn(
            "tw:inline-flex tw:h-6 tw:min-w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-sm tw:px-0.5 tw:text-[9px] tw:font-bold",
            accent.chipBg,
            accent.chipText,
          )}
        >
          {initials}
        </span>
        <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
          {vendor.name}
        </span>
      </div>
      <div className="tw:mt-1.5 tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
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
  );
};

const BrandGroupCard = ({
  group,
  callback,
}: {
  group: BrandGroup;
  callback: (a: { action: string; data: Record<string, any> }) => void;
}) => {
  const accent = brandAccents[group.accent] || brandAccents.green;

  return (
    <AppCard
      className={cn("tw:mb-3 tw:border-l-4", accent.border)}
      noPadding
    >
      <div className="tw:p-3">
        {/* Brand header row */}
        <div className="tw:flex tw:items-center tw:gap-1.5">
          <Tag size={14} className={cn("tw:shrink-0", accent.chipText)} />
          <span className="app-heading-serif tw:font-bold tw:text-base tw:text-gray-900">
            {group.name}
          </span>
          <span className="tw:text-gray-300">·</span>
          <span className="tw:text-xs tw:text-gray-500">
            {group.vendorCount} {group.vendorCount === 1 ? "vendor" : "vendors"}
          </span>
          <button
            type="button"
            onClick={() => callback({ action: "seeAll", data: group })}
            className="tw:ml-auto tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-primary tw:cursor-pointer"
          >
            See all
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Vendor mini cards — horizontal scroll when they overflow. Top
            padding (not margin) leaves room for the overlapping BEST ribbon
            while keeping all cards top-aligned. */}
        <div className="tw:mt-1 tw:flex tw:items-start tw:gap-2 tw:overflow-x-auto tw:pt-2.5 tw:pb-1 tw:[scrollbar-width:none]">
          {group.vendors.map((vendor) => (
            <VendorMiniCard
              key={vendor._id}
              vendor={vendor}
              accent={accent}
              onClick={() => callback({ action: "view", data: vendor })}
            />
          ))}
        </div>
      </div>
    </AppCard>
  );
};

export default BrandGroupCard;
