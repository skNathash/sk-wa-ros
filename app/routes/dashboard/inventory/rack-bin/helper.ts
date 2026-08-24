/**
 * Fill-percentage thresholds that drive every bin status on the godown page.
 * A bin's status is the first band its `percentageFilled` falls into, so each
 * value below is the *inclusive upper bound* of that band:
 *
 *   empty  = 0%
 *   low    = 1–50%
 *   medium = 51–80%
 *   high   = 81–95%
 *   full   = above 95%
 *
 * Change a number here and the rack grid tiles, the summary chips, the legend
 * and the side-pane filled-bin list all follow.
 */
export const BIN_FILL_EMPTY_MAX = 0;
export const BIN_FILL_LOW_MAX = 50;
export const BIN_FILL_MEDIUM_MAX = 80;
export const BIN_FILL_HIGH_MAX = 95;

export type BinFillStatus = "empty" | "low" | "medium" | "high" | "full";

/**
 * The bands in evaluation order, each carrying the css class and the legend
 * copy that goes with it. Everything bin-status related is derived from this
 * one list so a threshold only ever has to be edited above.
 */
const BIN_FILL_BANDS: {
  status: BinFillStatus;
  /** Inclusive upper bound; `null` for the open-ended top band. */
  max: number | null;
  label: string;
}[] = [
  {
    status: "empty",
    max: BIN_FILL_EMPTY_MAX,
    label: `Empty (${BIN_FILL_EMPTY_MAX}%)`,
  },
  {
    status: "low",
    max: BIN_FILL_LOW_MAX,
    label: `Low (${BIN_FILL_EMPTY_MAX + 1}-${BIN_FILL_LOW_MAX}%)`,
  },
  {
    status: "medium",
    max: BIN_FILL_MEDIUM_MAX,
    label: `Medium (${BIN_FILL_LOW_MAX + 1}-${BIN_FILL_MEDIUM_MAX}%)`,
  },
  {
    status: "high",
    max: BIN_FILL_HIGH_MAX,
    label: `High (${BIN_FILL_MEDIUM_MAX + 1}-${BIN_FILL_HIGH_MAX}%)`,
  },
  {
    status: "full",
    max: null,
    label: `Full (${BIN_FILL_HIGH_MAX}%+)`,
  },
];

/** Every fill status in display order — handy for seeding counters. */
export const BIN_FILL_STATUSES: BinFillStatus[] = BIN_FILL_BANDS.map(
  (b) => b.status,
);

/**
 * Maps a fill percentage to its status band. Non-numeric and negative values
 * fall back to `empty` so a missing `percentageFilled` never breaks the grid.
 */
export const getBinFillStatus = (percentage: unknown): BinFillStatus => {
  const filled = Number(percentage) || 0;
  const band = BIN_FILL_BANDS.find((b) => b.max !== null && filled <= b.max);
  return band?.status ?? "full";
};

/**
 * Maps a fill percentage to the `bin-*` class from app.css. Each class carries
 * both the tint and `--bin-accent`, so consumers stay colour-agnostic.
 */
export const getBinFillClass = (percentage: unknown) =>
  `bin-${getBinFillStatus(percentage)}`;

/**
 * Maps a fill percentage to the accent-only `bin-accent-*` class. Same hue as
 * `getBinFillClass` but without the tinted surface — for elements that keep
 * their own background yet need `--bin-accent` for their children.
 */
export const getBinAccentClass = (percentage: unknown) =>
  `bin-accent-${getBinFillStatus(percentage)}`;

/** Zeroed `{ empty: 0, low: 0, … }` map for tallying bins by status. */
export const emptyBinStatusCounts = (): Record<BinFillStatus, number> =>
  BIN_FILL_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<BinFillStatus, number>,
  );

/** A row of the side-pane filled-bin list, with its fill styling resolved. */
export type FilledBinListItem = {
  rackName: string;
  binId: string | number;
  binName: string;
  binCode?: string;
  label?: string;
  itemCount: number;
  percentageFilled: number;
  /** Name shown on the row — bin code when present, else the bin name. */
  displayName: string;
  /** First letter of the rack name, for the row's initials block. */
  initials: string;
  /** `bin-*` tint class for the rack-initials block. */
  statusClass: string;
  /** `bin-accent-*` class, carries `--bin-accent` for the pill and fill bar. */
  accentClass: string;
  /** Fill percentage clamped to 0–100 for the bar width. */
  barWidth: number;
};

/** Rack initials shown on a filled-bin row. */
const getRackInitials = (rackName: string) =>
  (rackName || "?").charAt(0).toUpperCase();

/**
 * Builds a filled-bin row from raw bin data — every derivation (rack initials,
 * status tint, accent, clamped bar width) happens here so the list component
 * only renders.
 */
export const toFilledBinListItem = (bin: {
  rackName: string;
  binId: string | number;
  binName: string;
  binCode?: string;
  label?: string;
  itemCount: number;
  percentageFilled: number;
}): FilledBinListItem => {
  const percentageFilled = Number(bin.percentageFilled) || 0;

  return {
    ...bin,
    percentageFilled,
    displayName: bin.binCode || bin.binName,
    initials: getRackInitials(bin.rackName),
    statusClass: getBinFillClass(percentageFilled),
    accentClass: getBinAccentClass(percentageFilled),
    barWidth: Math.min(100, Math.max(0, percentageFilled)),
  };
};

/**
 * Builds the side-pane list of filled bins from the raw rack config and the
 * bin summary payload. Shared by the godown grid and the bin view, so both
 * panes list the same bins in the same order.
 */
export const buildFilledBinList = (
  racks: any[],
  binSummary: any[],
): FilledBinListItem[] => {
  const binMap = new Map<string, any>();
  (binSummary || []).forEach((b: any) => {
    if (b && b.binId != null) binMap.set(String(b.binId), b);
  });

  const list: FilledBinListItem[] = [];
  const seen = new Set<string>();

  (racks || []).forEach((rack: any) => {
    (rack.bins || []).forEach((bin: any) => {
      const summary = binMap.get(String(bin.binId));
      if (!summary) return;

      const percentageFilled = summary.percentageFilled ?? 0;
      if (percentageFilled <= 0) return;
      if (seen.has(String(bin.binId))) return;
      seen.add(String(bin.binId));

      const items = summary.items || [];
      const label = items
        .map((item: any) => item.dealName)
        .filter(Boolean)
        .join(", ");

      list.push(
        toFilledBinListItem({
          rackName: rack.rackName,
          binId: bin.binId,
          binName: summary.name || bin.name || "",
          binCode: bin.binCode,
          label: label || undefined,
          itemCount: items.length,
          percentageFilled,
        }),
      );
    });
  });

  return list;
};

/** Legend / filter-chip descriptors, one per band. */
export const BIN_STATUSES = BIN_FILL_BANDS.map((band) => ({
  label: band.label,
  langKey: `binCapacitiesKeys.${band.status}`,
  colorClass: `bin-${band.status}`,
  value: band.status.charAt(0).toUpperCase() + band.status.slice(1),
}));
