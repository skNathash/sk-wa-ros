import clsx from "clsx";
import { Store } from "lucide-react";
import { useMemo, useState } from "react";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import TintTile from "~/components/core/tint/TintTile";
import { tileDecor } from "~/components/core/tint/tints";

/** One row of `subscribedSellers` on the deal response. */
export interface SubscribedSeller {
  sellerId?: string;
  sellerName?: string;
  quantity?: number;
  status?: string;
  subscribedAt?: string;
  _id?: string;
}

export interface SubscribedRetailersProps {
  sellers?: SubscribedSeller[];
  /** Block heading. */
  title?: string;
  className?: string;
}

/** How many rows show before the list asks to be opened. */
const PREVIEW_COUNT = 8;

/**
 * "Retailers subscribed" — the sellers already carrying this product, with the
 * date they subscribed and whether their subscription is still active. It's the
 * social proof behind the product: the peer view the seller's own item page
 * gets from the deal-performance feed, read here off the deal itself.
 */
const SubscribedRetailers = ({
  sellers = [],
  title = "Retailers subscribed",
  className,
}: SubscribedRetailersProps) => {
  const [expanded, setExpanded] = useState(false);

  // Active sellers first, then most recent — the rest is the long tail.
  const rows = useMemo(() => {
    const isActive = (seller: SubscribedSeller) =>
      String(seller.status || "").toLowerCase() === "active";

    return [...sellers]
      .sort((a, b) => {
        if (isActive(a) !== isActive(b)) return isActive(a) ? -1 : 1;
        return (
          new Date(b.subscribedAt || 0).getTime() -
          new Date(a.subscribedAt || 0).getTime()
        );
      })
      .map((seller) => ({
        ...seller,
        ...tileDecor(seller.sellerName),
        _active: isActive(seller),
      }));
  }, [sellers]);

  if (rows.length === 0) {
    return (
      <NoData
        title={title}
        description="No retailer has subscribed to this product yet — you would be the first."
        icon={
          <div className="tw:rounded-full tw:border tw:border-slate-200 tw:bg-slate-50 tw:p-4">
            <Store className="tw:text-slate-400" size={32} />
          </div>
        }
      />
    );
  }

  const activeCount = rows.filter((row) => row._active).length;
  const visible = expanded ? rows : rows.slice(0, PREVIEW_COUNT);

  return (
    <section className={className}>
      <div className="tw:mb-2 tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <h3 className="app-section-label tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
          {title}
        </h3>
        <span className="tw:text-[11px] tw:text-slate-400">
          {activeCount} active of {rows.length}
        </span>
      </div>

      {/* WhatsApp chat-list rhythm: avatar in a fixed left gutter, two-line
          identity beside it, and the hairline divider starting after the avatar
          instead of cutting across the whole card. */}
      <div className="tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:pl-4">
        {visible.map((seller, idx) => (
          <div
            key={seller._id || seller.sellerId || `${seller.sellerName}-${idx}`}
            className="tw:flex tw:items-center tw:gap-3"
          >
            <TintTile
              index={seller._tintIndex}
              className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-sm tw:font-bold"
            >
              <span className="tw:text-[color:var(--tint-ink)]">
                {seller._initial}
              </span>
            </TintTile>

            <div
              className={clsx(
                "tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-3 tw:py-2.5 tw:pr-4",
                idx > 0 && "tw:border-t tw:border-slate-100",
              )}
            >
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                  {seller.sellerName || "Retailer"}
                </div>
                {seller.subscribedAt && (
                  <div className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:text-slate-400">
                    Subscribed{" "}
                    <DateFormat
                      value={seller.subscribedAt}
                      formatStr="dd MMM yyyy"
                    />
                  </div>
                )}
              </div>

              <span
                className={clsx(
                  "tw:shrink-0 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide",
                  seller._active
                    ? "tw:bg-emerald-50 tw:text-emerald-700"
                    : "tw:bg-slate-100 tw:text-slate-500",
                )}
              >
                {seller.status || "—"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {rows.length > PREVIEW_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="tw:mt-2 tw:w-full tw:cursor-pointer tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:py-2 tw:text-center tw:text-sm tw:font-semibold tw:text-primary tw:transition-colors tw:hover:bg-slate-50"
        >
          {expanded
            ? "Show fewer retailers"
            : `Show all ${rows.length} retailers`}
        </button>
      )}
    </section>
  );
};

export default SubscribedRetailers;
