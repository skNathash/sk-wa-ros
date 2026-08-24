import React from "react";
import { Check, Eye, Plus, Star } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import TintTile from "~/components/core/tint/TintTile";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";

interface Theme2DesktopViewProps {
  data: any[];
  callback: (action: { action: string; data: any }) => void;
  loading: boolean;
  showLoadMore: boolean;
  loadedCount: number;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
  /**
   * The list is filtered to connected sellers, so every row is already linked
   * to the buyer — cards show a "Connected" state instead of Connect.
   */
  connectedOnly?: boolean;
  /**
   * Called when the user taps the Connect button on an unlinked seller card.
   */
  onConnect?: (seller: any) => void;
}


const CardSkeleton = () => (
  <div className="tw:rounded-xl tw:bg-white tw:p-3 tw:ring-1 tw:ring-slate-200/70">
    <div className="tw:flex tw:items-center tw:gap-2.5">
      <Skeleton className="tw:h-10 tw:w-10 tw:rounded-full tw:shrink-0" />
      <div className="tw:flex-1 tw:min-w-0">
        <Skeleton className="tw:h-3 tw:w-2/3" />
        <Skeleton className="tw:mt-1.5 tw:h-2.5 tw:w-4/5" />
      </div>
    </div>
    <Skeleton className="tw:mt-2.5 tw:h-2.5 tw:w-1/2" />
    <div className="tw:mt-2.5 tw:grid tw:grid-cols-2 tw:gap-2">
      <Skeleton className="tw:h-6" />
      <Skeleton className="tw:h-6" />
    </div>
    <div className="tw:mt-3 tw:flex tw:gap-1.5">
      <Skeleton className="tw:h-7 tw:flex-1 tw:rounded-lg" />
      <Skeleton className="tw:h-7 tw:flex-1 tw:rounded-lg" />
    </div>
  </div>
);

