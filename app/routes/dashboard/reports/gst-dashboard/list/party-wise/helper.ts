import AuthService from "~/services/AuthService";
import ReportService from "~/services/ReportService";
import type { PaginationState } from "~/types/CommonTypes";

export type Lane = "b2b" | "b2c";

/**
 * What the table is showing. Two of these are lanes the endpoint knows about;
 * "mismatch" is the B2B lane narrowed to the rows that fail the GSTR-2A check,
 * which only we can decide.
 */
export type PartyFilter = Lane | "mismatch";

/** The lane a filter reads from — "mismatch" lives inside B2B. */
export const laneOf = (filter: PartyFilter): Lane =>
  filter === "b2c" ? "b2c" : "b2b";

/** Card header for the table under the tiles. */
export const getListTitle = (filter: PartyFilter) => {
  if (filter === "b2c") return "B2C invoices · top by taxable value";
  if (filter === "mismatch") return "GSTIN mismatches · follow up";

  return "B2B parties · top by taxable value";
};

export interface PartyRow {
  _id: string;
  customerId: string;
  name: string;
  mobile: string;
  customerType: string;
  gstNumber: string;
  state: string;
  orderCount: number;
  totalTaxableAmount: number;
  totalTax: number;
  totalAmount: number;
  /** GSTR-2A match: the GSTIN's state prefix agrees with the party's state. */
  matched: boolean;
  raw: any;
}

export interface LaneSummary {
  type: Lane | "";
  parties: number;
  orders: number;
  totalTaxableAmount: number;
  totalTax: number;
  totalAmount: number;
}

export const defaultLaneSummary: LaneSummary = {
  type: "",
  parties: 0,
  orders: 0,
  totalTaxableAmount: 0,
  totalTax: 0,
  totalAmount: 0,
};

/** GSTIN state prefix → [state name, short code]. */
const stateByCode: Record<string, [string, string]> = {
  "01": ["Jammu and Kashmir", "JK"],
  "02": ["Himachal Pradesh", "HP"],
  "03": ["Punjab", "PB"],
  "04": ["Chandigarh", "CH"],
  "05": ["Uttarakhand", "UK"],
  "06": ["Haryana", "HR"],
  "07": ["Delhi", "DL"],
  "08": ["Rajasthan", "RJ"],
  "09": ["Uttar Pradesh", "UP"],
  "10": ["Bihar", "BR"],
  "11": ["Sikkim", "SK"],
  "12": ["Arunachal Pradesh", "AR"],
  "13": ["Nagaland", "NL"],
  "14": ["Manipur", "MN"],
  "15": ["Mizoram", "MZ"],
  "16": ["Tripura", "TR"],
  "17": ["Meghalaya", "ML"],
  "18": ["Assam", "AS"],
  "19": ["West Bengal", "WB"],
  "20": ["Jharkhand", "JH"],
  "21": ["Odisha", "OD"],
  "22": ["Chhattisgarh", "CG"],
  "23": ["Madhya Pradesh", "MP"],
  "24": ["Gujarat", "GJ"],
  "26": ["Dadra and Nagar Haveli and Daman and Diu", "DN"],
  "27": ["Maharashtra", "MH"],
  "29": ["Karnataka", "KA"],
  "30": ["Goa", "GA"],
  "31": ["Lakshadweep", "LD"],
  "32": ["Kerala", "KL"],
  "33": ["Tamil Nadu", "TN"],
  "34": ["Puducherry", "PY"],
  "35": ["Andaman and Nicobar Islands", "AN"],
  "36": ["Telangana", "TS"],
  "37": ["Andhra Pradesh", "AP"],
  "38": ["Ladakh", "LA"],
};

const codeByState: Record<string, string> = Object.entries(stateByCode).reduce(
  (acc, [code, [name]]) => {
    acc[name.toLowerCase()] = code;
    return acc;
  },
  {} as Record<string, string>,
);

/** GSTIN prefix for a state name, "" when the name is unknown/empty. */
export const getStateCode = (state?: string) =>
  codeByState[(state || "").trim().toLowerCase()] || "";

/** Full state name for a GSTIN prefix, "" when the prefix is not a state. */
export const getStateName = (code?: string) =>
  stateByCode[(code || "").trim()]?.[0] || "";

/** The franchise's own state — everything else is an inter-state supply. */
export const getHomeStateCode = () => {
  const user: any = AuthService.getLoggedInUser() || {};
  return getStateCode(user?.state);
};

