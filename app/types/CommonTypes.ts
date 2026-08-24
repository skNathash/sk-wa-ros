export interface PaginationState {
  activePage: number;
  rowsPerPage: number;
  startSlNo: number;
  endSlNo: number;
  totalRecords: number;
}

export type SellingType = "CASE" | "UNIT" | "INNER_CASE";

export type PackConfigItemType = {
  packType: string;
  quantity: number;
  isDefault: boolean;
  allowCaseQtyOverride: boolean;
};

export interface BreadcrumbItem {
  label: string;
  redirect?: {
    path: string;
    params?: Record<string, string | boolean>;
    isGoBack?: boolean;
  };
  langKey?: string;
  langParams?: Record<string, string>;
}

export interface TabItem {
  name: string;
  key: string;
  icon?: string | React.ReactNode;
  langKey?: string;
  rbac?: string[];
  count?: number;
  countColor?: string;
  badge?: string;
  badgeColor?: string;
  /**
   * Extra classes on the tab button itself — for per-tab accent styling (e.g.
   * the AI tab's violet fill) that shouldn't apply to the rest of the bar.
   */
  className?: string;
}

export type SectionTabKey =
  | "home"
  | "bill"
  | "business"
  | "supply"
  | "catalog"
  | "profile";

export interface SectionTabRedirect {
  url: string;
  params?: Record<string, string | number | boolean>;
}

export interface SectionTab {
  label: string;
  key: string;
  langKey?: string;
  /**
   * One-line explanation of the destination, shown under the label in the
   * theme-2 header section switcher (e.g. "Buy stock · marketplace").
   */
  description?: string;
  icon?: string | React.ReactNode;
  rbac?: string[];
  /**
   * Optional group heading the tab sits under (e.g. "Customers"). Tabs sharing
   * a group must be listed consecutively — the desktop rail
   * ({@link SectionMenu}) and the mobile switch sheet
   * ({@link SectionSwitchSheet}) print the heading once above the run. Tabs
   * without a group render with no heading. The mobile tab scroller
   * ({@link SectionTabs}) ignores groups.
   */
  group?: string;
  /**
   * When true the tab is shown only in the desktop side rail
   * ({@link SectionMenu}) and omitted from the mobile horizontal tab scroller
   * ({@link SectionTabs}). Use for entries that only make sense on desktop.
   */
  desktopOnly?: boolean;
  /**
   * Optional notification count shown as a red badge on the tab's icon in the
   * desktop side rail ({@link SectionMenu}). Hidden when 0/undefined.
   */
  badge?: number | string;
  /** Extra classes on the tab button — see {@link TabItem.className}. */
  className?: string;
  redirect?: SectionTabRedirect;
}

export interface SoldInfo {
  lastOrder: string;
  qty: number;
}

/**
 * A B2B price configured for one buyer group on a deal — the group-scoped
 * counterpart of the deal's own network price.
 */
export interface NetworkGroupPrice {
  id: string;
  /** Group type from the seller-group config, e.g. "SKRETAILER". */
  type: string;
  name: string;
  /** Retailers mapped to the group. */
  sellersCount: number;
  price: number;
  discount: number;
  /** "Normal" (on MRP) or "Fixed". */
  discountType: string;
  isActive: boolean;
  /** Raw sync state from the API, e.g. "Synced" / "Notsynced". */
  status: string;
  isSynced: boolean;
}

/** Roll-up returned alongside the per-group prices. */
export interface NetworkGroupPriceInfo {
  totalGroups: number;
  totalSellers: number;
}

