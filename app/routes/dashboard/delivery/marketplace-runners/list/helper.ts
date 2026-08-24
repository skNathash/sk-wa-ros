import { format } from "date-fns";
import CommonService from "~/services/CommonService";
import LogisticsService from "~/services/LogisticsService";
import OmsService from "~/services/OmsService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import type { PaginationState } from "~/types/CommonTypes";

/** How the list is ordered; one option carries both the key and direction. */
export type RunnerSortKey = "createdAt" | "name" | "rate.baseCharge";

export interface RunnerSort {
  key: RunnerSortKey;
  value: "asc" | "desc";
}

/** The filter bar's shape, straight off the react-hook-form values. */
export interface RunnerFilter extends Record<string, any> {
  search: string;
  vehicleType: string;
  idle: boolean;
}

/** One marketplace runner row (`franchise/runner`). */
export interface MarketplaceRunner extends Record<string, any> {
  _id: string;
  /** Runner code shown on the card, e.g. "RN0001". */
  referenceId: string;
  name: string;
  mobile: string;
  email: string;
  gender: string;
  status: string;
  /** Free to take a drop right now. */
  isAvailable: boolean;
  isOtpVerified: boolean;
  /** Runner's average score out of five. */
  rating: number;
  /** Drops completed across the marketplace so far. */
  totalDrops: number;
  address: {
    city: string;
    postcode: string;
  };
  vehicleDetails: {
    type: string;
    capacity: string;
    vehicleNo: string;
  };
  /** Pickup fee, and the per-km slab charged on top of it. */
  rate: {
    baseCharge: number;
    chargePerKm: number;
  };
  /** Runner works every franchise, not just the ones in `allowedFranchises`. */
  isAvailableForAllFranchises: boolean;
  allowedFranchises: string[];
  createdAt: string;
  /** Display fields derived once in {@link formatRunner}. */
  _initials: string;
  /** "Now" while free, "Busy" otherwise. */
  _availableLbl: string;
  /** Score to one decimal, e.g. "4.8". */
  _ratingLbl: string;
  /** Completed drops, e.g. "512" — the card labels it. */
  _dropsLbl: string;
  /** "Kumbalgudu / 562109" — where the runner works out of, "--" if unset. */
  _locationLbl: string;
  /** Pickup fee, e.g. "₹35". */
  _baseChargeLbl: string;
  /** Distance slab, e.g. "₹6/km". */
  _perKmLbl: string;
  /** Registration date, e.g. "19 Aug 2026". */
  _joinedLbl: string;
}

/** Vehicle chips offered by the filter bar; "" leaves the type unrestricted. */
export const VEHICLE_TYPE_OPTIONS = [
  { value: "", label: "All vehicles" },
  { value: "scooter", label: "Scooter" },
  { value: "bike", label: "Bike" },
  { value: "truck", label: "Truck" },
  { value: "walk", label: "Walk" },
];

/** Sort options, each carrying its own direction. */
export const SORT_OPTIONS: Array<{
  value: string;
  label: string;
  sort: RunnerSort;
}> = [
  {
    value: "createdAt",
    label: "Sort · newest ↓",
    sort: { key: "createdAt", value: "desc" },
  },
  {
    value: "name",
    label: "Sort · name ↑",
    sort: { key: "name", value: "asc" },
  },
  {
    value: "baseCharge",
    label: "Sort · cheapest ↑",
    sort: { key: "rate.baseCharge", value: "asc" },
  },
];

export const DEFAULT_FILTER: RunnerFilter = {
  search: "",
  vehicleType: "",
  idle: true,
};

/** Build the runner-list query — paging, sort and the mongo-style `filter`. */
export const prepareParams = (
  filter: RunnerFilter,
  pagination: PaginationState,
  sort: RunnerSort,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    sort: { [sort.key]: sort.value === "asc" ? 1 : -1 },
    filter: {
      status: "Active",
    },
  };

  if (filter.idle) {
    params.filter.isAvailable = true;
  }

  if (filter.vehicleType) {
    params.filter["vehicleDetails.type"] = filter.vehicleType;
  }

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { "vehicleDetails.vehicleNo": { $regex: search, $options: "i" } },
    ];
  }

  return params;
};

export async function getData(
  params: Record<string, any>,
): Promise<MarketplaceRunner[]> {
  const response = await MarketplaceRunnerService.getRunners(params);
  const runners = response?.data?.data || [];

  return runners.map(formatRunner);
}

export async function getCount(params: Record<string, any>): Promise<number> {
  const response = await MarketplaceRunnerService.getRunners({
    ...params,
    outputType: "count",
  });

  return response?.data?.count || 0;
}

/** Derive everything a runner card renders. */
function formatRunner(runner: Record<string, any>): MarketplaceRunner {
  return {
    ...runner,
    _initials: CommonService.prepareInitials(runner.name),
    _availableLbl: runner.isAvailable ? "Now" : "Busy",
    _ratingLbl: CommonService.formattedAmount(runner.rating ?? 0, 1),
    _dropsLbl: CommonService.formattedAmount(runner.totalDrops ?? 0, 0),
    _locationLbl:
      [runner.address?.city, runner.address?.postcode]
        .filter(Boolean)
        .join(" / ") || "--",
    _baseChargeLbl: `₹${CommonService.formattedAmount(runner.rate?.baseCharge ?? 0, 0)}`,
    _perKmLbl: `₹${CommonService.formattedAmount(runner.rate?.chargePerKm ?? 0, 0)}/km`,
    _joinedLbl: runner.createdAt
      ? format(new Date(runner.createdAt), "dd MMM yyyy")
      : "-",
  } as MarketplaceRunner;
}

/**
 * Invoice the shipment is assigned against — `shipment/assign` needs it and
 * only the order id travels in the query string.
 */
export async function getOrderInvoiceId(orderId: string): Promise<string> {
  const response = await OmsService.getSellerOrderDetail(orderId);

  return response?.data?.data?.invoices?.[0]?.id;
}

/** Hire a marketplace runner for the picked order. */
export async function hireRunner(params: {
  orderId: string;
  invoiceId: string;
  runnerId: string;
}) {
  return LogisticsService.assignDelivery({
    orderId: params.orderId,
    invoiceId: params.invoiceId,
    deliveryAgentId: params.runnerId,
    deliveryAgentType: "External",
  });
}
