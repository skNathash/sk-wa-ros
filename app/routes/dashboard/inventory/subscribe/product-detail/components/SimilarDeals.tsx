import clsx from "clsx";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import { getSimilarDeals } from "../helper";

const DETAIL_PATH = "/dashboard/inventory/subscribe/product-detail";

export interface SimilarDealsProps {
  /** Category the deals are pulled from — usually `deal.category.id`. */
  categoryId: string;
  /** Product currently on screen; dropped from the list so it isn't repeated. */
  excludeDealId?: string;
  /** Block heading. */
  title?: string;
  /** How many deals to show. */
  count?: number;
  className?: string;
}

/**
 * "Similar in category" — other subscribable products from the same category
 * (thumb/initials tile, name, brand, StoreKing price), each row opening that
 * product's subscribe detail page. Lives in the detail page's side pane, and is
 * the subscribe-side twin of the item page's CategoryDeals block.
 */
const SimilarDeals = ({
  categoryId,
  excludeDealId,
  title = "Similar in category",
  count = 6,
  className,
}: SimilarDealsProps) => {
  const appNav = useAppNav();

  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getSimilarDeals(categoryId, { count, excludeDealId }).then((data) => {
      if (!active) return;
      setDeals(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [categoryId, count, excludeDealId]);

  // Nothing to show once loaded — keep the pane free of an empty block.
  if (!categoryId || (!loading && deals.length === 0)) return null;

  return (
    <section className={clsx("tw:px-1", className)}>
      <h3 className="app-section-label tw:mb-2 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        {title}
      </h3>

      {/* One grouped card of chat-list rows: the thumb sits in a fixed left
          gutter and each divider starts after it, the WhatsApp list shape. */}
      {loading ? (
        <div className="tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:pl-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`similar-skeleton-${idx}`}
              className="tw:flex tw:items-center tw:gap-3"
            >
              <Skeleton className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-full" />
              <div
                className={clsx(
                  "tw:flex tw:flex-1 tw:items-center tw:gap-3 tw:py-2.5 tw:pr-3",
                  idx > 0 && "tw:border-t tw:border-slate-100",
                )}
              >
                <div className="tw:flex-1">
                  <Skeleton className="tw:h-3 tw:w-2/3" />
                  <Skeleton className="tw:mt-1.5 tw:h-2.5 tw:w-1/4" />
                </div>
                <Skeleton className="tw:h-3 tw:w-10 tw:shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:pl-3">
          {deals.map((deal, idx) => {
            const initials = (deal.name || "").trim().slice(0, 3);
            const brand = deal.brand?.name || deal.companyName || "";

            return (
              <button
                key={deal._id}
                type="button"
                onClick={() => appNav.to(`${DETAIL_PATH}/${deal._id}`)}
                className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
              >
                {/* Thumb — product image, else a tinted initials disc. */}
                <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-[color-mix(in_srgb,var(--primary)_12%,#fff)]">
                  {deal.images?.length > 0 ? (
                    <ImgRender
                      assetId={deal.images[0]}
                      alt={deal.name}
                      className="tw:h-10 tw:w-10 tw:object-cover"
                    />
                  ) : initials ? (
                    <span className="tw:text-[11px] tw:font-bold tw:uppercase tw:text-primary">
                      {initials}
                    </span>
                  ) : (
                    <Package size={16} className="tw:text-slate-300" />
                  )}
                </span>

                <span
                  className={clsx(
                    "tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-3 tw:py-2.5 tw:pr-3",
                    idx > 0 && "tw:border-t tw:border-slate-100",
                  )}
                >
                  {/* Name + brand */}
                  <span className="tw:min-w-0 tw:flex-1">
                    <span className="tw:block tw:truncate tw:text-xs tw:font-semibold tw:text-slate-800">
                      {deal.name}
                    </span>
                    {brand && (
                      <span className="tw:mt-0.5 tw:block tw:truncate tw:text-[11px] tw:text-slate-400">
                        {brand}
                      </span>
                    )}
                  </span>

                  {/* What StoreKing sells it at. */}
                  <span className="tw:shrink-0 tw:text-xs tw:font-bold tw:text-slate-900">
                    <Amount value={deal.price || deal.mrp || 0} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SimilarDeals;