export interface SellersArrayItem {
  sellingType: SellingType;
  packageQty: number;
  actualMaxQty: number;
  price: any;
  qty: number;
  /**
   * Order quantity rules for this seller's deal. SK deals carry them on the
   * network `sellers` array as `b2bMinQuantity` / `incrementQuantity`; other
   * sellers default to 1.
   */
  minQty: number;
  incrQty: number;
  name: string;
  id: string;
  refId: string;
  mrp: number;
  networkBasePrice?: number;
  distance: number;
  isSkSeller: boolean;
  isServiceable?: boolean;
  discountPercentage: number;
  /** Raw discount percentage returned by the network API for this seller. */
  discount?: number;
  cartQuantity: number;
  cartId: string;
  itemId: string;
  isConnectedSeller?: boolean;
  /** Seller ratings from the API (absent when the seller has none). */
  ratingsSummary?: {
    avgRating?: number;
    totalRatings?: number;
  };
  // Recommendation tags from the network reorder API
  // ("cheap" | "previously-purchased" | "fast-delivery")
  tags?: string[];
  city?: string;
  district?: string;
  pincode?: string;
  priceSlab?: {
    isAvailable: boolean;
    slab: Array<{
      min: number;
      max: number;
      offerPrice: number;
      discount: number;
    }>;
    configId: string | null;
  };
  b2bScheme?: {
    status?: string;
    statusColor?: VariantColor;
    isOfferOfTheDay?: boolean;
    isDefaultOffer?: boolean;
    offerStartDate?: string | null;
    offerEndDate?: string | null;
    offerDiscount?: number;
    offerPrice?: number;
    isTaxInclusive?: boolean;
  };
}

export interface Deal {
  name: string;
  selectedSeller: any;
  maxQty: number;
  actualMaxQty: number;
  incrQty: number;
  minQty: number;
  mrp: number;
  price: number;
  displayPrice: number;
  discount: number;
  images: any[];
  id: string;
  _id: string;
  inventoryNew: any[];
  inCart?: { status: boolean; qty?: number };
  soldInfo?: SoldInfo;
  companyName?: string;
  category?: { _id: string; name: string; id?: string; _displayName?: string };
  brand?: { _id: string; name: string; id?: string; _displayName?: string };
  menu?: { _id: string; name: string; id?: string; _displayName?: string };
  description?: string;
  shortDescription?: string;
  highlights?: string[];
  isSfToSf?: boolean;
  whId?: string;
  fulfilledBy: string;
  buyViaPurchaseBasket?: boolean;
  inBasket?: { status: boolean; qty?: number };
  product?: any;
  _raw?: any;
  showOtherDeals?: boolean;
  priceSlabs?: any[];
  checkPrice?: boolean;
  isOutOfStock?: boolean;
  hsn?: string;
  gst?: number;
  additionalCess?: number;
  buyFromOtherRetailer?: {
    status: boolean;
    retailerId: string;
  };
  cartId?: string;
  itemId?: string;
  groupDeals?: Array<any>;
  netWeight?: string;
  _ignoreGroupDeals?: boolean;
  sellers?: any[];
  totalSellers?: number;
  isKCStoreEnabled?: boolean;
  kcStoreInfo?: any;
  sellingType?: SellingType;
  sellingTypeColor?: VariantColor;
  caseQty?: number;
  innerCaseQty?: number;
  overrideCaseQtyOnLowStock?: boolean;
  overrideInnerCaseQtyOnLowStock?: boolean;
  overridePackQtyOnLowStock?: boolean;
  packageQty?: number;
  selectedStockUom?: string;
}

export type VariantColor =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "primary"
  | "light"
  | "white"
  | "danger";

export type ButtonColor =
  | "danger"
  | "dark"
  | "light"
  | "medium"
  | "primary"
  | "secondary"
  | "success"
  | "tertiary"
  | "warning";

