import { format, isSameMonth, isToday, isYesterday } from "date-fns";
import {
  PRINT_BARCODE_HISTORY_LIMIT,
  PRINT_BARCODE_HISTORY_STORAGE_KEY,
} from "~/constants";
import { formatSizeLabel } from "./PrintBarcodeService";
import StorageService from "./StorageService";

/** Fired on `window` whenever the log changes, so mounted panes can re-read it. */
export const BARCODE_HISTORY_EVENT = "barcode-print-history:change";

/** A print sheet that was sent to the printer, or a custom code that was minted. */
export type BarcodeHistoryKind = "print" | "mint";

/** One logged product — a sheet of N copies, or a single minted code. */
export interface BarcodeHistoryEntry {
  kind: BarcodeHistoryKind;
  /** Seller deal id — enough to reopen the product in the generator. */
  id: string;
  /** Human-facing deal reference id. */
  refId: string;
  name: string;
  barcode: string;
  /** Copies printed (always 1 for a mint). */
  quantity: number;
  /** Label size the sheet used, e.g. "a4_40l" — empty for a mint. */
  size: string;
  /** ISO timestamp of the print/mint. */
  at: string;
}

/** An entry with its display fields already derived, ready to render. */
export interface BarcodeHistoryRow extends BarcodeHistoryEntry {
  /** "Today · 11:14 AM", "Yesterday · 4:02 PM", "21 Jul". */
  whenLabel: string;
  /** "×12". */
  quantityLabel: string;
}

/** Month-to-date totals behind the pane's stat tiles. */
export interface BarcodeHistorySummary {
  /** "Aug 2026" — the month the tiles below cover. */
  monthLabel: string;
  /** Labels printed this month (sum of copies). */
  labels: number;
  /** Distinct products those labels covered. */
  skus: number;
  /** Custom codes minted this month. */
  mints: number;
  /** Multi-up (A4) sheets printed this month. */
  sheets: number;
  /** Size label of the most recent A4 sheet, e.g. "A4 40l". Empty when none. */
  lastSheetLabel: string;
  /** "Last: 26 stickers on 22 Jul". Empty when no sheet was printed. */
  lastSheetHint: string;
}

/** Reads the raw log, tolerating a missing or corrupted entry. */
const readLog = (): BarcodeHistoryEntry[] => {
  // Storage is client-only; the pane reads through an effect, but guard anyway
  // so a stray server-side call is a no-op instead of a crash.
  if (typeof window === "undefined") return [];
  const raw = StorageService.get(PRINT_BARCODE_HISTORY_STORAGE_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry: any) => entry && entry.at && entry.name);
};

const writeLog = (entries: BarcodeHistoryEntry[]) => {
  if (typeof window === "undefined") return;
  StorageService.set(
    PRINT_BARCODE_HISTORY_STORAGE_KEY,
    entries.slice(0, PRINT_BARCODE_HISTORY_LIMIT),
  );
  window.dispatchEvent(new CustomEvent(BARCODE_HISTORY_EVENT));
};

/** "Today · 11:14 AM" for the last two days, a plain "21 Jul" before that. */
const toWhenLabel = (at: string) => {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return "";
  if (isToday(date)) return `Today · ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday · ${format(date, "h:mm a")}`;
  return format(date, "d MMM");
};

/** A4 sizes are the multi-up sheets; everything else is a single-label roll. */
const isSheet = (size: string) => size.startsWith("a4");

/**
 * Local log of what the Barcode Generator has printed and minted.
 *
 * The print endpoints render a sheet but keep no history of their own, so the
 * generator records each sheet here as it is sent and the side pane reads the
 * month's totals + recent prints back out. It is per-browser by design — a
 * working record of "what did I just print", not an audited store report. Swap
 * {@link getRecent}/{@link getSummary} for an API when one exists; the pane
 * only consumes these two.
 */
export default class BarcodePrintHistoryService {
  /** Logs one printed sheet — one entry per product on it. */
  static recordPrint(
    items: {
      id: string;
      refId?: string;
      name: string;
      barcode: string;
      quantity: number;
    }[],
    size: string,
  ) {
    if (!items?.length) return;
    const at = new Date().toISOString();
    const entries: BarcodeHistoryEntry[] = items.map((item) => ({
      kind: "print",
      id: item.id || "",
      refId: item.refId || "",
      name: item.name || "",
      barcode: item.barcode || "",
      quantity: Math.max(Number(item.quantity) || 1, 1),
      size: size || "",
      at,
    }));
    writeLog([...entries, ...readLog()]);
  }

  /** Logs one custom code minted for a loose / private-label product. */
  static recordMint(item: {
    id: string;
    refId?: string;
    name: string;
    barcode?: string;
  }) {
    if (!item?.name) return;
    const entry: BarcodeHistoryEntry = {
      kind: "mint",
      id: item.id || "",
      refId: item.refId || "",
      name: item.name,
      barcode: item.barcode || "",
      quantity: 1,
      size: "",
      at: new Date().toISOString(),
    };
    writeLog([entry, ...readLog()]);
  }

  /**
   * The most recent prints, newest first, with their display fields derived.
   * Mints are left out — they show as a count in the tiles above the list.
   */
  static getRecent(limit = 8): BarcodeHistoryRow[] {
    return readLog()
      .filter((entry) => entry.kind === "print")
      .slice(0, limit)
      .map((entry) => ({
        ...entry,
        whenLabel: toWhenLabel(entry.at),
        quantityLabel: `×${entry.quantity}`,
      }));
  }

  /** Month-to-date totals for the pane's stat tiles. */
  static getSummary(): BarcodeHistorySummary {
    const now = new Date();
    const monthLabel = format(now, "MMM yyyy");
    const thisMonth = readLog().filter((entry) => {
      const date = new Date(entry.at);
      return !Number.isNaN(date.getTime()) && isSameMonth(date, now);
    });

    const prints = thisMonth.filter((entry) => entry.kind === "print");
    const labels = prints.reduce((sum, entry) => sum + entry.quantity, 0);
    const skus = new Set(prints.map((entry) => entry.barcode || entry.id)).size;
    const mints = thisMonth.filter((entry) => entry.kind === "mint").length;

    // One sheet can carry several products, so a sheet is a distinct print
    // timestamp — not a row count.
    const sheetEntries = prints.filter((entry) => isSheet(entry.size));
    const sheetStamps = [...new Set(sheetEntries.map((entry) => entry.at))];
    const lastStamp = sheetStamps[0] || "";
    const lastSheet = sheetEntries.filter((entry) => entry.at === lastStamp);
    const lastSheetCount = lastSheet.reduce(
      (sum, entry) => sum + entry.quantity,
      0,
    );

    return {
      monthLabel,
      labels,
      skus,
      mints,
      sheets: sheetStamps.length,
      lastSheetLabel: lastSheet[0]?.size
        ? formatSizeLabel(lastSheet[0].size)
        : "",
      lastSheetHint: lastStamp
        ? `Last: ${lastSheetCount} ${
            lastSheetCount === 1 ? "sticker" : "stickers"
          } on ${format(new Date(lastStamp), "d MMM")}`
        : "",
    };
  }
}
