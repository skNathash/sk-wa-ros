import { endOfDay, startOfDay, sub } from "date-fns";

export type NetworkSummaryItem = {
  label: string;
  value: number | string;
  key: string; // unique key for item
  valueKey: string; // property name to read from a summary object
  color?: "primary" | "secondary" | "warning" | "danger" | "info" | "success";
};

const defaultSummary: NetworkSummaryItem[] = [
  {
    label: "Total",
    value: 0,
    key: "totalFranchises",
    valueKey: "totalFranchises",
    color: "primary",
  },
  {
    label: "Total SK Retailer",
    value: 0,
    key: "totalSkRetailer",
    valueKey: "totalSkRetailer",
    color: "primary",
  },
  {
    label: "Total SK Seller",
    value: 0,
    key: "totalSkSeller",
    valueKey: "totalSkSeller",
    color: "secondary",
  },
  {
    label: "Total SK Buyer",
    value: 0,
    key: "totalSkBuyer",
    valueKey: "totalSkBuyer",
    color: "warning",
  },
  {
    label: "Total SK Vendor",
    value: 0,
    key: "totalSkVendor",
    valueKey: "totalSkVendor",
    color: "info",
  },
];

export default defaultSummary;

// Prepare filter parameters for API calls
export const prepareParams = (filter: any) => {
  const params: any = {
    filter: {},
  };

  // Determine franchise id if provided either as explicit id or via selected franchise object
  const franchiseId = filter?.franchiseId || filter.franchise?.[0]?.value?.id;

  // If franchise is selected, force date-range to last 5 years till now
  if (franchiseId) {
    const now = new Date();
    params.filter.createdAt = {
      $gte: startOfDay(sub(now, { years: 5 })).toISOString(),
      $lte: endOfDay(now).toISOString(),
    };
    params.filter.franchiseId = franchiseId;
  } else {
    // Add date range filter when franchise is not selected
    if (filter.dateRange && filter.dateRange.length > 0) {
      params.filter.createdAt = {
        $gte: startOfDay(filter.dateRange[0]).toISOString(),
        $lte: endOfDay(filter.dateRange[1]).toISOString(),
      };
    } else {
      // No date range selected: default to last 30 years till now
      const now = new Date();
      params.filter.createdAt = {
        $gte: startOfDay(sub(now, { years: 30 })).toISOString(),
        $lte: endOfDay(now).toISOString(),
      };
    }
  }

  // Add state filter
  if (filter.state && filter.state !== "All") {
    params.filter.state = filter.state;
  }

  // Add district filter
  if (filter.district && filter.district !== "All") {
    params.filter.district = filter.district;
  }

  // Add town filter
  if (filter.town && filter.town !== "All") {
    params.filter.town = filter.town;
  }

  // Add network type filter
  if (filter.networkType && filter.networkType !== "all") {
    if (filter.networkType === "SKRETAILER") {
      params.filter.networkType = {
        $in: ["SKRETAILER", "SFSELLER", "SFBUYER"],
      };
    } else {
      params.filter.networkType = filter.networkType;
    }
  }

  // Add pincode filter
  if (filter.pincode) {
    params.filter.pincode = filter.pincode;
  }

  if (filter.planPurchased === "yes") {
    params.filter.hasSubscriptionPlan = true;
  } else if (filter.planPurchased === "no") {
    params.filter.hasSubscriptionPlan = false;
  }

  return params;
};

// Icon map for summary items. Import icons by key in components.
import { Building2, Users, User, Store } from "lucide-react";

export const summaryIconMap: Record<string, any> = {
  totalSkRetailer: Building2, // retailer
  totalSkSeller: Users, // sellers
  totalSkBuyer: User, // buyers
  totalSkVendor: Store, // vendors
  totalFranchises: Building2, // franchises
};

export type RawNetworkOverview = {
  count: number;
  networkType: string;
};

export function formatNetworkSummary(items: RawNetworkOverview[] | undefined) {
  const result = [...defaultSummary];

  if (!items || !Array.isArray(items)) return result;

  // helper to find and set value by key
  const setByKey = (key: string, value: number) => {
    const idx = result.findIndex((r) => r.key === key);
    if (idx > -1) result[idx] = { ...result[idx], value };
  };

  // gather counts by networkType
  const map: Record<string, number> = {};
  items.forEach((it) => {
    const t = (it.networkType || "").toUpperCase();
    map[t] = (map[t] || 0) + (it.count || 0);
  });

  // Map API types to summary keys
  // Assume API can return: SFSELLER, SKSELLER, SKBUYER, SK (retailer?), SKVENDOR, etc.
  const totalSkSeller = map["SKSELLER"] || 0;
  const totalSkBuyer = map["SKBUYER"] || 0;
  const totalSkVendor = map["SKVENDOR"] || 0;
  // Treat 'SK' as 'Sk Retailer' if present (map["SK"] || 0) + (map["SFSELLER"] || 0) +
  const totalSkRetailer = map["SKRETAILER"] || 0;

  setByKey("totalSkSeller", totalSkSeller);
  setByKey("totalSkBuyer", totalSkBuyer);
  setByKey("totalSkVendor", totalSkVendor);
  setByKey("totalSkRetailer", totalSkRetailer);

  const total = items.reduce((acc, curr) => acc + (curr.count || 0), 0);
  result[0].value = total;
  return result;
}