export interface SellerDeal extends Deal {
  locations: any[];
  /** Seller-deal document id — the key APIs scoped to the seller's own deal take. */
  sellerDealObjId?: string;
  subscribedBy?: { id?: string; name?: string; type?: string } | any;
  inventoryValue: number;
  /** Period-over-period change in stock-on-hand value; omitted when unknown. */
  inventoryValueChange?: number;
  poStatus?: string;
  status?: string;
  movementType?: string;
  _movementTypeColor?: VariantColor;
  barcodes: string[];
  purchasePrice: number;
  b2bPrice: number;
  b2cPrice: number;
  b2bDiscount: number;
  b2cDiscount: number;
  openPoAnalytics: {
    openPos: any[];
    totalOpenPos: number;
    totalPendingQuantity: number;
    totalPendingValue: number;
  };
  priceChangeHistory?: any[];
  purchaseInfo?: any;
  // Shelf Life Information
  shelfLifeInfo?: {
    expiryDate: string | null;
    remainingShelfLifeDays: number | null;
    isNearExpiry: boolean;
    nearExpiryThreshold: number;
    lastCalculated: string | null;
  };
  // Sales Information
  customerSalesInfo?: {
    salesHistory: any[];
  };
  networkSalesInfo?: {
    overAllQuantity: number;
    salesHistory: any[];
  };
  blockedQty?: number;
  pickedQty?: number;
  salesAnalytics?: {
    last7Days: { quantity: number; value: number };
    last15Days: { quantity: number; value: number };
    last30Days: { quantity: number; value: number };
    last45Days: { quantity: number; value: number };
    last60Days: { quantity: number; value: number };
    last90Days: { quantity: number; value: number };
  };
  totalSales: {
    value: number;
    quantity: number;
  };
  totalStock: number;
  // Logged-in retailer's own stock of this deal (network reorder APIs)
  loggedInUserStock?: number;
  loggedInUserStockUom?: string;
  // Seller the logged-in retailer last purchased this product from
  lastPurchaseFrom?: string;
  // Logged-in retailer's own sales analytics
  loggedInUserSalesAnalytics?: {
    last7Days: { quantity: number; value: number };
  };
  // Sales velocity — units the logged-in retailer sold in the last 7 days
  vsl?: number;
  basePrice?: number;
  consumerOffer?: {
    enabled?: boolean;
    title?: string;
  };
  isKCStoreEnabled?: boolean;
  kcStoreInfo?: any;
  b2bScheme?: {
    status?: string;
    statusColor?: VariantColor;
    isOfferOfTheDay?: boolean;
    isDefaultOffer?: boolean;
    offerStartDate?: string | null;
    offerEndDate?: string | null;
    offerDiscount?: number;
    offerPrice?: number;
    isTaxInclusive?: boolean;
  };
  isB2bMarginConfigured?: boolean;
  /** B2B prices configured per buyer group (`networkGroupSellingPrice`). */
  networkGroupPrices?: NetworkGroupPrice[];
  networkGroupPriceInfo?: NetworkGroupPriceInfo;
  isReserve?: boolean;
  isPromotionalDeal?: boolean;
  isLocalDeal?: boolean;
  sellerSocialMediaLinks?: { name: string; link: string }[];
  dealSocialMediaLinks?: { name?: string; url?: string; link?: string }[];
  youtubeLink?: { name: string; link: string }[];
  instaLink?: { name: string; link: string }[];
  velocity?: string;
  b2bDiscountType?: string;
  b2cDiscountType?: string;
  networkPriceSlab?: any;
  customerPriceSlab?: any;
  priceSlabs?: any[];
  priceSlabType?: string;
  partnerOnlinePrices?: {
    name: string;
    price?: number;
    lastSynced?: string;
    isActive?: boolean;
    lastPrice?: number;
    productUrl?: string;
  }[];
  /**
   * Pre-shaped competitor pricing from SellerCatalogService.buildPartnerPriceData:
   * Amazon and Flipkart as named slots (null when absent), every other
   * marketplace under `others`. `isLowest` marks the cheapest active price.
   */
  partnerPriceData?: {
    amazon: { price: number; isLowest: boolean; url?: string } | null;
    flipkart: { price: number; isLowest: boolean; url?: string } | null;
    other: { price: number; isLowest: boolean; url?: string } | null;
    others: { name: string; price: number; isLowest: boolean; url?: string }[];
  };
  hideUnitConfigEdit?: boolean;
}

