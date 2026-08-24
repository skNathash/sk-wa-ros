import clsx from "clsx";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import type { SellerDeal } from "~/types/CommonTypes";
import { getBrandDeals } from "../../helper";

/** Kept module-level — AppSwiper re-inits when the config identity changes. */
const RAIL_SWIPER = {
  slidesPerView: "auto" as const,
  spaceBetween: 10,
  freeMode: true,
};

export interface BrandDealsProps {
  /** Brand the rail is pulled from — usually `deal.brand._id`. */
  brandId: string;
  /** Product currently on screen; dropped so it isn't shown twice. */
  excludeDealId?: string;
  /** Block heading — the brand name reads better than a generic label. */
  title?: string;
  /** How many deals to pull. */
  count?: number;
  className?: string;
}

/**
 * A horizontal rail of other products carrying the same brand. It takes the
 * slot the "Available variants" list occupies on grouped products, so an
 * ungrouped product still offers somewhere to go from the identity column
 * instead of leaving a gap.
 */
const BrandDeals = ({
  brandId,
  excludeDealId,
  title = "More from this brand",
  count = 10,
  className,
}: BrandDealsProps) => {
  const appNav = useAppNav();

  const [deals, setDeals] = useState<SellerDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getBrandDeals(brandId, { count, excludeDealId }).then((data) => {
      if (!active) return;
      setDeals(data as SellerDeal[]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [brandId, count, excludeDealId]);

  // Nothing to show once loaded — leave the slot empty rather than heading it.
  if (!brandId || (!loading && deals.length === 0)) return null;

  return (
    <section className={className}>
      <h3 className="tw:mb-2 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        {title}
      </h3>

      {loading ? (
        <div className="tw:flex tw:gap-2.5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`bd-skeleton-${idx}`}
              className="tw:w-36 tw:shrink-0 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-2.5"
            >
              <Skeleton className="tw:h-20 tw:w-full tw:rounded-lg" />
              <Skeleton className="tw:mt-2 tw:h-3.5 tw:w-4/5" />
              <Skeleton className="tw:mt-1 tw:h-3.5 tw:w-1/2" />
              <Skeleton className="tw:mt-1 tw:h-4 tw:w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <AppSwiper config={RAIL_SWIPER}>
          {deals.map((deal) => (
            <AppSwiper.Slide key={deal._id} isAutoWidth>
              <button
                type="button"
                onClick={() =>
                  appNav.to(`/dashboard/inventory/products/view/${deal._id}`)
                }
                className={clsx(
                  "tw:flex tw:h-full tw:w-36 tw:cursor-pointer tw:flex-col tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-2.5 tw:text-left tw:transition-colors",
                  "hover:tw:border-slate-300 hover:tw:bg-slate-50",
                )}
              >
                <span className="tw:flex tw:h-20 tw:w-full tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-lg tw:bg-slate-50">
                  {deal.images?.[0] ? (
                    <ImgRender
                      assetId={deal.images[0]}
                      alt={deal.name}
                      size="200"
                      className="tw:h-full tw:w-full tw:object-contain"
                    />
                  ) : (
                    <Package size={20} className="tw:text-slate-300" />
                  )}
                </span>

                {/* Fixed two-line box + bottom-pinned price keeps every card
                    the same height whether the name wraps or the MRP is absent. */}
                <span className="tw:mt-2 tw:line-clamp-2 tw:min-h-8 tw:text-xs tw:font-semibold tw:text-slate-800">
                  {deal.name}
                </span>

                <span className="tw:mt-auto tw:pt-1 tw:text-xs tw:font-bold tw:text-slate-900">
                  {deal.mrp > 0 ? <Amount value={deal.mrp} decimalPlaces={0} /> : " "}
                </span>
              </button>
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      )}
    </section>
  );
};

export default BrandDeals;
