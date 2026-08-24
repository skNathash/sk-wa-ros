import type { TierCardData, TierIcon, TierType } from "../helper";

export interface SidePaneTierItem {
  id: string;
  name: string;
  subtitle: string;
  badgeLetter: string;
  badgeTier: TierIcon;
  isYours?: boolean;
}

/** Tier counts of both shapes, for the header line and the filter pills. */
export interface SidePaneTierCounts {
  stock: number;
  shop: number;
}

/** First letter of the metal the tier is badged with — B, S, G or P. */
const getBadgeLetter = (iconTier: TierIcon) => iconTier.charAt(0).toUpperCase();

/** Capacity the tier is sold on, plus the peers already on it. */
const getSubtitle = (tier: TierCardData, type: TierType) => {
  const capacity =
    type === "stock"
      ? tier.highlight.value
      : `${tier.highlight.value} bills`;

  if (!tier.peersCount) return capacity;

  return `${capacity} · ${tier.peersCount} peers`;
};

/** The ALL TIERS rows, off the same plans the grid renders. */
export const toSidePaneTiers = (
  tiers: TierCardData[],
  type: TierType,
): SidePaneTierItem[] =>
  tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    subtitle: getSubtitle(tier, type),
    badgeLetter: getBadgeLetter(tier.iconTier),
    badgeTier: tier.iconTier,
    isYours: tier.isSwaPick,
  }));

export interface EconomicPoint {
  title: string;
  description: string;
}

export const economicsPoints: EconomicPoint[] = [
  {
    title: "Setup",
    description: "one-time. Onboarding, hardware pairing, month-1 handhold.",
  },
  {
    title: "Term",
    description:
      "6-mo or 1-yr. Yearly saves ~13% and locks the rate for 2 years.",
  },
  {
    title: "GST 18%",
    description: "line-itemed. Fully claimable as input credit.",
  },
  {
    title: "Peers",
    description: "105 shops in your peer set today.",
  },
];
