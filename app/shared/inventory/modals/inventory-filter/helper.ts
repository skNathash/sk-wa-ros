import { orderBy } from "lodash";
import SellerCatalogService from "~/services/SellerCatalogService";

export const statusOptions = [
  { value: "Active", label: "Active", langKey: "onlyActive" },
  { value: "Inactive", label: "Inactive", langKey: "onlyInactive" },
];

export const velocityOptions = [
  { value: "All", label: "All Velocities", langKey: "allVelocities" },
  ...SellerCatalogService.getMovementTypes().map((type: any) => ({
    value: type.value,
    label: type.label,
    langKey: type.key,
  })),
  {
    value: "subscribedByCustomer",
    label: "Only customer subscribed",
    langKey: "subscribedByCustomer",
  },
];

export const stockStatusOptions = orderBy(
  [
    { value: "All", label: "All Stock Status", langKey: "allStockStatus" },
    ...SellerCatalogService.getStockStatusTypes().map((type: any) => ({
      value: type.value,
      label: type.label,
      langKey: type.key,
    })),
  ],
  ["label"],
  ["asc"],
);

export const sellInOptions = [
  { value: "All", label: "All", langKey: "all" },
  ...SellerCatalogService.getSellingTypes().map((s: any) => ({
    value: s.value,
    label: s.label,
    langKey: s.langKey,
  })),
];

export const dealScopeOptions = [
  { value: "All", label: "All Deals", langKey: "all" },
  { value: "Local", label: "Only Local Deals", langKey: "onlyLocalDeals" },
  { value: "Global", label: "Only Global Deals", langKey: "onlyGlobalDeals" },
];

export const reserveOptions = [
  { value: "All", label: "All", langKey: "all" },
  { value: "Only Reserve", label: "Only Reserve", langKey: "onlyReserve" },
  {
    value: "Only without Reserve",
    label: "Only without Reserve",
    langKey: "onlyWithoutReserve",
  },
];

export interface Props {
  show: boolean;
  data?: any;
  callback: (payload: { data?: any; action: string }) => void;
  feature?: string;
  hideStatus?: boolean;
  hidePriceSlab?: boolean;
}

export type FormData = {
  menu: Array<{ label: string; value: any }>;
  brand: Array<{ label: string; value: any }>;
  category: Array<{ label: string; value: any }>;
  companyName?: Array<{ label: string; value: any }>;
  sellIn?: string;
  status: string;
  velocity: string;
  stockStatus: string;
  onlyOffers: boolean;
  withoutStock: boolean;
  isFixedPrice: boolean;
  isGroupDeal: boolean;
  isPriceSlab: boolean;
  reserve?: string;
  isPromotionalDeal: boolean;
  dealScope?: string;
};

export const DEFAULT_VALUES: FormData = {
  menu: [],
  brand: [],
  category: [],
  companyName: [],
  sellIn: "All",
  status: "Active",
  velocity: "All",
  stockStatus: "All",
  onlyOffers: false,
  withoutStock: false,
  isFixedPrice: false,
  isGroupDeal: false,
  isPriceSlab: false,
  reserve: "All",
  isPromotionalDeal: false,
  dealScope: "All",
};
