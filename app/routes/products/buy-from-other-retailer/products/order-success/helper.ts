import CommonService from "~/services/CommonService";
import OmsService from "~/services/OmsService";

export type SellerInfo = {
  franchiseName?: string;
  franchiseId?: string;
  refId?: string;
  mobile?: string;
  gst?: string;
  address?: {
    city?: string;
    district?: string;
    state?: string;
    pincode?: string | number;
  };
};

export type OrderItem = {
  dealName?: string;
  quantity?: number;
  uom?: string;
  selectedStockUom?: string;
  price?: number;
  mrp?: number;
  finalPrice?: number;
  images?: string[];
};

export type DiscountBreakup = {
  source?: string;
  code?: string;
  value?: number;
  valueType?: string;
};

export type Order = {
  orderId: string;
  orderRefNo?: string;
  orderAmount?: number;
  paymentMethod?: string;
  sellerInfo?: SellerInfo;
  items?: OrderItem[];
  isReserveOrder?: boolean;
  discountInfo?: {
    totalAmount?: number;
    breakup?: DiscountBreakup[];
  };
};

export type SellerGroup = {
  key: string;
  seller: SellerInfo;
  available: Order[];
  delayed: Order[];
  totalAmount: number;
  totalItems: number;
  totalItemsLabel: string;
  couponCode: string;
  couponDiscount: number;
};

// A coupon discount lives in the order's discountInfo breakup under
// source "Coupon" (same shape OmsService.formatOrderResponse normalizes).
export const getOrderCoupon = (order: Order) => {
  const breakup = order.discountInfo?.breakup ?? [];
  const coupon = breakup.find(
    (b) => (b.source || "").toLowerCase() === "coupon",
  );
  return {
    code: coupon?.code || "",
    value: coupon?.value || 0,
  };
};

export const formatAddress = (addr?: SellerInfo["address"]) => {
  if (!addr) return "";
  return [addr.city, addr.district, addr.state, addr.pincode]
    .filter(Boolean)
    .join(", ");
};

export const fetchOrders = async (ids: string[]): Promise<Order[]> => {
  if (ids.length === 0) return [];
  const resp = await OmsService.getMyOrders({
    filter: { _id: { $in: ids } },
  });
  return resp?.data?.data || [];
};

export const groupBySeller = (orders: Order[]): SellerGroup[] => {
  const map: Record<
    string,
    SellerGroup & { _uomEntries: Array<{ uom: string; qty: number }> }
  > = {};

  for (const order of orders) {
    const seller = order.sellerInfo || {};
    const key = seller.franchiseId || seller.refId || "unknown";

    if (!map[key]) {
      map[key] = {
        key,
        seller,
        available: [],
        delayed: [],
        totalAmount: 0,
        totalItems: 0,
        totalItemsLabel: "",
        couponCode: "",
        couponDiscount: 0,
        _uomEntries: [],
      };
    }

    const group = map[key];
    if (order.isReserveOrder) {
      group.delayed.push(order);
    } else {
      group.available.push(order);
    }

    const coupon = getOrderCoupon(order);
    if (coupon.value > 0) {
      group.couponDiscount += coupon.value;
      if (!group.couponCode && coupon.code) group.couponCode = coupon.code;
    }

    group.totalAmount += order.orderAmount || 0;
    for (const it of order.items || []) {
      group.totalItems += it.quantity || 0;
      group._uomEntries.push({
        uom: it.selectedStockUom || it.uom || "unit",
        qty: it.quantity || 0,
      });
    }
  }

  return Object.values(map).map(({ _uomEntries, ...g }) => ({
    ...g,
    totalItemsLabel: CommonService.groupQtyByUom(_uomEntries).label || "",
  }));
};
