import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import {
  getData,
  getMonthlyRate,
  getMovementMeta,
  getTileColor,
} from "./helper";

type TopSkusBoughtProps = {
  /** Seller (retailer) whose previously-purchased deals are shown. */
  retailerId?: string;
  className?: string;
};

/**
 * "Top SKUs you buy here" — a read-only recap of what this retailer keeps
 * buying from the seller: buy price against MRP, the monthly rate and how the
 * SKU is moving. Buying happens in the Catalog tab, which the header links to.
 */
const TopSkusBought = ({ retailerId, className }: TopSkusBoughtProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!retailerId) {
      setItems([]);
      return;
    }

    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getData(retailerId);
        if (active) setItems(result || []);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [retailerId]);

  // The page reads its active tab from the URL, so switching is a param write.
  const openCatalog = () => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "catalog");
    setSearchParams(next, { preventScrollReset: true });
  };

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    // Desktop: header and list are one card (the wrapper carries the surface,
    // the children go flat). Mobile: the header is a plain band on the page bg
    // and only the list keeps a surface, so they need the gap between them.
    <div
      className={clsx(
        "tw:space-y-2 tw:md:space-y-0 tw:md:overflow-hidden tw:md:rounded-2xl tw:md:bg-white tw:md:shadow-sm tw:md:ring-1 tw:md:ring-slate-200/70",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:md:border-b tw:md:border-slate-100 tw:md:px-4 tw:md:py-3">
        <div className="tw:flex tw:min-w-0 tw:flex-wrap tw:items-baseline tw:gap-x-2">
          <h2 className="tw:text-[0.9375rem] tw:font-bold tw:text-slate-900">
            Top SKUs you buy here
          </h2>
          <span className="tw:text-[11px] tw:text-gray-400">last 90 days</span>
        </div>
        <button
          type="button"
          onClick={openCatalog}
          className="tw:shrink-0 tw:text-[13px] tw:font-semibold tw:text-primary"
        >
          Catalog →
        </button>
      </div>

      {/* `app-bleed-x` (theme-2 mobile) pulls the list out of the page gutter
          so the rows run edge to edge; a no-op on desktop and other themes. */}
      <div className="app-bleed-x tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:divide-y tw:divide-slate-100 tw:md:rounded-none tw:md:shadow-none tw:md:ring-0">
        {loading
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={`top-sku-skeleton-${idx}`}
                className="tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-3"
              >
                <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:rounded-lg tw:bg-slate-100 tw:animate-pulse" />
                <div className="tw:flex-1 tw:space-y-2">
                  <div className="tw:h-3 tw:w-2/5 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
                  <div className="tw:h-2.5 tw:w-3/5 tw:rounded tw:bg-slate-100 tw:animate-pulse" />
                </div>
              </div>
            ))
          : items.map((deal) => {
              const movement = getMovementMeta(deal.movementType);
              const monthly = getMonthlyRate(deal);
              const discount = Math.round(Number(deal.discount) || 0);

              return (
                <div
                  key={deal._id || deal.id}
                  className="tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-2.5"
                >
                  <span
                    className={clsx(
                      "tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-white",
                      getTileColor(deal.name),
                    )}
                  >
                    SKU
                  </span>

                  <div className="tw:min-w-0 tw:flex-1">
                    <p className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                      {deal.name}
                    </p>
                    <p className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1 tw:text-[11px] tw:text-emerald-700/80">
                      <Amount value={deal.price} decimalPlaces={0} />
                      <span className="tw:text-slate-300">·</span>
                      <span>
                        MRP <Amount value={deal.mrp} decimalPlaces={0} />
                      </span>
                      {discount > 0 ? (
                        <>
                          <span className="tw:text-slate-300">·</span>
                          <span>−{discount}%</span>
                        </>
                      ) : null}
                    </p>
                  </div>

                  <div className="tw:shrink-0 tw:text-right">
                    {monthly > 0 ? (
                      <p className="tw:text-[13px] tw:font-bold tw:text-slate-900">
                        {monthly}/mo
                      </p>
                    ) : null}
                    <span
                      className={clsx(
                        "tw:mt-1 tw:inline-flex tw:items-center tw:gap-1 tw:rounded-md tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide",
                        movement.className,
                      )}
                    >
                      <span aria-hidden>{movement.icon}</span>
                      {movement.label}
                    </span>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default TopSkusBought;
export type { TopSkusBoughtProps };
