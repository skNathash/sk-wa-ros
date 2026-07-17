import { addWeeks, nextDay, format, type Day } from "date-fns";

const DAY_INDEX: Record<string, Day> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Split-request API `routeInfo` body */
export type SplitRequestRouteInfo = {
  routeId: string;
  routeRefId: string;
  routeCode: string;
  description: string;
  plannedDeliveryDay: string;
  deliveryDate: string;
  routeStatus: string;
};

export type ChooseDeliveryConfirmPayload = {
  deliveryDate: string;
  routeInfo?: SplitRequestRouteInfo;
};

export const formatDateStr = (d: Date) => format(d, "yyyy-MM-dd");

export function buildRouteInfo(
  routeData: any,
  selectedDate: Date,
): SplitRequestRouteInfo {
  const deliveryDate = formatDateStr(selectedDate);
  const weekdayEnglish = format(selectedDate, "EEEE");
  const deliveryDays: string[] = Array.isArray(routeData?.deliveryDays)
    ? routeData.deliveryDays
    : [];
  const plannedDeliveryDay =
    deliveryDays.find(
      (d) =>
        typeof d === "string" &&
        d.toLowerCase() === weekdayEnglish.toLowerCase(),
    ) ?? weekdayEnglish;

  return {
    routeId: String(routeData?._id ?? ""),
    routeRefId: String(routeData?.routeRefId ?? routeData?.routeId ?? ""),
    routeCode: String(routeData?.routeCode ?? ""),
    description: String(routeData?.description ?? ""),
    plannedDeliveryDay,
    deliveryDate,
    routeStatus: String(
      routeData?.routeStatus ?? routeData?.status ?? "Planned",
    ),
  };
}

/** Upcoming delivery dates for configured weekday names (next N weeks per day). */
export function getUpcomingDates(
  deliveryDays: string[],
  weeksAhead = 4,
): Date[] {
  const today = new Date();
  const dates: Date[] = [];

  for (const day of deliveryDays) {
    const idx = DAY_INDEX[day.toLowerCase()];
    if (idx === undefined) continue;

    const first = nextDay(today, idx);
    for (let w = 0; w < weeksAhead; w++) {
      dates.push(w === 0 ? first : addWeeks(first, w));
    }
  }

  dates.sort((a, b) => a.getTime() - b.getTime());
  return dates;
}
