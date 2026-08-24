import clsx from "clsx";
import {
  Barcode,
  Boxes,
  Grid3x3,
  Package,
  Printer,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import BarcodePrintHistoryService, {
  BARCODE_HISTORY_EVENT,
  type BarcodeHistoryRow,
  type BarcodeHistorySummary,
} from "~/services/BarcodePrintHistoryService";
import SectionTabService from "~/services/SectionTabService";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";

/** The two barcode surfaces the pane switches between. */
const SINGLE_PATH = "/dashboard/inventory/print-barcode";
const BULK_PATH = "/dashboard/inventory/print-barcode/bulk";

/** A page-owned tile shown with the month stats — e.g. the bulk page's selection. */
export interface BarcodePaneQueued {
  count: number;
  title: string;
  hint?: string;
}

export interface BarcodeSidePaneProps {
  /** Catalog section-menu key the page sits under, for the pane heading. */
  activeTab?: string;
  /** Fallback heading when no section rail is mounted to name the page. */
  title?: string;
  /** Optional extra tile appended to the month stats. */
  queued?: BarcodePaneQueued;
  className?: string;
}

/** Row tones — a white icon chip on a tinted row, matching the stock alerts. */
const TONE = {
  green: {
    row: "tw:bg-emerald-50/70 tw:ring-emerald-100",
    icon: "tw:text-emerald-600",
    title: "tw:text-emerald-900",
  },
  violet: {
    row: "tw:bg-violet-50/70 tw:ring-violet-100",
    icon: "tw:text-violet-600",
    title: "tw:text-violet-900",
  },
  blue: {
    row: "tw:bg-sky-50/70 tw:ring-sky-100",
    icon: "tw:text-sky-600",
    title: "tw:text-sky-900",
  },
  amber: {
    row: "tw:bg-amber-50/70 tw:ring-amber-100",
    icon: "tw:text-amber-600",
    title: "tw:text-amber-900",
  },
};

type StatTile = {
  key: string;
  tone: keyof typeof TONE;
  icon: typeof Printer;
  title: string;
  hint: string;
};

/** Turns the month totals into the tiles the pane prints, dropping empty ones. */
const buildTiles = (
  summary: BarcodeHistorySummary,
  queued?: BarcodePaneQueued,
): StatTile[] => {
  const tiles: StatTile[] = [];

  tiles.push({
    key: "labels",
    tone: "green",
    icon: Printer,
    title: `${summary.labels} ${summary.labels === 1 ? "label" : "labels"} printed`,
    hint: summary.skus
      ? `This month · across ${summary.skus} ${
          summary.skus === 1 ? "SKU" : "SKUs"
        }`
      : "This month — nothing printed yet",
  });

  if (summary.mints > 0) {
    tiles.push({
      key: "mints",
      tone: "violet",
      icon: Sparkles,
      title: `${summary.mints} custom ${
        summary.mints === 1 ? "code" : "codes"
      } minted`,
      hint: "For loose + private label",
    });
  }

  if (summary.sheets > 0) {
    tiles.push({
      key: "sheets",
      tone: "blue",
      icon: Grid3x3,
      title: `${summary.sheets} ${summary.sheets === 1 ? "sheet" : "sheets"}${
        summary.lastSheetLabel ? ` · ${summary.lastSheetLabel}` : ""
      }`,
      hint: summary.lastSheetHint,
    });
  }

  if (queued && queued.count > 0) {
    tiles.push({
      key: "queued",
      tone: "amber",
      icon: Barcode,
      title: queued.title,
      hint: queued.hint || "",
    });
  }

  return tiles;
};

/**
 * Side pane for the Barcode Generator pages (single + bulk) in theme-2 desktop.
 *
 * The generator is a do-one-thing screen — pick a product, print labels — so
 * the pane carries what the main column can't: what this month's printing adds
 * up to, and the last sheets that went out, each one a tap back to that product
 * for a reprint. Everything it shows comes from the local print log
 * ({@link BarcodePrintHistoryService}), which the generator writes as it prints.
 */
const BarcodeSidePane = ({
  activeTab = "barcode-generator",
  title = "Barcode Generator",
  queued,
  className,
}: BarcodeSidePaneProps) => {
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Both the bulk picker and the generator opened in bulk mode (`?bulk=1`)
  // belong to the Bulk chip — the generator route is shared by both flows.
  const bulkActive =
    location.pathname.includes("/print-barcode/bulk") ||
    searchParams.get("bulk") === "1";

  const navChips: PaneChipItem[] = [
    {
      key: "single",
      label: "Single",
      icon: <Package size={13} />,
      active: !bulkActive,
    },
    {
      key: "bulk",
      label: "Bulk",
      icon: <Boxes size={13} />,
      active: bulkActive,
      // Surfaces what is waiting on the sheet without leaving the chip row.
      count: queued?.count,
    },
  ];

  const handleChipSelect = ({ data }: PaneChipsAction) => {
    if (data.active) return;
    appNav.to(data.key === "bulk" ? BULK_PATH : SINGLE_PATH);
  };

  // The rail and the pane should agree on where you are, so the heading falls
  // back to the section-menu label instead of a per-page name.
  const paneTitle =
    SectionTabService.getTab("catalog", activeTab)?.label || title;

  // The log lives in localStorage, so it can only be read once mounted —
  // rendering from empty state first keeps the server and client markup equal.
  const [summary, setSummary] = useState<BarcodeHistorySummary | null>(null);
  const [recent, setRecent] = useState<BarcodeHistoryRow[]>([]);

  const refresh = useCallback(() => {
    setSummary(BarcodePrintHistoryService.getSummary());
    setRecent(BarcodePrintHistoryService.getRecent());
  }, []);

  useEffect(() => {
    refresh();
    // A print made on the generator page re-renders this pane in place, and a
    // print made in another tab lands through `storage`.
    window.addEventListener(BARCODE_HISTORY_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(BARCODE_HISTORY_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  /** Reopens the product on the single-product page, ready to reprint. */
  const handleReprint = (row: BarcodeHistoryRow) => {
    if (!row.id) return;
    const params = new URLSearchParams({
      id: row.id,
      name: row.name,
      dealId: row.refId,
    });
    appNav.to(`/dashboard/inventory/print-barcode?${params.toString()}`);
  };

  const tiles = summary ? buildTiles(summary, queued) : [];

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + the month the tiles below cover. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <PaneTitle title={paneTitle} />
        {summary ? (
          <span className="tw:shrink-0 tw:text-sm tw:text-slate-400">
            {summary.monthLabel}
          </span>
        ) : null}
      </div>

      {/* Flow switch — the same Single / Bulk split the page tabs carry. */}
      <PaneChips
        data={navChips}
        callback={handleChipSelect}
        className="tw:px-1"
      />

      <p className="tw:px-1 tw:text-xs tw:leading-5 tw:text-slate-500">
        Print stickers for loose stock, unbranded goods and private-label items
        — or reprint labels on branded SKUs with your MRP + expiry.
      </p>

      {/* Month to date. */}
      <div>
        <p
          className="tw:px-1 tw:text-[11px] tw:font-semibold tw:tracking-widest tw:text-slate-400 tw:uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          This month
        </p>

        <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-2">
          {tiles.map((tile) => {
            const tone = TONE[tile.tone];
            const Icon = tile.icon;
            return (
              <div
                key={tile.key}
                className={clsx(
                  "tw:flex tw:items-center tw:gap-3 tw:rounded-sm tw:p-2 tw:ring-1",
                  tone.row,
                )}
              >
                <span
                  className={clsx(
                    "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-white",
                    tone.icon,
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="tw:min-w-0 tw:flex-1">
                  <span
                    className={clsx(
                      "tw:block tw:truncate tw:text-xs tw:font-medium",
                      tone.title,
                    )}
                  >
                    {tile.title}
                  </span>
                  {tile.hint ? (
                    <span className="tw:block tw:truncate tw:text-[10px] tw:text-slate-500">
                      {tile.hint}
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent prints — each row reopens that product for a reprint. */}
      <div>
        <p
          className="tw:px-1 tw:text-[11px] tw:font-semibold tw:tracking-widest tw:text-slate-400 tw:uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Recent prints
        </p>

        <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-px">
          {recent.length === 0 ? (
            <div className="tw:rounded-xl tw:bg-white tw:p-3 tw:text-center tw:text-xs tw:text-slate-500 tw:ring-1 tw:ring-slate-100">
              Nothing printed yet — your last sheets show up here.
            </div>
          ) : (
            recent.map((row, index) => (
              <button
                key={`${row.at}-${row.barcode}-${index}`}
                type="button"
                onClick={() => handleReprint(row)}
                title={`Reprint ${row.name}`}
                className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:bg-white tw:p-2.5 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
              >
                <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-slate-900 tw:text-white">
                  <Barcode size={18} />
                </span>
                <span className="tw:min-w-0 tw:flex-1">
                  <span className="tw:block tw:truncate tw:text-xs tw:font-semibold tw:text-slate-900">
                    {row.name}
                  </span>
                  <span className="tw:block tw:truncate tw:font-mono tw:text-[11px] tw:text-slate-500">
                    {row.barcode}
                  </span>
                </span>
                <span className="tw:shrink-0 tw:text-right">
                  <span className="tw:block tw:text-[10px] tw:text-slate-400">
                    {row.whenLabel}
                  </span>
                  <span className="tw:block tw:text-xs tw:font-semibold tw:text-slate-900">
                    {row.quantityLabel}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeSidePane;
