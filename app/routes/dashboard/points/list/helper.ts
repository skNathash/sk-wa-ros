import { endOfDay, startOfDay } from "date-fns";
import { AlertTriangle, Gift, Star, TrendingUp, Users } from "lucide-react";
import LoyaltyPointService from "~/services/LoyaltyPointService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export const defaultFilter = {
  dateRange: [],
  search: "",
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState | null,
  sort: { key: string; value: SortValue } | null
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 10,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { reason: { $regex: search, $options: "i" } },
      { transactionType: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
    ];
  }

  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  }

  if (sort?.key && sort?.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (filter.type && filter.type !== "All") {
    params.filter.type = filter.type;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await LoyaltyPointService.getStatement({ ...params });
  return (response?.data?.data || []).map((item: any) =>
    LoyaltyPointService.formatStatemenResponse(item)
  );
};

export const getCount = async (params: Record<string, any>) => {
  const countParams = { ...params, outputType: "count" };
  const response = await LoyaltyPointService.getStatement(countParams);
  return response?.data?.count || 0;
};

export const getSummary = async (filter: Record<string, any>) => {
  const params = prepareParams(filter, null, null);

  const promises: [
    Promise<{ totalEarned: number; totalRedeemed: number }>,
    Promise<{ totalCustomers: number }>
  ] = [
    LoyaltyPointService.getRewardRedeemSummary(params),
    LoyaltyPointService.getLoyaltyCustomers(params),
  ];

  const [rewardRedeemSummary, loyaltyCustomers] = await Promise.all(promises);

  return {
    totalEarned: rewardRedeemSummary?.totalEarned || 0,
    totalRedeemed: rewardRedeemSummary?.totalRedeemed || 0,
    totalCustomers: loyaltyCustomers?.totalCustomers || 0,
    nearExpiry: 0,
  };
};

// Static summary data for the Points dashboard (temporary)
export const defaultSummary = [
  {
    key: "earned",
    label: "Total Rewarded Coins",
    langKey: "points.summary.earned",
    value: 0,
    icon: Gift,
    color: "success",
    valueKey: "totalEarned",
  },
  {
    key: "redeemed",
    label: "Total Redeemed Coins",
    langKey: "points.summary.redeemed",
    value: 0,
    icon: TrendingUp,
    color: "warning",
    valueKey: "totalRedeemed",
  },
  {
    key: "totalCustomers",
    label: "Total Customers",
    langKey: "points.summary.totalCustomers",
    value: 0,
    icon: Users,
    color: "info",
    valueKey: "totalCustomers",
  },
  {
    key: "nearExpiry",
    label: "Near Expiry Coins",
    langKey: "points.summary.nearExpiry",
    value: 0,
    icon: AlertTriangle,
    color: "warning",
    valueKey: "nearExpiry",
  },
];
