export type BillingCycle = "1year" | "6months";

/** Query param the compare page keeps the selected billing cycle in. */
export const BILLING_CYCLE_PARAM = "cycle";

export const defaultBillingCycle: BillingCycle = "1year";

/** Reads the billing cycle off the URL, falling back to the default. */
export const getBillingCycle = (value: string | null): BillingCycle =>
  value === "6months" || value === "1year" ? value : defaultBillingCycle;

export interface StockTierCardData {
  id: string;
  name: string;
  subtitle: string;
  credit: string;
  creditSub: string;
  badge?: {
    label: string;
    variant: "popular" | "recommended";
  };
  isHighlighted?: boolean;
  setupFee: number;
  // Yearly pricing
  oneYearFee: number;
  oneYearGst: number;
  payToday1Yr: number;
  // 6 Months pricing
  sixMonthFee: number;
  sixMonthGst: number;
  payToday6Mo: number;
  peersCount: number;
  perksCount: number;
  iconTier: "bronze" | "silver" | "gold" | "platinum";
}

export const stockTiersData: StockTierCardData[] = [
  {
    id: "stock-1l",
    name: "Stock 1L",
    subtitle: "For shops buying up to ₹1.5L / month",
    credit: "₹1 L",
    creditSub: "buy on credit each month",
    setupFee: 999,
    oneYearFee: 4990,
    oneYearGst: 1078,
    payToday1Yr: 7067,
    sixMonthFee: 2994,
    sixMonthGst: 718,
    payToday6Mo: 4711,
    peersCount: 12,
    perksCount: 3,
    iconTier: "bronze",
  },
  {
    id: "stock-3l",
    name: "Stock 3L",
    subtitle: "For shops buying ₹1.5L – ₹4L / month",
    credit: "₹3 L",
    creditSub: "buy on credit each month",
    setupFee: 1499,
    oneYearFee: 11990,
    oneYearGst: 2428,
    payToday1Yr: 15917,
    sixMonthFee: 7194,
    sixMonthGst: 1564,
    payToday6Mo: 10257,
    peersCount: 19,
    perksCount: 4,
    iconTier: "bronze",
  },
  {
    id: "stock-5l",
    name: "Stock 5L",
    subtitle: "For shops buying ₹4L – ₹7L / month",
    credit: "₹5 L",
    creditSub: "buy on credit each month",
    badge: {
      label: "+ MOST POPULAR",
      variant: "popular",
    },
    setupFee: 1999,
    oneYearFee: 17988,
    oneYearGst: 3598,
    payToday1Yr: 23585,
    sixMonthFee: 10792,
    sixMonthGst: 2302,
    payToday6Mo: 15093,
    peersCount: 28,
    perksCount: 5,
    iconTier: "silver",
  },
  {
    id: "stock-10l",
    name: "Stock 10L",
    subtitle: "For shops buying ₹7L – ₹15L / month",
    credit: "₹10 L",
    creditSub: "buy on credit each month",
    badge: {
      label: "+ RECOMMENDED · SRIDHAR",
      variant: "recommended",
    },
    isHighlighted: true,
    setupFee: 2499,
    oneYearFee: 29988,
    oneYearGst: 5848,
    payToday1Yr: 38335,
    sixMonthFee: 17992,
    sixMonthGst: 3688,
    payToday6Mo: 24179,
    peersCount: 42,
    perksCount: 6,
    iconTier: "gold",
  },
  {
    id: "stock-25l",
    name: "Stock 25L",
    subtitle: "For shops buying ₹15L+ / month",
    credit: "₹25 L",
    creditSub: "buy on credit each month",
    setupFee: 3999,
    oneYearFee: 59988,
    oneYearGst: 11518,
    payToday1Yr: 75505,
    sixMonthFee: 35992,
    sixMonthGst: 7198,
    payToday6Mo: 47189,
    peersCount: 4,
    perksCount: 7,
    iconTier: "platinum",
  },
];

export interface ShopTierCardData {
  id: string;
  name: string;
  subtitle: string;
  bills: string;
  billsSub: string;
  badge?: {
    label: string;
    variant: "popular" | "recommended";
  };
  isHighlighted?: boolean;
  setupFee: number;
  // Yearly pricing
  oneYearFee: number;
  oneYearGst: number;
  payToday1Yr: number;
  // 6 Months pricing
  sixMonthFee: number;
  sixMonthGst: number;
  payToday6Mo: number;
  peersCount: number;
  modulesCount: number;
  offlineOk: boolean;
  iconTier: "bronze" | "silver" | "gold";
}

export const shopTiersData: ShopTierCardData[] = [
  {
    id: "shop-basic",
    name: "Shop Basic",
    subtitle: "Under 500 bills per month",
    bills: "< 500",
    billsSub: "unlimited on Pro+",
    badge: {
      label: "+ RECOMMENDED · KAMAL",
      variant: "recommended",
    },
    isHighlighted: true,
    setupFee: 999,
    oneYearFee: 3990,
    oneYearGst: 898,
    payToday1Yr: 5887,
    sixMonthFee: 2394,
    sixMonthGst: 610,
    payToday6Mo: 4003,
    peersCount: 6,
    modulesCount: 3,
    offlineOk: true,
    iconTier: "bronze",
  },
  {
    id: "shop-pro",
    name: "Shop Pro",
    subtitle: "500 – 2,000 bills per month",
    bills: "≤ 2K",
    billsSub: "unlimited on Pro+",
    badge: {
      label: "+ MOST POPULAR · MEENA",
      variant: "popular",
    },
    setupFee: 1499,
    oneYearFee: 8990,
    oneYearGst: 1888,
    payToday1Yr: 12377,
    sixMonthFee: 5394,
    sixMonthGst: 1240,
    payToday6Mo: 8133,
    peersCount: 18,
    modulesCount: 5,
    offlineOk: true,
    iconTier: "silver",
  },
  {
    id: "shop-unlimited",
    name: "Shop Unlimited",
    subtitle: "2,000+ bills per month",
    bills: "∞",
    billsSub: "unlimited on Pro+",
    setupFee: 2499,
    oneYearFee: 17988,
    oneYearGst: 3688,
    payToday1Yr: 24175,
    sixMonthFee: 10792,
    sixMonthGst: 2392,
    payToday6Mo: 15683,
    peersCount: 4,
    modulesCount: 6,
    offlineOk: true,
    iconTier: "gold",
  },
];
