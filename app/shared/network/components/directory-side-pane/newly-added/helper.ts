import CustomerService from "~/services/CustomerService";
import FranchiseService from "~/services/FranchiseService";
import {
  formatActivityTime,
  type DirectoryNetwork,
} from "../recent-activity/helper";

export interface NewlyAddedItem {
  id: string;
  /** Customer name, the row title. */
  name: string;
  /** Two-letter chip, initials of the name. */
  code: string;
  /** Second line — mobile number, falling back to where they registered from. */
  detail: string;
  /** ISO date they joined the book; drives the trailing timestamp. */
  at: string | null;
}

/** Chip tints, cycled by row so a run of signups stays scannable. */
export const NEWLY_ADDED_TONE = [
  "tw:bg-blue-500 tw:text-white",
  "tw:bg-emerald-600 tw:text-white",
  "tw:bg-violet-500 tw:text-white",
  "tw:bg-amber-500 tw:text-white",
];

export const toneAt = (index: number) =>
  NEWLY_ADDED_TONE[index % NEWLY_ADDED_TONE.length];

const initialsOf = (name?: string) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "??";

/** Same "Today · 9:41 AM" ladder the activity feed uses. */
export { formatActivityTime };

export const toNewlyAddedItem = (customer: any): NewlyAddedItem => ({
  id: customer?._id,
  name: customer?.name || "Unknown",
  code: initialsOf(customer?.name),
  detail: customer?.mobile || customer?.registeredFrom || "No mobile",
  at: customer?.dateOfRegistration || customer?.createdAt || null,
});

/**
 * The customers that joined the book most recently. Reads the same b2c network
 * endpoint as the directory list, sorted newest-first by registration date —
 * the API already orders it, so no client-side sort is needed.
 */
export const getNewlyAdded = async (limit = 5) => {
  const response = await CustomerService.getCustomerNetwork({
    page: 1,
    limit,
    sort: "createdAt",
    order: "desc",
  });

  return ((response?.data?.data || []) as any[]).map(toNewlyAddedItem);
};

/** Retailer rows carry the store's town/state where a customer carries a
 *  registration source, so the second line falls back to the address. */
export const toNewlyAddedRetailer = (franchise: any): NewlyAddedItem => ({
  id: franchise?._id,
  name: franchise?.name || "Unknown",
  code: initialsOf(franchise?.name),
  detail:
    franchise?.mobile ||
    [franchise?.city || franchise?.town, franchise?.state]
      .filter(Boolean)
      .join(", ") ||
    "No mobile",
  at: franchise?.createdAt || null,
});

/**
 * The retailers that joined the network most recently — the B2B counterpart of
 * {@link getNewlyAdded}, reading the same `franchise/dashboard/franchises`
 * endpoint the B2B directory list runs on.
 */
export const getNewlyAddedRetailers = async (limit = 5) => {
  const response = await FranchiseService.getFranchiseDashboardList({
    page: 1,
    limit,
    sort: "createdAt",
    order: "desc",
    outputType: "list",
  });

  return ((response?.data?.data || []) as any[]).map(toNewlyAddedRetailer);
};

/** Newest joiners for whichever side of the network the pane is showing. */
export const getNewlyAddedFor = (network: DirectoryNetwork, limit = 5) =>
  network === "b2b" ? getNewlyAddedRetailers(limit) : getNewlyAdded(limit);
