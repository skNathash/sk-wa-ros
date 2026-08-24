import VendorService from "~/services/VendorService";
import type { PaginationState } from "~/types/CommonTypes";

export interface FetchParams {
  page?: number;
  count?: number;
  filter?: Record<string, any>;
  sort?: Record<string, any>;
  [key: string]: any;
}

export function prepareParams(
  filter: Record<string, any>,
  pagination: PaginationState,
) {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { name: 1 },
    filter: {},
  };

  // Root-level search — backend handles name/mobile/id matching (mirrors the
  // Vendors list page, see routes/.../vendor/list/helper.ts).
  const search = filter.search?.trim();
  if (search) {
    params.search = search;
  }

  // Status chip (Active / Inactive)
  if (filter.status && filter.status !== "All") {
    params.filter.status = filter.status;
  }

  // Alpha strip — first-letter filter on the vendor name.
  if (filter.alpha) {
    params.filter.name = "^" + filter.alpha;
  }

  // Sort popover overrides the default name-ascending sort.
  if (filter.sort) {
    const { key, value } = filter.sort;
    params.sort = { [key]: value === "asc" ? 1 : -1 };
  }

  return params;
}

export async function getData(params: FetchParams = {}) {
  const resp = await VendorService.getVendorsWithStats(params);
  return resp?.data?.data || [];
}

export async function getCount(params: FetchParams = {}) {
  const resp = await VendorService.getVendorsWithStats({
    ...params,
    outputType: "count",
  });
  return resp?.data?.count || 0;
}

// Deterministic avatar tint so the same vendor always keeps the same colour.
const AVATAR_COLORS = [
  "tw:bg-blue-500",
  "tw:bg-cyan-500",
  "tw:bg-teal-600",
  "tw:bg-purple-500",
  "tw:bg-indigo-500",
  "tw:bg-pink-500",
  "tw:bg-emerald-600",
];

export const getAvatarColor = (name?: string) => {
  const key = (name || "").trim();
  if (!key) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
};

/** Two-letter avatar initials — first letters of the first two name words. */
export const getInitials = (name?: string) => {
  const words = (name || "").trim().split(/[\s_-]+/).filter(Boolean);
  if (!words.length) return "V";
  const letters = words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("");
  return letters.toUpperCase();
};

export default {
  prepareParams,
  getData,
  getCount,
  getAvatarColor,
  getInitials,
};
