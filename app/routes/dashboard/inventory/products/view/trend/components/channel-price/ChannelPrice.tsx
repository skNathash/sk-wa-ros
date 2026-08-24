import clsx from "clsx";
import { Tags } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import NoData from "~/components/core/no-data/NoData";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import SellerCatalogService from "~/services/SellerCatalogService";
import { getDetails } from "../../../helper";
import { EMPTY_CHANNEL_PRICE, GAP_TONES, normalizeChannelPrice } from "./helper";
import type { ChannelPriceType, FormattedChannelPrice } from "./helper";

export interface ChannelPriceProps {
  /** Route deal id; falls back to the `id` route param. */
  dealId?: string;
  /** History view requested — B2C by default. */
  view?: string;
  /**
   * Which of the deal's two selling prices the card headlines. The endpoint
   * reports the B2C price under `you`, so "b2b" reads the price off the deal
   * instead; the peer side is the same either way.
   */
  priceType?: ChannelPriceType;
  /** Radius the peer average is drawn from, in metres. */
  distance?: number;
  /** Card heading — the segment and the app the price applies to. */
  title?: string;
  /** Channel named in the conversion line — "CLUB app". */
  channel?: string;
  className?: string;
}

/**
 * Channel price snapshot — your selling price on a channel against the average
 * of the retailers around you, with the gap spelt out in a line beneath so the
 * card answers "am I priced right here?" without reading a chart. Shares the
 * in-and-around endpoint with the scatter below it.
 */
const ChannelPrice = ({
  dealId,
  view = "b2cInAndAround",
  priceType = "b2c",
  distance = 1000,
  title = "B2C · CLUB app",
  channel = "CLUB app",
  className,
}: ChannelPriceProps) => {
  const { id } = useParams();
  const target = dealId || id || "";

  const [card, setCard] = useState<FormattedChannelPrice>(EMPTY_CHANNEL_PRICE);
  const [loading, setLoading] = useState(true);

  /**
   * The history endpoints are keyed by the seller-deal document id, not the
   * deal id in the route, so the deal has to be resolved first.
   */
  const fetchChannelPrice = useCallback(async () => {
    if (!target) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const deal = await getDetails(target);
    const sellerDealObjId = deal?.sellerDealObjId || "";
    if (!sellerDealObjId) {
      setCard(EMPTY_CHANNEL_PRICE);
      setLoading(false);
      return;
    }
    const resp = await SellerCatalogService.getInAndAroundPrices(
      sellerDealObjId,
      { view, distance },
    );
    /* The deal carries both selling prices; the endpoint only reports the B2C
       one, so the B2B card headlines the deal's price instead. */
    const yourPrice =
      priceType === "b2b" ? Number((deal as any)?.b2bPrice) || 0 : undefined;
    setCard(
      resp.statusCode === 200
        ? normalizeChannelPrice(resp.data?.data, yourPrice)
        : EMPTY_CHANNEL_PRICE,
    );
    setLoading(false);
  }, [target, view, priceType, distance]);

  useEffect(() => {
    fetchChannelPrice();
  }, [fetchChannelPrice]);

  if (loading) return <ContentLoader />;

  if (!card.hasData) {
    return (
      <NoData
        title={title}
        description="Your price on this channel against nearby retailers will appear here."
        icon={
          <div className="tw:p-4 tw:bg-slate-50 tw:rounded-full tw:border tw:border-slate-200">
            <Tags className="tw:text-slate-400" size={32} />
          </div>
        }
      />
    );
  }

  /* Being above the average is the one that costs sales, so it reads amber. */
  const above = card.gapDirection === "above";
  const tone = GAP_TONES[card.gapDirection];

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
        {!!card.monthlyUnits && (
          <span className="tw:shrink-0 tw:rounded-full tw:bg-emerald-50 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-emerald-700">
            {card.monthlyUnits} units/mo
          </span>
        )}
      </div>

      <div className="tw:mt-3 tw:flex tw:items-end tw:justify-between tw:gap-3 tw:border-t tw:border-slate-100 tw:pt-3">
        <div className="tw:min-w-0">
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
            Your price
          </div>
          <Amount
            value={card.yourPrice}
            decimalPlaces={0}
            className="tw:text-2xl tw:font-bold tw:leading-tight tw:text-teal-700"
          />
        </div>

        <div className="tw:min-w-0 tw:text-right">
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
            Seller avg
          </div>
          <Amount
            value={card.peerAvg}
            decimalPlaces={0}
            className="tw:text-xl tw:font-bold tw:leading-tight tw:text-slate-600"
          />
        </div>
      </div>

      {/* The read-out — the gap said in words, with the channel's conversion
          rate appended when the API reports one. */}
      {!!card.peersCount && (
        <div
          className={clsx(
            "tw:mt-3 tw:rounded-lg tw:px-3 tw:py-2 tw:text-[11px] tw:leading-relaxed tw:text-slate-600",
            tone.box,
          )}
        >
          {card.gapDirection === "same" ? (
            <>
              You are{" "}
              <span className={clsx("tw:font-bold", tone.text)}>level</span> with
              the average of {card.peersCount} {card.peersLabel}
            </>
          ) : (
            <>
              You are{" "}
              <span className={clsx("tw:font-bold", tone.text)}>
                <Amount value={card.gap} decimalPlaces={0} />{" "}
                {above ? "above" : "below"} avg
              </span>{" "}
              across {card.peersCount} {card.peersLabel}
            </>
          )}
          {card.conversionDelta !== null && (
            <>
              {" · "}
              {channel} conversion rate{" "}
              <span
                className={clsx(
                  "tw:font-semibold",
                  card.conversionDelta < 0
                    ? "tw:text-amber-700"
                    : "tw:text-emerald-700",
                )}
              >
                {card.conversionDelta > 0 ? "+" : ""}
                {card.conversionDelta}%
              </span>{" "}
              vs area
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default ChannelPrice;
