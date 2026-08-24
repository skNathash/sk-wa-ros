export type PlanCardTier = "bronze" | "silver" | "gold" | "platinum";

export type PlanCardAccent = "amber" | "blue";

export interface PlanCardBadge {
  label: string;
  variant: "popular" | "recommended";
}

export interface PlanCardFeeRow {
  label: string;
  value: string;
}

export interface PlanCardHighlight {
  label: string;
  value: string;
  sub?: string;
}

export interface PlanCardData {
  id: string;
  name: string;
  subtitle: string;
  badge?: PlanCardBadge;
  isHighlighted?: boolean;
  iconTier: PlanCardTier;
  highlight: PlanCardHighlight;
  feeRows: PlanCardFeeRow[];
  payTodayLabel: string;
  payTodayValue: string;
  tags: string[];
}

export const tierGradients: Record<PlanCardTier, string> = {
  bronze: "tw:from-[#C27838] tw:via-[#DE9C62] tw:to-[#96541D]",
  silver: "tw:from-[#94A3B8] tw:via-[#CBD5E1] tw:to-[#64748B]",
  gold: "tw:from-[#D97706] tw:via-[#FBBF24] tw:to-[#B45309]",
  platinum: "tw:from-[#475569] tw:via-[#64748B] tw:to-[#1E293B]",
};

interface AccentTokens {
  value: string;
  activeBorder: string;
  popularBadge: string;
  recommendedBadge: string;
}

export const planCardAccents: Record<PlanCardAccent, AccentTokens> = {
  amber: {
    value: "tw:text-[#A0520F]",
    activeBorder: "tw:border-2 tw:border-[#E59E27] tw:shadow-md",
    popularBadge: "tw:bg-[#2A3B56] tw:text-white",
    recommendedBadge: "tw:bg-[#C58319] tw:text-white",
  },
  blue: {
    value: "tw:text-[#1E40AF]",
    activeBorder: "tw:border-2 tw:border-[#2563EB] tw:shadow-md",
    popularBadge: "tw:bg-[#2A3B56] tw:text-white",
    recommendedBadge: "tw:bg-[#1E40AF] tw:text-white",
  },
};

export const formatInr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
