import clsx from "clsx";
import { ChevronRight, Package } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import { getSimilarProducts, type SimilarProduct } from "./helper";

/** Rows revealed per page — the endpoint hands back the whole set at once. */
const PAGE_SIZE = 6;

export interface SimilarProductsProps {
  /** Readable deal id of the product on screen, e.g. "D0823741837". */
  dealId: string;
  /** Block heading. */
  title?: string;
  className?: string;
  /** Height cap of the scrolling list. */
  scrollClassName?: string;
}

/**
 * The same product in other pack sizes, weights and packaging, as a scrolling
 * list. A row opens the seller's own item page when the variant is already in
 * their catalog, and the subscribe detail page when it isn't — so the list
 * doubles as a way to pick up the sizes they don't yet stock.
 */
const SimilarProducts = ({
  dealId,
  title = "Similar Products",
  className,
  scrollClassName = "tw:max-h-96",
}: SimilarProductsProps) => {
  const appNav = useAppNav();

  const [deals, setDeals] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);

    if (!dealId) {
      setDeals([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    getSimilarProducts(dealId, controller.signal)
      .then((rows) => setDeals(rows))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [dealId]);

  // Nothing to show once loaded — leave the slot empty rather than heading it.
  if (!dealId || (!loading && deals.length === 0)) return null;

  const handleOpen = (deal: SimilarProduct) => {
    if (deal.inCatalog && deal.dealId) {
      appNav.to(`/dashboard/inventory/products/view/${deal.dealId}`);
    } else if (deal.objId) {
      appNav.to(`/dashboard/inventory/subscribe/product-detail/${deal.objId}`);
    }
  };

  const visibleDeals = deals.slice(0, visibleCount);

  return (
    <section className={className}>
      <h3 className="tw:mb-2 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        {title}
      </h3>

      {loading ? (
        <div className="tw:flex tw:flex-col tw:gap-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`sp-skeleton-${idx}`}
              className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-2.5"
            >
              <Skeleton className="tw:h-12 tw:w-12 tw:shrink-0 tw:rounded-lg" />
              <div className="tw:min-w-0 tw:flex-1">
                <Skeleton className="tw:h-3.5 tw:w-4/5" />
                <Skeleton className="tw:mt-1.5 tw:h-3 tw:w-1/2" />
              </div>
              <Skeleton className="tw:h-4 tw:w-12 tw:shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <AppScrollArea
          className={clsx(
            // The scroll-area root doesn't clip on its own, and its viewport's
            // `height: 100%` only resolves against a parent with a definite
            // height — so a bare `max-h-*` cap does neither: the list grows to
            // its full content height and paints over the blocks below it.
            // Clip at the root and hand the cap down to the viewport, which
            // then scrolls at the cap instead of overflowing.
            "tw:overflow-hidden tw:*:data-[slot=scroll-area-viewport]:max-h-[inherit]",
            scrollClassName,
          )}
        >
          <div className="tw:flex tw:flex-col tw:gap-2 tw:pr-1">
            {visibleDeals.map((deal) => (
              <button
                key={deal.objId || deal.dealId}
                type="button"
                onClick={() => handleOpen(deal)}
                className={clsx(
                  "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-2.5 tw:text-left tw:transition-colors",
                  "hover:tw:border-slate-300 hover:tw:bg-slate-50",
                )}
              >
                <span className="tw:relative tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-lg tw:bg-slate-50">
                  {deal.image ? (
                    <ImgRender
                      assetId={deal.image}
                      alt={deal.name}
                      size="200"
                      className="tw:h-full tw:w-full tw:object-contain"
                    />
                  ) : (
                    <Package size={18} className="tw:text-slate-300" />
                  )}
                </span>

                <span className="tw:min-w-0 tw:flex-1">
                  <span className="tw:line-clamp-2 tw:block tw:text-xs tw:font-semibold tw:text-slate-800">
                    {deal.name}
                  </span>

                  <span className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1.5">
                    {deal.variant && (
                      <span className="tw:truncate tw:text-[11px] tw:text-slate-500">
                        {deal.variant}
                      </span>
                    )}
                    {deal.inCatalog && (
                      <span className="tw:shrink-0 tw:rounded tw:bg-emerald-50 tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-700">
                        In catalog
                      </span>
                    )}
                  </span>
                </span>

                <span className="tw:flex tw:shrink-0 tw:items-center tw:gap-1.5">
                  <span className="tw:flex tw:flex-col tw:items-end">
                    <span className="tw:text-xs tw:font-bold tw:text-slate-900">
                      {deal.price > 0 && <Amount value={deal.price} decimalPlaces={0} />}
                    </span>
                    {deal.showStrikedMrp && (
                      <span className="tw:text-[10px] tw:text-slate-400 tw:line-through">
                        <Amount value={deal.mrp} decimalPlaces={0} />
                      </span>
                    )}
                  </span>
                  <ChevronRight size={14} className="tw:text-slate-300" />
                </span>
              </button>
            ))}
          </div>

          {visibleCount < deals.length && (
            <LoadMoreButton
              loadMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
              loading={false}
              totalCount={deals.length}
              loadedCount={visibleDeals.length}
            />
          )}
        </AppScrollArea>
      )}
    </section>
  );
};

export default SimilarProducts;
