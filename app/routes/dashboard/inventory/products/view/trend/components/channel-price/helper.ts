/**
 * Channel price snapshot — the same in-and-around payload the scatter chart
 * uses (`GET catalog/seller-deals/{dealId}/price-history?view=b2cInAndAround
 * &distance=1000`), read as a headline instead of a chart: what you charge on
 * this channel, what the retailers around you average, and the gap between.
 */

import type { InAndAround } from "../in-and-around/helper";

/** Which of the deal's two selling prices a card headlines. */
export type ChannelPriceType = "b2c" | "b2b";

/**
 * A channel the card can be pointed at. Title, channel name and price type are
 * three facets of one choice, so they travel together — a card headlining the
 * B2B price can't end up labelled B2C.
 */
export interface ChannelPricePreset {
  /** React key, and the channel's short name in logs. */
  key: ChannelPriceType;
  priceType: ChannelPriceType;
  /** Card heading — the segment and the app the price applies to. */
  title: string;
  /** Channel named in the conversion line. */
  channel: string;
}

/**
 * The channels shown on the trend page, in the order they read. Both currently
 * draw peers from the B2C `in-and-around` payload — the only view the endpoint
 * serves — so a B2B-specific `view` belongs here once one exists.
 */
export const CHANNEL_PRICE_CARDS = [
  { key: "b2c", priceType: "b2c", title: "B2C · CLUB app", channel: "CLUB app" },
  {
    key: "b2b",
    priceType: "b2b",
    title: "B2B · Network app",
    channel: "Network app",
  },
] as const satisfies readonly ChannelPricePreset[];

/**
 * Read-out tints, one per side of the average. Being above the average is what
 * costs sales, so it reads amber; being under it reads emerald; level is neutral
 * slate. The box and the figure inside it share a tone so the card never says
 * "above avg" on a green panel.
 */
export const GAP_TONES: Record<
  FormattedChannelPrice["gapDirection"],
  { box: string; text: string }
> = {
  above: { box: "tw:bg-amber-50/70", text: "tw:text-amber-700" },
  below: { box: "tw:bg-emerald-50/70", text: "tw:text-emerald-700" },
  same: { box: "tw:bg-slate-50", text: "tw:text-slate-800" },
};

/** The card, ready to render. */
export interface FormattedChannelPrice {
  hasData: boolean;
  /** What you sell this deal for on the channel. */
  yourPrice: number;
  /** Average selling price across the peers in the radius. */
  peerAvg: number;
  /** Units you move in a month — the header chip. */
  monthlyUnits: number;
  /** Peers the average is drawn from. */
  peersCount: number;
  /** "10 nearby retailers" / "1 nearby retailer". */
  peersLabel: string;
  /** Absolute rupee gap against the peer average. */
  gap: number;
  /** Which side of the average you sit on — "same" when they match. */
  gapDirection: "above" | "below" | "same";
  /** Conversion rate against the area, when the API reports one. */
  conversionDelta: number | null;
  /** Product the card is for, straight off the payload. */
  dealName: string;
}

export const EMPTY_CHANNEL_PRICE: FormattedChannelPrice = {
  hasData: false,
  yourPrice: 0,
  peerAvg: 0,
  monthlyUnits: 0,
  peersCount: 0,
  peersLabel: "nearby retailers",
  gap: 0,
  gapDirection: "same",
  conversionDelta: null,
  dealName: "",
};

/**
 * Flatten the payload into the headline figures. The peer average is taken from
 * the API when it sends one and averaged off the sellers when it does not, so
 * the gap always has something to read against.
 *
 * `yourPriceOverride` is what the B2B card runs on: the endpoint only reports
 * the seller's B2C price, so the B2B price is read off the deal and passed in
 * while the peer side keeps coming from this payload.
 */
export const normalizeChannelPrice = (
  data: (InAndAround & { conversionRate?: number }) | null | undefined,
  yourPriceOverride?: number,
): FormattedChannelPrice => {
  const yourPrice =
    yourPriceOverride === undefined
      ? Number(data?.you?.price) || 0
      : Number(yourPriceOverride) || 0;
  const sellers = (data?.sellers || []).filter((seller) => !!seller.price);

  const peerAvg = Math.round(
    Number(data?.avgSellerPrice) ||
      (sellers.length
        ? sellers.reduce((sum, seller) => sum + (Number(seller.price) || 0), 0) /
          sellers.length
        : 0),
  );

  const peersCount = Number(data?.sellersCount) || sellers.length;
  const gap = Math.round(Math.abs(yourPrice - peerAvg));

  const conversionRate = Number(
    (data as { conversionRate?: number })?.conversionRate,
  );

  return {
    hasData: !!yourPrice || !!peerAvg,
    yourPrice,
    peerAvg,
    monthlyUnits: Number(data?.you?.monthlyUnits) || 0,
    peersCount,
    peersLabel: peersCount === 1 ? "nearby retailer" : "nearby retailers",
    gap,
    /* Rounded prices are compared, so a sub-rupee drift reads as level. */
    gapDirection: !gap ? "same" : yourPrice > peerAvg ? "above" : "below",
    conversionDelta: Number.isFinite(conversionRate) ? conversionRate : null,
    dealName: String(data?.dealName || "").trim(),
  };
};
