import clsx from "clsx";
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import NoData from "~/components/core/no-data/NoData";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import SellerCatalogService from "~/services/SellerCatalogService";
import { normalizePriceEvents, resolveSellerDealObjId } from "./helper";
import type {
  FormattedPriceEvent,
  PriceEvents as PriceEventsData,
} from "./helper";

/** Arrow per direction — a lookup so the row stays a plain property read. */
const DIRECTION_ICON = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

export interface PriceEventsProps {
  /** Route deal id; falls back to the `id` route param. */
  dealId?: string;
  /** Seller-deal document id, when the caller already carries it. */
  sellerDealObjId?: string;
  /** Window of events requested. */
  days?: number;
  /** Weeks of history the events are drawn from. */
  weeks?: number;
  /** Peer radius the peer averages are drawn from. */
  distance?: string;
  className?: string;
}

/**
 * Price events feed — every price move on this deal in the last `days`, newest
 * first, as a timeline. Own moves (buy/sell/B2B) are anchored to the price they
 * landed on; peer events only carry a delta, so they show the swing and how
 * many peers it came from. Fetches its own data off the route's deal id.
 */
const PriceEvents = ({
  dealId,
  sellerDealObjId,
  days = 30,
  weeks = 6,
  distance = "1km",
  className,
}: PriceEventsProps) => {
  const { id } = useParams();
  const target = dealId || id || "";

  const [data, setData] = useState<PriceEventsData | null>(null);
  const [events, setEvents] = useState<FormattedPriceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Price events are keyed by the seller-deal document id, not the deal id in
   * the route, so the deal has to be resolved first unless the caller already
   * handed one over.
   */
  const fetchEvents = useCallback(async () => {
    if (!target && !sellerDealObjId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const dealObjId =
        sellerDealObjId || (await resolveSellerDealObjId(target));
      if (!dealObjId) {
        setData(null);
        setEvents([]);
        return;
      }
      const resp = await SellerCatalogService.getPriceEvents(dealObjId, {
        days,
        weeks,
        distance,
      });
      const payload = resp.statusCode === 200 ? resp.data?.data || null : null;
      setData(payload);
      setEvents(normalizePriceEvents(payload));
    } catch (error) {
      console.error("Error loading price events:", error);
      setData(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [target, sellerDealObjId, days, weeks, distance]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <section
      className={clsx(
        "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3",
        className,
      )}
    >
      <div className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-slate-500">
        Price events
        <span className="tw:text-slate-400">
          {" "}
          · last {data?.days || days} days
        </span>
      </div>

      {/* The header stays put through both states so the card never collapses
          out of the column while a fresh SKU loads. */}
      {loading ? (
        <ContentLoader />
      ) : !events.length ? (
        <NoData
          title="No price moves"
          description="Price moves on this product will appear here."
          icon={
            <div className="tw:p-4 tw:bg-slate-50 tw:rounded-full tw:border tw:border-slate-200">
              <TrendingUp className="tw:text-slate-400" size={32} />
            </div>
          }
        />
      ) : (
        <div className="tw:mt-2">
          {events.map((event, index) => {
            const Icon = DIRECTION_ICON[event._direction];

            return (
              <div key={event._key} className="tw:flex tw:gap-3">
                {/* Timeline rail — dot per event, line stops after the last. */}
                <div className="tw:flex tw:flex-col tw:items-center">
                  <span
                    className={clsx(
                      "tw:mt-2 tw:flex tw:size-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full",
                      event._direction === "up" &&
                        "tw:bg-rose-50 tw:text-rose-600",
                      event._direction === "down" &&
                        "tw:bg-emerald-50 tw:text-emerald-600",
                      event._direction === "flat" &&
                        "tw:bg-slate-100 tw:text-slate-500",
                    )}
                  >
                    <Icon size={13} strokeWidth={2.5} />
                  </span>
                  {index < events.length - 1 && (
                    <span className="tw:w-px tw:flex-1 tw:bg-slate-200" />
                  )}
                </div>

                <div className="tw:min-w-0 tw:flex-1 tw:py-2">
                  <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                    <p className="tw:min-w-0 tw:text-xs tw:font-semibold tw:text-slate-700">
                      {event.message}
                    </p>

                    {!!event.delta && (
                      <span
                        className={clsx(
                          "tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-bold",
                          event._direction === "up"
                            ? "tw:bg-rose-50 tw:text-rose-600"
                            : "tw:bg-emerald-50 tw:text-emerald-600",
                        )}
                      >
                        {event._direction === "up" ? "+" : "−"}
                        <Amount value={event._absDelta} />
                      </span>
                    )}
                  </div>

                  <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-0.5 tw:text-[10px] tw:text-slate-500">
                    <span
                      className={clsx(
                        "tw:font-bold tw:uppercase tw:tracking-wide",
                        event._own ? "tw:text-teal-700" : "tw:text-indigo-600",
                      )}
                    >
                      {event._label}
                    </span>

                    <span className="tw:whitespace-nowrap">{event.label}</span>

                    {!!event.price && (
                      <span className="tw:whitespace-nowrap tw:font-semibold tw:text-slate-600">
                        now <Amount value={event.price} />
                      </span>
                    )}

                    {!!event.samplesCount && (
                      <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:whitespace-nowrap">
                        <Users size={10} />
                        {event.samplesCount} {event._peersLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default PriceEvents;
