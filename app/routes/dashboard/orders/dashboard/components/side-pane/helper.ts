import { format } from "date-fns";

/** The dashboard's channel scopes — the `mainTab` values, as pane chips. */
export interface DashboardChannel {
  key: string;
  label: string;
  /** Short label for the lane rows. */
  shortLabel: string;
  /** Lane colour — matches the dot/number tones of the feed's channel cards. */
  dotClass: string;
  numberClass: string;
  barClass: string;
}

export const DASHBOARD_CHANNELS: DashboardChannel[] = [
  {
    key: "all-orders",
    label: "All Orders",
    shortLabel: "All",
    dotClass: "tw:bg-teal-700",
    numberClass: "tw:text-gray-900",
    barClass: "tw:bg-teal-600",
  },
  {
    key: "b2b-orders",
    label: "B2B",
    shortLabel: "B2B",
    dotClass: "tw:bg-emerald-500",
    numberClass: "tw:text-emerald-700",
    barClass: "tw:bg-emerald-500",
  },
  {
    key: "b2c-orders",
    label: "B2C",
    shortLabel: "B2C",
    dotClass: "tw:bg-amber-500",
    numberClass: "tw:text-amber-600",
    barClass: "tw:bg-amber-500",
  },
];

export const getChannel = (key: string) =>
  DASHBOARD_CHANNELS.find((channel) => channel.key === key) ??
  DASHBOARD_CHANNELS[0];

/** "21 Jul – 20 Aug" for the window the dashboard's filter bar is holding. */
export const formatDateRangeLabel = (
  dateFrom?: string | Date,
  dateTo?: string | Date,
) => {
  if (!dateFrom || !dateTo) return "";

  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "";

  return `${format(from, "d MMM")} – ${format(to, "d MMM")}`;
};

/**
 * Share of the parent scope a lane holds, 0 → 100. Drives the lane bars, so
 * B2B and B2C read as parts of the same whole rather than two loose numbers.
 */
export const getShare = (part: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((part / total) * 100)) : 0;
