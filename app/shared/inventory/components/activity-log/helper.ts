import { format, isToday, isValid, isYesterday, parseISO } from "date-fns";
import type { InventoryActivityLog } from "~/types/CommonTypes";

export const formatActivityTime = (value: string | null | undefined) => {
  if (!value) return "";

  const date = parseISO(value);
  if (!isValid(date)) return "";

  // Kept short — the feed rows are narrow, so the timestamp only carries what
  // the day itself doesn't already imply.
  if (isToday(date)) {
    return format(date, "h:mm a");
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  return format(date, "dd MMM");
};

export const sortByLatest = (items: InventoryActivityLog[]) =>
  [...items].sort(
    (a, b) =>
      new Date(b?.loggedAt || 0).getTime() -
      new Date(a?.loggedAt || 0).getTime(),
  );