/** Compact Indian money label used in the summary captions — ₹2.45L, ₹1.2Cr. */
export const formatCompactAmount = (value: number) => {
  const n = Math.abs(value || 0);
  const sign = value < 0 ? "-" : "";

  if (n >= 10000000) return `${sign}₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `${sign}₹${(n / 100000).toFixed(2)}L`;

  return `${sign}₹${Math.round(n).toLocaleString("en-IN")}`;
};

export interface ApiPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PartyListResult {
  rows: PartyRow[];
  pagination: ApiPagination | null;
}

/**
 * Params for sales/dashboard/customertax. The endpoint takes only the lane and
 * the page window — anything else (dates, search, sort) is rejected, so the
 * period/search filtering is applied on the rows we get back.
 */
export const prepareParams = (
  filter: Record<string, any> = {},
  pagination: Partial<PaginationState> = {},
) => {
  const params: Record<string, any> = {
    type: filter?.type || "b2b",
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 10,
  };

  return params;
};

// Fetch the party rows for a lane.
export const getData = async (
  params: Record<string, any>,
): Promise<PartyListResult> => {
  try {
    const r = await ReportService.getCustomerTax({
      type: params?.type || "b2b",
      outputType: "list",
      page: params?.page || 1,
      limit: params?.limit || 10,
    });

    const body: any = r?.data || {};
    const rows: PartyRow[] = (body.data || []).map((p: any, index: number) => {
      const gstNumber = p.gstNumber || "";
      const stateCode = getStateCode(p.state);

      return {
        _id: p.customerId || `${index}`,
        customerId: p.customerId || "",
        name: p.name?.trim() || "",
        mobile: p.mobile || "",
        customerType: p.customerType || "",
        gstNumber,
        // Fall back to the state the GSTIN itself names when the row omits it.
        state: p.state || getStateName(gstNumber.slice(0, 2)),
        orderCount: p.orderCount || 0,
        totalTaxableAmount: p.totalTaxableAmount || 0,
        totalTax: p.totalTax || 0,
        totalAmount: p.totalAmount || 0,
        // A GSTIN always opens with its state's code; when it disagrees with the
        // party's state the invoice will not line up against GSTR-2A.
        matched: !!gstNumber && !!stateCode && gstNumber.slice(0, 2) === stateCode,
        raw: p,
      };
    });

    return { rows, pagination: body.pagination || null };
  } catch (error) {
    console.error("Error fetching party-wise data:", error);
    return { rows: [], pagination: null };
  }
};

/**
 * Every party in the lane, for the blocks that describe the lane as a whole
 * (the state-wise split) rather than the table's current page. The endpoint
 * pages, so this walks the pages until they run out.
 */
export const getAllData = async (
  filter: Record<string, any> = {},
  maxRows = 500,
): Promise<PartyRow[]> => {
  const rows: PartyRow[] = [];
  let page = 1;

  // eslint-disable-next-line no-constant-condition
  while (rows.length < maxRows) {
    const result = await getData({
      type: filter?.type || "b2b",
      page,
      limit: 100,
    });

    rows.push(...result.rows);

    if (!result.pagination?.hasNextPage || result.rows.length === 0) break;
    page += 1;
  }

  return rows;
};

// Lane totals — describes the whole lane, never the loaded page.
export const getCount = async (
  params: Record<string, any>,
): Promise<LaneSummary> => {
  try {
    const r = await ReportService.getCustomerTax({
      type: params?.type || "b2b",
      outputType: "count",
    });
    const d: any = r?.data?.data || {};

    return {
      type: d.type || params.type || "",
      parties: d.parties || 0,
      orders: d.orders || 0,
      totalTaxableAmount: d.totalTaxableAmount || 0,
      totalTax: d.totalTax || 0,
      totalAmount: d.totalAmount || 0,
    };
  } catch (error) {
    console.error("Error fetching party-wise count:", error);
    return { ...defaultLaneSummary };
  }
};

export type PartySortKey =
  | "name"
  | "gstNumber"
  | "state"
  | "orderCount"
  | "totalTaxableAmount"
  | "totalTax"
  | "matched";

/**
 * Order the rows we hold. The endpoint takes no sort params, so this runs over
 * what has been loaded so far rather than over the whole lane.
 */
export const sortRows = (
  rows: PartyRow[],
  sort?: { key: string; value: "asc" | "desc" },
): PartyRow[] => {
  if (!sort?.key) return rows;

  const dir = sort.value === "desc" ? -1 : 1;

  return [...rows].sort((a, b) => {
    const left = a[sort.key as keyof PartyRow];
    const right = b[sort.key as keyof PartyRow];

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * dir;
    }

    if (typeof left === "boolean" && typeof right === "boolean") {
      return (Number(left) - Number(right)) * dir;
    }

    return String(left ?? "").localeCompare(String(right ?? ""), "en", {
      sensitivity: "base",
    }) * dir;
  });
};

export interface StateSplit {
  code: string;
  name: string;
  intra: boolean;
  invoices: number;
  tax: number;
}

/**
 * Split the loaded rows into intra-state (CGST + SGST) and inter-state (IGST)
 * buckets, keyed by the party's state.
 */
export const buildStateSplit = (rows: PartyRow[]): StateSplit[] => {
  const home = getHomeStateCode();
  const byState = new Map<string, StateSplit>();

  rows.forEach((row) => {
    const code = getStateCode(row.state) || row.gstNumber.slice(0, 2);
    if (!code) return;

    const existing: StateSplit = byState.get(code) || {
      code,
      name: row.state || getStateName(code),
      // With no franchise state on record, treat the busiest state as home.
      intra: home ? code === home : false,
      invoices: 0,
      tax: 0,
    };

    existing.invoices += row.orderCount;
    existing.tax += row.totalTax;
    byState.set(code, existing);
  });

  const splits = Array.from(byState.values()).sort(
    (a, b) => b.invoices - a.invoices,
  );

  if (!home && splits.length) splits[0].intra = true;

  // Both lanes always appear, at ₹0 when nothing was supplied that way — an
  // empty side is itself the answer to "did place-of-supply come out right?".
  if (!splits.some((s) => s.intra)) {
    splits.unshift({
      code: home,
      name: getStateName(home) || "Home state",
      intra: true,
      invoices: 0,
      tax: 0,
    });
  }

  if (!splits.some((s) => !s.intra)) {
    splits.push({
      code: "",
      name: "Other states",
      intra: false,
      invoices: 0,
      tax: 0,
    });
  }

  return splits;
};

export default {
  getData,
  getCount,
  prepareParams,
};
