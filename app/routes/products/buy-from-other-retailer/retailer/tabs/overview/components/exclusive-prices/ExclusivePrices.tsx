import { useEffect, useState } from "react";
import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import {
  getData,
  getMoq,
  getStock,
  getTileColor,
  isExclusiveDeal,
} from "./helper";

type ExclusivePricesProps = {
  /** Seller (retailer) whose best-priced deals are shown. */
  retailerId?: string;
  /** Buyer tier the rates belong to, e.g. "Gold" — hidden when absent. */
  tier?: string;
  /** How many rows to show. */
  limit?: number;
  className?: string;
};

/**
 * "Exclusive prices for you" — the sharpest rates this seller currently offers
 * the logged-in retailer: buy price against MRP, with the MOQ and stock the
 * seller has on hand. Read-only; buying happens in the Catalog tab.
 */
const ExclusivePrices = ({
  retailerId,
  tier,
  limit = 3,
  className,
}: ExclusivePricesProps) => {
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
        const result = await getData(retailerId, limit);
        if (active) setItems(result || []);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [retailerId, limit]);

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
            Exclusive prices for you
          </h2>
          {tier ? (
            <span className="tw:text-[11px] tw:text-gray-400">{tier} tier</span>
          ) : null}
        </div>
      </div>

      {/* `app-bleed-x` (theme-2 mobile) pulls the list out of the page gutter
          so the rows run edge to edge; a no-op on desktop and other themes. */}
      <div className="app-bleed-x tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:divide-y tw:divide-slate-100 tw:md:rounded-none tw:md:shadow-none tw:md:ring-0">
        {loading
          ? Array.from({ length: limit }).map((_, idx) => (
              <div
                key={`exclusive-price-skeleton-${idx}`}
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
              const moq = getMoq(deal);
              const stock = getStock(deal);
              const price = Number(deal.price) || 0;
              const mrp = Number(deal.mrp) || 0;

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
                    <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
                      <p className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                        {deal.name}
                      </p>
                      {isExclusiveDeal(deal) ? (
                        <span className="tw:shrink-0 tw:rounded-md tw:bg-violet-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-violet-700">
                          Exclusive
                        </span>
                      ) : null}
                    </div>
                    <p className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1 tw:text-[11px] tw:text-gray-400">
                      {moq > 0 ? <span>MOQ {moq}</span> : null}
                      {moq > 0 && stock > 0 ? (
                        <span className="tw:text-slate-300">·</span>
                      ) : null}
                      {stock > 0 ? <span>{stock} in stock</span> : null}
                    </p>
                  </div>

                  <div className="tw:shrink-0 tw:text-right">
                    <p className="tw:text-[15px] tw:font-bold tw:text-emerald-600">
                      <Amount value={price} decimalPlaces={0} />
                    </p>
                    {mrp > price ? (
                      <p className="tw:text-[11px] tw:text-gray-400 tw:line-through">
                        <Amount value={mrp} decimalPlaces={0} />
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default ExclusivePrices;
export type { ExclusivePricesProps };
