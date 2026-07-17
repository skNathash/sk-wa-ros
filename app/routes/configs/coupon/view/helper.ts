import CouponService from "~/services/CouponService";

// Fetch a single coupon by id and normalise the response into the coupon object.
// Returns null when the request fails or no coupon is found.
export const getCoupon = async (id: string) => {
  const response = await CouponService.getCouponById(id);
  if (response?.statusCode === 200) {
    return response.data?.data ?? response.data ?? null;
  }
  return null;
};

// Build a human-readable discount string, e.g. "10% on PRICE" or "₹50 on PRICE".
export const renderDiscount = (coupon: any): string => {
  const d = coupon?.discount;
  if (!d) return "-";
  const value = d.kind === "PERCENT" ? `${d.value}%` : `₹${d.value}`;
  return `${value} on ${d.applyOn || "-"}`;
};

// Build a human-readable scope string, e.g. "CATEGORY (id1, id2)" or "CART".
export const renderScope = (coupon: any): string => {
  const s = coupon?.scope;
  if (!s) return "-";
  const ids = s.categoryIds || s.productIds || s.brandIds || [];
  return `${s.type || "-"}${ids.length ? ` (${ids.join(", ")})` : ""}`;
};
