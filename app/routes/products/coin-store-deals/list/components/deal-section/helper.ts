/**
 * Data access + presentation for one recommendation rail on the Coin Store
 * page. Each rail is one `recommendationType` the kcstore-deals endpoint
 * understands, so the component only ever takes the type and reads the rest
 * from here.
 */

import { Flame, History, Sparkles, type LucideIcon } from "lucide-react";
import SellerCatalogService from "~/services/SellerCatalogService";
import ShareService from "~/services/ShareService";
import {
  rewardTierOf,
  type CoinRewardTier,
} from "~/shared/coins/components/coin-store-pane/helper";

/** The recommendation slices the page shows, in the order they read. */
export type DealSectionType =
  | "most-bought"
  | "newly-launched"
  | "recently-sold";

export const DEAL_SECTION_TYPES: DealSectionType[] = [
  "most-bought",
  "newly-launched",
  "recently-sold",
];

/** Everything a rail shows about itself — copy plus its tone. */
export interface DealSectionMeta {
  title: string;
  /** One line on why the rail is worth a retailer's attention. */
  subtitle: string;
  icon: LucideIcon;
  /** Tone classes — the icon tile, the title, and the count chip. */
  iconClassName: string;
  titleClassName: string;
  chipClassName: string;
}

export const SECTION_META: Record<DealSectionType, DealSectionMeta> = {
  "most-bought": {
    title: "Most bought",
    subtitle: "Redeemed again and again — keep these stocked",
    icon: Flame,
    iconClassName: "tw:bg-amber-100 tw:text-amber-600",
    titleClassName: "tw:text-amber-700",
    chipClassName: "tw:bg-amber-50 tw:text-amber-700",
  },
  "newly-launched": {
    title: "Newly launched",
    subtitle: "Fresh in the Coin Store — first pick for your regulars",
    icon: Sparkles,
    iconClassName: "tw:bg-violet-100 tw:text-violet-600",
    titleClassName: "tw:text-violet-700",
    chipClassName: "tw:bg-violet-50 tw:text-violet-700",
  },
  "recently-sold": {
    title: "Recently sold",
    subtitle: "Moved out lately — worth a nudge to the next holder",
    icon: History,
    iconClassName: "tw:bg-emerald-100 tw:text-emerald-600",
    titleClassName: "tw:text-emerald-700",
    chipClassName: "tw:bg-emerald-50 tw:text-emerald-700",
  },
};

/** One deal in a rail, flattened to what the card and the detail modal show. */
export interface SectionDeal {
  id: string;
  name: string;
  /** First catalogue image, when the deal carries one. */
  image: string;
  coins: number;
  mrp: number;
  price: number;
  /** Units on hand — the "N ready" badge. */
  stock: number;
  category: string;
  brand: string;
  tier: CoinRewardTier;
  /** Fast movers carry the "hot" flag on the card. */
  isHot: boolean;
  canBuy: boolean;
  raw: Record<string, any>;
}

/** The rail's request — the recommendation slice plus its page window. */
export const prepareParams = (
  type: DealSectionType,
  limit = 5,
): Record<string, any> => ({
  page: 1,
  limit,
  recommendationType: type,
});

const formatDeal = (
  deal: Record<string, any>,
  index: number,
): SectionDeal => {
  const kc = deal?.kcStoreInfo || {};
  const images: string[] = deal?.images || deal?._raw?.images || [];

  return {
    id: deal?.id || deal?._id || `deal-${index}`,
    name: deal?.name || deal?.dealName || "Reward",
    image: images?.[0] || "",
    coins: Number(kc?.requiredKingCoins || 0),
    mrp: Number(deal?.mrp || 0),
    price: Number(deal?.price || deal?.mrp || 0),
    stock: Number(deal?.maxQty || 0),
    category: deal?.category?._displayName || deal?.category?.name || "",
    brand: deal?.brand?._displayName || deal?.brand?.name || "",
    tier: rewardTierOf(deal),
    isHot: String(deal?.movementType || "").toLowerCase() === "fast moving",
    canBuy: !!kc?.hasBuyAccess,
    raw: deal,
  };
};

/** The deals behind one recommendation slice. */
export const getData = async (
  params: Record<string, any>,
): Promise<SectionDeal[]> => {
  try {
    const response: any = await SellerCatalogService.getKcStoreDeals(params);
    const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
    return rows.map(formatDeal);
  } catch (error) {
    return [];
  }
};

/** How many deals the slice holds in total — the header chip. */
export const getCount = async (
  params: Record<string, any>,
): Promise<number> => {
  try {
    const response: any = await SellerCatalogService.getKcStoreDeals({
      ...params,
      outputType: "count",
    });
    return Number(response?.data?.data?.count || 0);
  } catch (error) {
    return 0;
  }
};

/** The tier a reward sits in, as the card and modal label it. */
export const TIER_LABEL: Record<CoinRewardTier, string> = {
  aspirational: "Aspirational",
  everyday: "Everyday",
  "cash-like": "Cash-like",
};

/** What a retailer forwards to a customer about one reward. */
export const buildShareText = (deal: SectionDeal) =>
  [
    `🪙 ${deal.name}`,
    `Redeem it at my store for ${deal.coins} KingCoins.`,
    deal.mrp > 0 ? `Worth ₹${deal.mrp}.` : "",
    "Earn coins on every bill — ask me how!",
  ]
    .filter(Boolean)
    .join("\n");

/** Share a reward — the native sheet where it exists, WhatsApp otherwise. */
export const shareDeal = async (deal: SectionDeal) => {
  const text = buildShareText(deal);

  if (navigator.share) {
    try {
      await navigator.share({ title: deal.name, text });
      return;
    } catch (error) {
      // dismissed or unsupported — fall through to WhatsApp
    }
  }

  ShareService.share({ msg: text });
};
