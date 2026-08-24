import clsx from "clsx";
import { CheckCircle2, Navigation, Star } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import ImgRender from "~/components/core/img/ImgRender";
import TintTile from "~/components/core/tint/TintTile";
import SellerPaylaterStatus from "../seller-paylater-status/SellerPaylaterStatus";

interface SellerItemProps {
  /** Seller row from `getRetailersNearby` / `formatSeller`. */
  seller: any;
  /** Row is the seller currently open in the main pane. */
  active?: boolean;
  /** Seller is in the logged-in franchise's connected list. */
  connected?: boolean;
  onClick?: (seller: any) => void;
  className?: string;
}

/** Two-letter initials — first letters of the first two name words. */
const getInitials = (name?: string) => {
  const words = (name || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean);
  if (!words.length) return "S";
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
};

/**
 * One seller row in the retailer side-pane list.
 *
 * Follows the vendor side-pane row design (see
 * shared/vendor/components/vendor-side-pane/vendors/Vendors.tsx): round
 * avatar, name + meta line on the left, a value column on the right — here
 * the seller's PayLater position instead of the vendor's outstanding due.
 */
const SellerItem: React.FC<SellerItemProps> = ({
  seller,
  active = false,
  connected = false,
  onClick,
  className = "",
}) => {
  const location = seller.city || seller.town || seller.district || "-";
  const tier = seller.tier || seller.membershipTier || seller.subscriptionTier;

  return (
    <button
      type="button"
      onClick={() => onClick?.(seller)}
      className={clsx(
        "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-2.5 tw:border-b tw:border-slate-100 tw:px-4 tw:py-2.5 tw:text-left tw:transition-colors",
        active ? "app-list-row-active" : "tw:hover:bg-slate-50",
        className,
      )}
    >
      <span className="tw:relative tw:shrink-0">
        {seller.shopImg ? (
          <ImgRender
            assetId={seller.shopImg}
            className="tw:size-9 tw:shrink-0 tw:rounded-full tw:object-cover"
          />
        ) : (
          <TintTile
            index={seller._tintIndex ?? 0}
            className="tw:size-9 tw:rounded-full tw:text-[11px] tw:font-bold"
          >
            {seller._initial || getInitials(seller.name)}
          </TintTile>
        )}
        {connected && (
          <span className="tw:absolute tw:-right-0.5 tw:-bottom-0.5 tw:flex tw:size-4 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:text-emerald-500">
            <CheckCircle2 size={14} className="tw:fill-white" />
          </span>
        )}
      </span>

      <span className="tw:min-w-0 tw:flex-1">
        <span className="tw:flex tw:items-center tw:gap-1.5">
          <span
            className={clsx(
              "tw:block tw:min-w-0 tw:truncate tw:text-sm tw:font-semibold",
              // The tint + left rule carry the selection; the label stays
              // dark like the rest of the list.
              active ? "tw:text-slate-900" : "tw:text-slate-800",
            )}
          >
            {seller.name}
          </span>
          {tier ? (
            <AppBadge
              variant="warning"
              size="sm"
              className="tw:shrink-0 tw:uppercase tw:tracking-wide"
            >
              {tier}
            </AppBadge>
          ) : seller._networkLbl ? (
            <AppBadge
              variant={seller._networkColor || "light"}
              size="sm"
              className="tw:shrink-0"
            >
              {seller._networkLbl}
            </AppBadge>
          ) : null}
        </span>

        <span className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-slate-500">
          <span className="tw:truncate">{location}</span>
          {seller.distanceToFranchiseKm != null && (
            <>
              <span className="tw:text-slate-300">•</span>
              <span className="tw:flex tw:shrink-0 tw:items-center tw:gap-0.5 tw:whitespace-nowrap">
                <Navigation size={9} />
                {seller.distanceToFranchiseKm.toFixed(1)}km
              </span>
            </>
          )}
          {seller.ratingsSummary?.avgRating != null && (
            <>
              <span className="tw:text-slate-300">•</span>
              <span className="tw:flex tw:shrink-0 tw:items-center tw:gap-0.5">
                <Star size={9} className="tw:fill-amber-400 tw:text-amber-400" />
                {seller.ratingsSummary.avgRating.toFixed(1)}
              </span>
            </>
          )}
        </span>
      </span>

      {/* Value column — PayLater availability / pending, mirrors the vendor
          row's outstanding-due column. */}
      <SellerPaylaterStatus seller={seller} className="tw:shrink-0 tw:pl-3" />
    </button>
  );
};

export default SellerItem;
