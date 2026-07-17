import React from "react";
import { Layers, Plus } from "lucide-react";

import type { ReviewItem } from "~/services/BarcodeScanBulkService";

interface ScanItemActionsProps {
  item: ReviewItem;
  onCreateProduct: (item: ReviewItem) => void;
  onSkSuggestions: (item: ReviewItem) => void;
  /** Stretch the row to fill its container (used in the mobile card footer). */
  align?: "start" | "end";
  className?: string;
}

/**
 * Action row for a scanned item. Surfaces the two steps of the user flow in a
 * deliberate order: first "Similar items" (review SK matches that may already
 * exist), then "Create New" / "Add Details" as the primary fallback.
 *
 * Shared across inventory scan flows so the UI stays consistent between bulk
 * scan, subscribe/cart create-pending, and any future review screens.
 */
const ScanItemActions: React.FC<ScanItemActionsProps> = ({
  item,
  onCreateProduct,
  onSkSuggestions,
  align = "end",
  className,
}) => {
  const suggestionCount = item.skSuggestions?.length ?? 0;
  const hasSuggestions = suggestionCount > 0;
  const canCreate =
    item.matchStatus === "FoundInAi" || item.matchStatus === "NotFound";

  // AI found the product and pre-filled its details, so the user only confirms;
  // a "Not found" row has no details, so they must add them from scratch.
  const isAiFound = item.matchStatus === "FoundInAi";

  if (!hasSuggestions && !canCreate) return null;

  return (
    <div
      className={[
        "tw:flex tw:items-center tw:gap-2 tw:flex-nowrap",
        align === "end" ? "tw:justify-end" : "tw:justify-start",
        className || "",
      ].join(" ")}
    >
      {hasSuggestions && (
        <button
          type="button"
          onClick={() => onSkSuggestions(item)}
          className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-blue-200 tw:bg-blue-50 tw:px-2.5 tw:py-1.5 tw:text-xs tw:font-medium tw:text-blue-700 tw:transition-colors tw:cursor-pointer tw:whitespace-nowrap hover:tw:border-blue-300 hover:tw:bg-blue-100 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-200"
        >
          <Layers className="tw:w-3.5 tw:h-3.5" />
          Similar items
          <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-4 tw:h-4 tw:px-1 tw:rounded-full tw:bg-blue-200/70 tw:text-[10px] tw:font-semibold tw:text-blue-800">
            {suggestionCount}
          </span>
        </button>
      )}

      {canCreate && (
        <button
          type="button"
          onClick={() => onCreateProduct(item)}
          className={[
            "tw:inline-flex tw:items-center tw:gap-1 tw:rounded-lg tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:transition-colors tw:cursor-pointer tw:whitespace-nowrap focus-visible:tw:outline-none focus-visible:tw:ring-2",
            isAiFound
              ? "tw:bg-emerald-600 tw:text-white tw:shadow-sm hover:tw:bg-emerald-700 focus-visible:tw:ring-emerald-200"
              : "tw:border tw:border-blue-600 tw:bg-white tw:text-blue-600 hover:tw:bg-blue-50 focus-visible:tw:ring-blue-200",
          ].join(" ")}
        >
          <Plus className="tw:w-3.5 tw:h-3.5" />
          {isAiFound ? "Create New" : "Add Details"}
        </button>
      )}
    </div>
  );
};

export default ScanItemActions;
