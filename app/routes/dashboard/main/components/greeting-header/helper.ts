/**
 * Static data source for the dashboard greeting row. Swap the resolved value
 * for a real service call once the endpoint exists — the component only knows
 * about `getGreetingHeader()`. The names are the exception: they come from the
 * logged-in franchise so the greeting always addresses the real user.
 */

import AuthService from "~/services/AuthService";

export type GreetingHeaderData = {
  /** "TODAY · SRI LAKSHMI STORES" left eyebrow. */
  storeName: string;
  ownerName: string;
  /** "Good morning" / "Good afternoon" / "Good evening". */
  greeting: string;
  /** "Monday, 17 August 2026" */
  dateLabel: string;
  /** Shop open hours, "07:00-22:00". */
  hoursLabel: string;
  soldToday: number;
  billCount: number;
  goal: number;
  yesterday: number;
};

export const emptyGreetingHeader = (): GreetingHeaderData => ({
  storeName: "",
  ownerName: "",
  greeting: "",
  dateLabel: "",
  hoursLabel: "",
  soldToday: 0,
  billCount: 0,
  goal: 0,
  yesterday: 0,
});

/** Percentage of the day's goal reached, clamped to 0-100 for the bar. */
export const goalPercent = (data: GreetingHeaderData) => {
  if (!data.goal) return 0;
  return Math.min(100, Math.round((data.soldToday / data.goal) * 100));
};

export const getGreetingHeader = async (): Promise<GreetingHeaderData> => {
  const user = AuthService.getLoggedInUser() || {};
  // Same split the side menu uses: the franchise `name` is the shop, the
  // owner sits under `ownerDetails`. Fall back to the shop name so the
  // greeting is never left dangling.
  const storeName = user.name || "";
  const ownerName = user.ownerDetails?.name || storeName;

  return {
    storeName,
    ownerName,
    greeting: "Good morning",
    dateLabel: "Monday, 17 August 2026",
    hoursLabel: "07:00-22:00",
    soldToday: 12480,
    billCount: 34,
    goal: 20000,
    yesterday: 18240,
  };
};
