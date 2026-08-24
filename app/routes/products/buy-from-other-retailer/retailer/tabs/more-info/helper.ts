import { format } from "date-fns";

export type Retailer = Record<string, any>;

export const EMPTY = "-";

const NETWORK_LABELS: Record<string, string> = {
  SKRETAILER: "SK Retailer",
  SKSELLER: "SK Seller",
  SKBUYER: "SK Buyer",
  SFSELLER: "SF Seller",
  SKMASTER: "SK Master",
  SKVENDOR: "SK Vendor",
};

export const formatNetworkType = (networkType?: string) => {
  if (!networkType) return EMPTY;
  return NETWORK_LABELS[networkType.toUpperCase()] || networkType;
};

export const formatMemberSince = (createdAt?: string) => {
  if (!createdAt) return EMPTY;
  try {
    return format(new Date(createdAt), "MMM yyyy");
  } catch {
    return EMPTY;
  }
};

export const formatPhone = (mobile?: string) => {
  if (!mobile) return EMPTY;
  const cleaned = String(mobile).replace(/\D/g, "");
  if (cleaned.length === 10) return `+91 ${cleaned}`;
  if (cleaned.length > 10 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2)}`;
  }
  return mobile;
};

export const formatAddress = (data: Retailer) => {
  const parts = [
    data.addressLine1,
    data.addressLine2,
    data.city,
    data.district,
    data.state,
    data.pincode,
  ].filter(Boolean);
  return parts.join(", ") || EMPTY;
};

export const formatShortAddress = (data: Retailer) => {
  const parts = [data.city, data.district, data.state].filter(Boolean);
  return parts.join(", ") || EMPTY;
};

export const formatDistance = (distance?: number) => {
  if (distance == null) return null;
  return `${Number(distance).toFixed(1)} km`;
};

export const getRating = (data: Retailer) => ({
  value: Number(data.ratingsSummary?.avgRating) || 0,
  totalReviews: Number(data.ratingsSummary?.totalReviews) || 0,
});

const BREAKDOWN_LABELS: { key: string; label: string }[] = [
  { key: "onTimeDelivery", label: "On-time delivery" },
  { key: "productQuality", label: "Product quality" },
  { key: "communication", label: "Communication" },
  { key: "pricingFairness", label: "Pricing fairness" },
];

export const getRatingBreakdown = (data: Retailer) => {
  const breakdown = data.ratingsSummary?.breakdown;
  if (Array.isArray(breakdown) && breakdown.length) {
    return breakdown.map((item: any) => ({
      label: item?.label || item?.key || EMPTY,
      value: Number(item?.value) || 0,
    }));
  }
  return BREAKDOWN_LABELS.map((item) => ({
    label: item.label,
    value: Number(breakdown?.[item.key]) || 0,
  }));
};

export const getServiceSla = (data: Retailer) => {
  const deliveryDays = Array.isArray(data.deliveryDays)
    ? data.deliveryDays.filter(Boolean).join(", ")
    : data.deliveryDays;

  return {
    deliveryEta: {
      title: data.deliveryEta || EMPTY,
      subTitle: data.deliveryEtaNote || "",
    },
    minOrder: {
      title: `₹${Number(data.minOrderAmount) || 0}`,
      subTitle: data.minOrderNote || "",
    },
    deliveryDays: {
      title: deliveryDays || EMPTY,
      subTitle: data.deliveryCutOff || "",
    },
    returns: {
      title: `${Number(data.returnWindowHours) || 0}h`,
      subTitle: data.returnPolicyNote || "",
    },
  };
};