const Theme2DesktopView: React.FC<Theme2DesktopViewProps> = ({
  data,
  callback,
  loading = false,
  showLoadMore = false,
  loadedCount = 0,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  connectedOnly = false,
  onConnect,
}) => {
  const appNav = useAppNav();

  const gridClass =
    "tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:xl:grid-cols-4 tw:gap-3";

  if (loading && (!data || data.length === 0)) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0)
    return (
      <div className="tw:w-full tw:text-center tw:py-10">
        <div className="tw:text-lg tw:font-semibold tw:text-slate-800">
          No sellers found
        </div>
        <div className="tw:text-sm tw:text-slate-500 tw:mt-1">
          Try adjusting filters or search to broaden results
        </div>
      </div>
    );

  return (
    <>
      <div className={gridClass}>
        {data.map((item, idx) => {
          const rating = item.ratingsSummary?.avgRating;
          const orders = item._orderCount ?? 0;
          const minOrder = Number(item._minOrder) || 0;
          const place = item.city || item.town || item.district || "-";
          // The nearby-sellers row flags an existing buyer link as `isLinked`.
          const isConnected = connectedOnly || Boolean(item.isLinked);

          return (
            <div
              key={item._id || idx}
              className="tw:flex tw:flex-col tw:rounded-xl tw:bg-white tw:p-3 tw:ring-1 tw:ring-slate-200/70 tw:transition-shadow tw:duration-200 tw:hover:shadow-md"
            >
              {/* Identity — avatar, name, place · distance */}
              <div className="tw:flex tw:items-center tw:gap-2.5">
                <button
                  type="button"
                  onClick={() => callback({ action: "viewImages", data: item })}
                  className="tw:shrink-0 tw:rounded-full tw:cursor-pointer tw:focus:outline-none"
                >
                  <TintTile
                    index={item._tintIndex ?? 0}
                    className="tw:h-10 tw:w-10 tw:rounded-full"
                  >
                    {item.shopImg ? (
                      <ImgRender
                        assetId={item.shopImg}
                        className="tw:h-full tw:w-full tw:object-cover"
                      />
                    ) : (
                      <span className="tw:text-sm tw:font-bold">
                        {item._initial || "A"}
                      </span>
                    )}
                  </TintTile>
                </button>

                <div className="tw:min-w-0 tw:flex-1">
                  <button
                    type="button"
                    onClick={() =>
                      appNav.to(
                        `/products/buy-from-other-retailer/retailer/${item._id}`,
                      )
                    }
                    className="tw:block tw:w-full tw:truncate tw:text-left tw:text-[13px] tw:font-bold tw:text-slate-900 tw:cursor-pointer"
                  >
                    {item.name}
                  </button>
                  <div className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:text-slate-500">
                    {place}
                    {item.distanceToFranchiseKm != null && (
                      <> · {item.distanceToFranchiseKm.toFixed(1)}km</>
                    )}
                  </div>
                </div>
              </div>

              {/* Reputation */}
              <div className="tw:mt-2.5 tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-slate-500">
                {rating != null ? (
                  <>
                    <Star
                      size={11}
                      className="tw:fill-amber-400 tw:text-amber-400"
                    />
                    <span className="tw:font-bold tw:text-slate-900">
                      {rating.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <span className="tw:text-slate-400">Not rated yet</span>
                )}
                <span>·</span>
                <span>
                  {orders} order{orders === 1 ? "" : "s"}
                </span>
              </div>

              {/* Min order */}
              <div className="tw:mt-2.5 tw:flex tw:items-center tw:justify-between">
                <div className="app-label tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-slate-400">
                  Min order
                </div>
                <div className="tw:text-[12px] tw:font-semibold tw:text-slate-800">
                  {minOrder > 0 ? (
                    <Amount value={minOrder} decimalPlaces={0} />
                  ) : (
                    "No minimum"
                  )}
                </div>
              </div>

              {/* Membership / credit badges */}
              <div className="tw:mt-2.5 tw:flex tw:flex-wrap tw:gap-1">
                {item._networkLbl && (
                  <AppBadge variant={item._networkColor} size="sm">
                    {item._networkLbl}
                  </AppBadge>
                )}
                {item.paylaterInfo && (
                  <AppBadge variant="secondary" size="sm">
                    Paylater
                  </AppBadge>
                )}
              </div>

              {/* Actions — pinned to the card foot so buttons line up across
                  a row of cards with differing badge counts. */}
              <div className="tw:mt-auto tw:flex tw:gap-1.5 tw:pt-3">
                <button
                  type="button"
                  onClick={() =>
                    appNav.to(
                      `/products/buy-from-other-retailer/retailer/${item._id}?tab=catalog`,
                    )
                  }
                  className="tw:flex tw:h-7 tw:flex-1 tw:items-center tw:justify-center tw:gap-1 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:text-[11px] tw:font-semibold tw:text-slate-700 tw:cursor-pointer tw:transition-colors tw:hover:bg-slate-50"
                >
                  <Eye size={12} />
                  View catalog
                </button>
                {isConnected ? (
                  <div className="tw:flex tw:h-7 tw:flex-1 tw:items-center tw:justify-center tw:gap-1 tw:rounded-lg tw:bg-emerald-50 tw:text-[11px] tw:font-semibold tw:text-emerald-700 tw:ring-1 tw:ring-emerald-200">
                    <Check size={12} />
                    Connected
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onConnect?.(item)}
                    className="tw:flex tw:h-7 tw:flex-1 tw:items-center tw:justify-center tw:gap-1 tw:rounded-lg tw:bg-primary tw:text-[11px] tw:font-semibold tw:text-primary-foreground tw:cursor-pointer tw:transition-opacity tw:hover:opacity-90"
                  >
                    <Plus size={12} />
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showLoadMore && (
        <div className="tw:mt-4 tw:flex tw:justify-center">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount || 0}
            loadedCount={loadedCount || 0}
          />
        </div>
      )}
    </>
  );
};

export default Theme2DesktopView;
