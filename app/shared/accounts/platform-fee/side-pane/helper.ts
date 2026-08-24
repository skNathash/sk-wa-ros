import type { VariantColor } from "~/types/CommonTypes";

/** One of the two plan shapes a store can buy into. */
export interface PlanShape {
  key: "stock" | "shop";
  /** Uppercase eyebrow naming the shape ("STOCK · GO LIVE"). */
  eyebrow: string;
  badgeVariant?: VariantColor;
  title: string;
  detail: string;
  tone: {
    card: string;
    eyebrow: string;
    tiers: string;
    title: string;
    detail: string;
  };
}

/**
 * The two shapes every plan falls into. Deliberately copy-only: the pane sells
 * the shape of the offer, the plans page sells the tiers and their prices.
 */
export const planShapes: PlanShape[] = [
  {
    key: "stock",
    eyebrow: "STOCK · GO LIVE",
    title: "Your stock, online in 5 min.",
    detail:
      "Photograph existing inventory, AI writes titles & prices, storefront goes live.",
    tone: {
      card: "tw:bg-[#FFF6E5] tw:border tw:border-[#F4DCB5]",
      eyebrow: "tw:text-[#A05A18]",
      tiers: "tw:text-[#64748B]",
      title: "tw:text-[#A0520F]",
      detail: "tw:text-[#64748B]",
    },
  },
  {
    key: "shop",
    eyebrow: "SHOP · MANAGE COUNTER",
    badgeVariant: "primary",
    title: "2-second billing at the counter.",
    detail: "AI billing · offline mode · Kannada/Tamil · khata + Paylater.",
    tone: {
      card: "tw:bg-[#EBF2FF] tw:border tw:border-[#BFD5F8]",
      eyebrow: "tw:text-[#1E40AF]",
      tiers: "tw:text-[#64748B]",
      title: "tw:text-[#1E3A8A]",
      detail: "tw:text-[#64748B]",
    },
  },
];

/** The commercial terms that hold for both shapes. */
export const planReasons = [
  {
    key: "fixed",
    title: "Fixed monthly",
    detail: "You know exactly what you pay each month. No surprises.",
  },
  {
    key: "rate-lock",
    title: "Rate locked · 2 years",
    detail: "Yearly commit protects you from any price hike.",
  },
  {
    key: "gst",
    title: "GST 18% · claimable",
    detail: "Line-itemed on the invoice. Your CA loves it.",
  },
  {
    key: "no-lock",
    title: "No lock after 6 months",
    detail: "Cancel any time. The plan should earn you every renewal.",
  },
];