export interface CartAction {
  action: "add" | "update" | "remove" | "add-to-basket";
  data: any;
}

export interface DealInventorySnapshotType {
  id: string;
  quantity: number;
  scannedQuantity: number;
  mrp: number;
  sellableQty: number;
  barcode: string;
  expiry: Date | string;
  inventoryType: string;
  b2bPrice: number;
  purchasePrice: number;
  tax: number;
  dealId: string;
  blockedQty: any[];
  sellerInfo: {
    _id: string;
    fId: string;
  };
  nearExpiry: {
    desc: string;
  };
}

export interface ScanDealType {
  id: string;
  quantity: number;
  scannedQuantity: number;
  mrp: number;
  snapshots: Array<DealInventorySnapshotType>;
}

export interface TableHeaderItem {
  label: string | React.ReactNode;
  langKey?: string;
  width?: string;
  enableSort?: boolean;
  isCentered?: boolean;
  isRightAligned?: boolean;
  colSpan?: number;
  key?: string;
  isSticky?: boolean;
  info?: React.ReactNode;
  /** Optional background/utility classes for this header cell (e.g. group tint). */
  className?: string;
}

export interface MenuItem {
  label: string;
  langKey: string;
  icon?: any;
  path?: string;
  allowed: string[];
  children?: MenuItem[];
  id?: string;
  description?: string;
  badge?: {
    path: keyof MenuCount;
    count?: number;
  };
  rbac?: string[];
  color?: VariantColor;
  key?: string;
  count?: number;
  fids?: string[];
  isNew?: boolean;
}

export interface MenuCount {
  b2bOrderProcess: number;
  b2bOrderApprovalPending: number;
  b2cOrderApprovalPending: number;
  b2cOrderProcess: number;
}

export interface AppliedFilterLabel {
  label: string;
  type?: "date" | "dateRange" | "time";
  resetValue?: any;
  dateFormat?: string;
  ignoreValue?: any; // Value to ignore (filter won't be displayed if it matches this)
  value?: {
    isMulti?: boolean;
    path?: string;
  };
  showCloseIcon?: boolean;
}

export type SortValue = "asc" | "desc" | undefined;

export interface SortProps {
  key: string;
  value: SortValue;
}

/**
 * Snapshot master data item representing a single snapshot master record
 */
export interface SnapshotMasterDataItem {
  _id: string;
  quantity: number;
  mrp: number;
  barcode: string;
  expiry: string;
  usedQty?: number;
  remainingDays?: number;
  sellInLooseQty?: boolean;
  purchasePrice?: number;
  stockMasterId?: string;
  [key: string]: any;
}

/**
 * Snapshot master item representing grouped snapshot master data by mrp, barcode, and expiry
 */
export interface SnapshotMasterItem {
  mrp: number;
  barcode: string;
  expiry: string;
  totalQuantity: number;
  enteredStock?: number;
  remainingDays?: number;
  masters: SnapshotMasterDataItem[];
}

/**
 * Used snapshot representing a snapshot that has been used/selected
 */
export interface UsedSnapshot {
  id: string;
  quantity: number;
  [key: string]: any;
}

export type ViewToggleType = "list" | "card";

export type PayableReceivableEntityType = "customer" | "vendor" | "franchise";

export type BuyCartType = "normal" | "buyer" | "buy-from-other-retailer";

export type UserType =
  | "BUYER"
  | "SELLER"
  | "MASTER_LOGIN"
  | "SKRETAILER"
  | "SFSELLER"
  | "SFBUYER"
  | "SKSELLER"
  | "SKBUYER";

/**
 * Normalized seller inventory activity log entry consumed by the activity log UI
 */
export interface InventoryActivityLog {
  id: string;
  activityType: string;
  action: string;
  status: string;
  loggedAt: string;
  title: string;
  subtitle: string;
  code: string;
  badgeVariant: "primary" | "secondary" | "success" | "warning" | "danger";
  valueLabel: string;
}
