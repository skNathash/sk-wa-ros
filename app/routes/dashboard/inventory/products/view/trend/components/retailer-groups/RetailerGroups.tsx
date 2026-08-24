import clsx from "clsx";
import { Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import NoData from "~/components/core/no-data/NoData";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import { getDetails } from "../../../helper";
import { EMPTY_RETAILER_GROUPS, normalizeRetailerGroups } from "./helper";
import type { FormattedRetailerGroups } from "./helper";

export interface RetailerGroupsProps {
  /** Route deal id; falls back to the `id` route param. */
  dealId?: string;
  /** Card heading — the segment the prices belong to. */
  title?: string;
  className?: string;
}

/**
 * B2B prices by retailer group — one line per buyer group with what it pays and
 * how far under MRP that sits, so the spread across the network reads at a
 * glance. Same per-group prices the pricing tab tables, kept to a ranking here
 * because the trend tab is read, not edited.
 */
const RetailerGroups = ({
  dealId,
  title = "B2B · Retailer groups",
  className,
}: RetailerGroupsProps) => {
  const { id } = useParams();
  const target = dealId || id || "";

  const [card, setCard] = useState<FormattedRetailerGroups>(
    EMPTY_RETAILER_GROUPS,
  );
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!target) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const deal = await getDetails(target);
    setCard(
      normalizeRetailerGroups(deal?.networkGroupPrices, {
        mrp: Number(deal?.mrp) || 0,
        fallbackPrice: Number(deal?.b2bPrice) || 0,
        info: deal?.networkGroupPriceInfo,
      }),
    );
    setLoading(false);
  }, [target]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  if (loading) return <ContentLoader />;

  if (!card.hasData) {
    return (
      <NoData
        title={title}
        description="B2B prices configured for your retailer groups will appear here."
        icon={
          <div className="tw:p-4 tw:bg-slate-50 tw:rounded-full tw:border tw:border-slate-200">
            <Users className="tw:text-slate-400" size={32} />
          </div>
        }
      />
    );
  }

  return (
    <section
      className={clsx(
        "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <span className="tw:truncate tw:text-[13px] tw:font-bold tw:text-slate-800">
          {title}
        </span>
        <span className="tw:shrink-0 tw:rounded-full tw:bg-violet-50 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-violet-700">
          {card.totalGroups} {card.totalGroups === 1 ? "group" : "groups"} · avg{" "}
          <Amount value={card.avgPrice} decimalPlaces={0} />
        </span>
      </div>

      <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2.5 tw:border-t tw:border-slate-100 tw:pt-3">
        {card.rows.map((row) => (
          <div key={row.id} className="tw:flex tw:items-center tw:gap-2">
            <span
              className={clsx("tw:h-2.5 tw:w-2.5 tw:shrink-0 tw:rounded-sm", row.dot)}
            />

            {/* Name gives up its width first — the price is the number to land
                on, so it never wraps or shrinks. */}
            <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[13px] tw:font-semibold tw:text-slate-800">
              {row.name}
            </span>

            <span
              className={clsx(
                "tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:text-[11px] tw:font-semibold",
                row.text,
              )}
              title={`${row.sellersCount} ${row.sellersCount === 1 ? "retailer" : "retailers"}`}
            >
              <Users size={11} className="tw:opacity-70" />
              {row.sellersCount}
            </span>

            <Amount
              value={row.price}
              decimalPlaces={row.price % 1 ? 2 : 0}
              className={clsx(
                "tw:w-16 tw:shrink-0 tw:text-right tw:text-sm tw:font-bold",
                row.text,
              )}
            />

            <span className="tw:w-10 tw:shrink-0 tw:text-right tw:text-[11px] tw:font-semibold tw:text-slate-400">
              {row.discount === null ? "" : `${row.discount}%`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RetailerGroups;
