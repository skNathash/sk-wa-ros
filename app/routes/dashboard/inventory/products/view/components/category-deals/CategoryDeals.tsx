import clsx from "clsx";
import { ChevronRight, Package } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import { Skeleton } from "~/components/ui/skeleton";
import type { SellerDeal } from "~/types/CommonTypes";
import { getCategoryDeals } from "../../helper";

export interface CategoryDealsProps {
  /** Category the deals are pulled from — usually `deal.category._id`. */
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
 * "Similar in category" — a compact list of other products from the same
 * category (thumb/initials tile, name, brand, selling price), each row linking
 * to that product's detail page. Lives in the product-view side pane.
 */
const CategoryDeals = ({
  categoryId,
  excludeDealId,
  title = "Similar in category",
  count = 6,
  className,
}: CategoryDealsProps) => {
  const [deals, setDeals] = useState<SellerDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCategoryDeals(categoryId, { count, excludeDealId }).then((data) => {
      if (!active) return;
      setDeals(data as SellerDeal[]);
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
      <h3 className="tw:mb-2 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        {title}
      </h3>

      {loading ? (
        <div className="tw:flex tw:flex-col tw:gap-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`cd-skeleton-${idx}`}
              className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:bg-slate-50 tw:px-3 tw:py-2.5"
            >
              <Skeleton className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-full" />
              <div className="tw:flex-1">
                <Skeleton className="tw:h-3 tw:w-2/3" />
                <Skeleton className="tw:mt-1.5 tw:h-2.5 tw:w-1/4" />
              </div>
              <Skeleton className="tw:h-3 tw:w-10 tw:shrink-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="tw:flex tw:flex-col tw:gap-2">
          {deals.map((deal) => {
            const initials = (deal.name || "").trim().slice(0, 3);
            const brand =
              (deal.brand as any)?._displayName || deal.companyName || "";

            return (
              <div
                key={deal._id}
                className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:bg-slate-50 tw:px-3 tw:py-2.5 tw:transition-colors tw:hover:bg-slate-100"
              >
                {/* Thumb — product image, else a tinted initials disc. */}
                <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-[color-mix(in_srgb,var(--primary)_12%,#fff)]">
                  {deal.images && deal.images.length > 0 ? (
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

                {/* Name + brand */}
                <span className="tw:min-w-0 tw:flex-1">
                  <span className="tw:block tw:truncate tw:text-xs tw:font-semibold tw:text-slate-800">
                    <AppLink
                      key={deal._id}
                      asLink
                      href={`/dashboard/inventory/products/view/${deal._id}`}
                    >
                      {deal.name}
                    </AppLink>
                  </span>
                  {brand && (
                    <span className="tw:mt-0.5 tw:block tw:truncate tw:text-xs tw:text-slate-500">
                      {brand}
                    </span>
                  )}
                </span>

                {/* Selling price */}
                {/* <ChevronRight size={16} className="tw:text-slate-500" /> */}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CategoryDeals;
