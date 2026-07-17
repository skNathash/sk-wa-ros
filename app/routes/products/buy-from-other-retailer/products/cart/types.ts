export interface CartItem {
  deal: {
    id: string;
    refId: string;
    name: string;
    type: string;
  };
  category: {
    id: string;
    categoryId: string;
    name: string;
  };
  brand: {
    id: string;
    brandId: string;
    name: string;
  };
  weight: {
    unit: string;
  };
  itemId: string;
  hsn: string;
  tax: number;
  images: string[];
  isCustomerRequestedItem: boolean;
  quantity: number;
  mrp: number;
  purchasePrice: number;
  availableStock: number;
  uom: string;
  isConsumerOffer: boolean;
  _id: string;
  snapshots: any[];
  priceSlab?: any;
  actualQuantity: number;
  caseQty: number;
  innerCaseQty: number;
  sellingType: string;
}

export interface RouteInfo {
  routeId?: string;
  routeRefId?: string;
  routeCode?: string;
  description?: string;
  deliveryDay?: string;
  deliveryDate?: string;
  isRoutePlanned?: boolean;
  nextDeliveryDates?: Array<{
    day: string;
    nextDate: string;
  }>;
  isParentRoute?: boolean;
  parentRoutes?: any[];
}

export interface PaymentsType {
  type: string;
  paymentMethodConfig?: Array<{
    paymentMethod: string;
    refCode: string;
    images?: string[];
  }>;
}

export interface SelectedPaymentType {
  paymentType: string;
  paymentMethod: string;
  paymentMode: {
    type: string;
    amount: number;
    referenceNumber?: string;
    proof?: string[];
    remarks?: string;
  };
}

export interface SellerData {
  _id: string;
  items: CartItem[];
  franchiseInfo: {
    name: string;
    id: string;
    distance: number;
  };
  routeInfo?: RouteInfo;
  selectedRoute?: {
    routeId?: string;
    routeRefId?: string;
    deliveryDate?: string;
    routeCode?: string;
    description?: string;
  };

  minCartValue: number;
  payments?: Array<PaymentsType>;
  selectedPayment?: SelectedPaymentType;

  // Raw coupon fields returned by the cart API
  couponApplied?: boolean;
  totalBeforeCoupon?: number;
  totalAfterCoupon?: number;
  totalCouponDiscount?: number;
  discountInfo?: {
    totalAmount?: number;
    breakup?: Array<{
      source?: string;
      code?: string;
      value?: number;
      valueType?: string;
    }>;
  };

  // Normalized coupon summary derived in helper.ts (single source of truth for UI)
  couponInfo?: CouponInfo;
}

export interface CouponInfo {
  couponApplied: boolean;
  code: string | null;
  source: string | null;
  totalAfterCoupon: number;
  totalBeforeCoupon: number;
  totalCouponDiscount: number;
}

