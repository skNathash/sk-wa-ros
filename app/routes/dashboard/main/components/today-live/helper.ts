/**
 * Static data source for the four live tiles below the journey card.
 * `getTodayLive()` is re-run on the refresh interval, so it must stay cheap.
 */

export type LiveTileTone = "success" | "primary" | "warning" | "info";

export type LiveTile = {
  key: string;
  label: string;
  emoji: string;
  /** Rendered as currency when true, otherwise as a plain count. */
  isAmount: boolean;
  value: number;
  /** "34 bills · goal ₹20,000" support line. */
  hint: string;
  tone: LiveTileTone;
  /** 0-100; only the sold-today tile carries a bar today. */
  progress?: number;
};

export type TodayLiveData = {
  /** How often the tiles refresh, in seconds — shown in the section caption. */
  refreshSeconds: number;
  tiles: LiveTile[];
};

export const emptyTodayLive = (): TodayLiveData => ({
  refreshSeconds: 0,
  tiles: [],
});

export const getTodayLive = async (): Promise<TodayLiveData> =>
  Promise.resolve({
    refreshSeconds: 5,
    tiles: [
      {
        key: "soldToday",
        label: "Sold today",
        emoji: "🧾",
        isAmount: true,
        value: 12480,
        hint: "34 bills · goal ₹20,000",
        tone: "success",
        progress: 62,
      },
      {
        key: "supplyCart",
        label: "Supply cart",
        emoji: "🛒",
        isAmount: true,
        value: 2150,
        hint: "12 items · MK Wholesale",
        tone: "primary",
      },
      {
        key: "onRoute",
        label: "On route",
        emoji: "🛵",
        isAmount: false,
        value: 4,
        hint: "2 waiting · 7 done",
        tone: "warning",
      },
      {
        key: "paylaterDue",
        label: "PayLater due",
        emoji: "🤝",
        isAmount: true,
        value: 32400,
        hint: "3 sellers · next 16 Aug",
        tone: "info",
      },
    ],
  });
