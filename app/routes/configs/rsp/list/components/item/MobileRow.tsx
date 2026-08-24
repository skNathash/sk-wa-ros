import clsx from "clsx";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import { Checkbox } from "~/components/ui/checkbox";
import CommonService from "~/services/CommonService";
import {
  getMarginPct,
  getOnlineVerdict,
  getSellingPrice,
  marginTone,
} from "../../insights";

/**
 * Compact mobile price row: name, MRP · cost line with a category chip, the
 * selling price with a margin badge, and the above/below-online verdict chip.
 * A coloured left edge flags rows priced above (red) or below (teal) the
 * cheapest marketplace listing.
 *
 * Colour is kept for signal only — the price stays dark unless the row is
 * losing to online, so a screen of healthy rows reads as calm.
 *
 * Tapping anywhere on the row opens the price edit modal.
 */
const MobileRow: React.FC<{
  item: any;
  type: "network" | "customer";
  callback: (a: { action: string; data?: any }) => void;
  /** "Show online prices" toggle — hides the verdict chip and edge accent. */
  showOnlinePrices?: boolean;
  /** Bulk-select state; the checkbox only renders when `onSelectChange` is given. */
  selected?: boolean;
  onSelectChange?: (item: any, checked: boolean) => void;
}> = ({
  item,
  type,
  callback,
  showOnlinePrices = true,
  selected = false,
  onSelectChange,
}) => {
  const price = getSellingPrice(item, type);
  const margin = getMarginPct(item, type);
  const tone = marginTone(margin);
  const verdict = showOnlinePrices ? getOnlineVerdict(item, type) : null;

  const categoryTag = (item.category?.name || "")
    .replace(/[^a-z]/gi, "")
    .slice(0, 4)
    .toUpperCase();

  const marginClass =
    tone === "success"
      ? "tw:bg-emerald-50 tw:text-emerald-700"
      : tone === "warning"
        ? "tw:bg-amber-50 tw:text-amber-700"
        : tone === "danger"
          ? "tw:bg-red-50 tw:text-red-700"
          : "tw:bg-gray-100 tw:text-gray-500";

  const losingToOnline = verdict?.type === "high";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => callback({ action: "edit", data: item })}
      onKeyDown={(e) => {
        if (e.key === "Enter") callback({ action: "edit", data: item });
      }}
      className={clsx(
        "tw:flex tw:cursor-pointer tw:items-center tw:gap-3 tw:border-b tw:border-l-4 tw:border-gray-100 tw:bg-white tw:py-3.5 tw:pr-2 tw:pl-3.5",
        losingToOnline
          ? "tw:border-l-red-400"
          : verdict?.type === "low"
            ? "tw:border-l-teal-400"
            : "tw:border-l-transparent",
      )}
    >
      {onSelectChange && (
        <span
          onClick={(e) => e.stopPropagation()}
          className="tw:inline-flex tw:shrink-0"
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) =>
              onSelectChange(item, checked === true)
            }
            aria-label={`Select ${item.name}`}
            className="tw:border-gray-400"
          />
        </span>
      )}

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:truncate tw:text-[15px] tw:leading-tight tw:font-semibold tw:text-gray-900">
          {item.name}
        </div>

        <div className="tw:mt-1.5 tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:text-[11px] tw:text-gray-500">
          <span className="tw:truncate tw:whitespace-nowrap">
            MRP{" "}
            <span className="tw:font-semibold tw:text-gray-700">
              <Amount value={item.mrp || 0} decimalPlaces={0} />
            </span>
            <span className="tw:px-1.5 tw:text-gray-300">|</span>
            Cost{" "}
            <span className="tw:font-semibold tw:text-gray-700">
              <Amount value={item.purchasePrice || 0} decimalPlaces={0} />
            </span>
          </span>
          {categoryTag && (
            <span className="tw:shrink-0 tw:rounded tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:tracking-wide tw:text-gray-500">
              {categoryTag}
            </span>
          )}
        </div>

        {verdict && verdict.type !== "exact" && (
          <div
            className={clsx(
              "tw:mt-1.5 tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-medium",
              losingToOnline ? "tw:text-red-600" : "tw:text-teal-700",
            )}
          >
            {losingToOnline ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            <span>
              <span className="tw:font-semibold">
                <Amount value={verdict.value} decimalPlaces={0} />
              </span>{" "}
              {losingToOnline ? "above" : "below"} {verdict.lowestName}
            </span>
          </div>
        )}
      </div>

      <div className="tw:flex tw:w-[86px] tw:shrink-0 tw:flex-col tw:items-end tw:gap-1">
        <span
          className={clsx(
            "tw:text-lg tw:leading-none tw:font-bold tw:tabular-nums",
            losingToOnline ? "tw:text-red-600" : "tw:text-gray-900",
          )}
        >
          <Amount value={price} decimalPlaces={0} />
        </span>
        {margin !== null && (
          <span
            className={clsx(
              "tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:tabular-nums",
              marginClass,
            )}
          >
            {CommonService.roundedByDecimalPlace(margin, 0)}% margin
          </span>
        )}
      </div>

      <ChevronRight size={16} className="tw:shrink-0 tw:text-gray-300" />
    </div>
  );
};

export default MobileRow;
