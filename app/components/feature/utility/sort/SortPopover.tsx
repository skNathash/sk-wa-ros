import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import AppPopover from "~/components/core/popover/AppPopover";
import { Button } from "~/components/ui/button";
import type { SortValue as HeaderSortValue, TableHeaderItem } from "~/types/CommonTypes";

/**
 * Sort state shared across the app. Mirrors the Mongo-style sort direction the
 * query layer expects: `1` ascending, `-1` descending.
 */
export type SortValue = { key: string; value: 1 | -1 };

/** A single sortable field shown in the popover. */
export type SortOption = { key: string; label: string };

/**
 * Derive sort options straight from a DesktopView's column config so the sort
 * keys always match the column data-binding keys. Only columns flagged with
 * `enableSort` (and that have a `key`) become sortable.
 */
export const buildSortOptions = (
  headers: TableHeaderItem[],
): SortOption[] =>
  headers
    .filter((h) => h.enableSort && h.key)
    .map((h) => ({ key: h.key as string, label: h.label }));

/**
 * Bridge our `{ key, value: 1 | -1 }` sort state to the props the shared
 * `TableHeader` expects (`sortKey` + a `"asc" | "desc"` value).
 */
export const toHeaderSort = (sort?: SortValue) => ({
  sortKey: sort?.key ?? "",
  sortValue: (sort
    ? sort.value === 1
      ? "asc"
      : "desc"
    : undefined) as HeaderSortValue,
});

/** Bridge a `TableHeader` sort event back to our `{ key, value: 1 | -1 }` shape. */
export const fromHeaderSort = (data: {
  key: string;
  value: HeaderSortValue;
}): SortValue => ({
  key: data.key,
  value: data.value === "asc" ? 1 : -1,
});

type Props = {
  options: SortOption[];
  sortValue?: SortValue;
  onSort: (value: SortValue) => void;
};

const SortPopover = ({ options, sortValue, onSort }: Props) => {
  const [open, setOpen] = useState(false);

  const activeLabel = options.find((o) => o.key === sortValue?.key)?.label;

  const handleSelect = (key: string, value: 1 | -1) => {
    onSort({ key, value });
    setOpen(false);
  };

  return (
    <AppPopover
      open={open}
      onOpenChange={setOpen}
      align="end"
      triggerContent={
        <Button
          variant="outline"
          className="tw:flex tw:items-center tw:gap-1.5 tw:h-8 tw:px-2"
        >
          <ArrowUpDown size={16} />
          <span className="tw:text-xs tw:hidden tw:sm:inline">
            {activeLabel || "Sort"}
          </span>
        </Button>
      }
    >
      <div className="tw:w-64">
        <span className="tw:text-xs tw:font-bold tw:text-slate-500 tw:uppercase tw:tracking-wider">
          Sort By
        </span>
        <div className="tw:flex tw:flex-col tw:mt-2">
          {options.map((opt) => {
            const activeAsc =
              sortValue?.key === opt.key && sortValue?.value === 1;
            const activeDesc =
              sortValue?.key === opt.key && sortValue?.value === -1;
            return (
              <div
                key={opt.key}
                className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:py-1.5 tw:border-b tw:border-gray-100 last:tw:border-0"
              >
                <span
                  className={clsx("tw:text-xs", {
                    "tw:text-primary tw:font-medium": activeAsc || activeDesc,
                    "tw:text-gray-600": !activeAsc && !activeDesc,
                  })}
                >
                  {opt.label}
                </span>
                <div className="tw:flex tw:items-center tw:gap-1">
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.key, 1)}
                    className={clsx(
                      "tw:flex tw:items-center tw:gap-0.5 tw:rounded tw:border tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:cursor-pointer",
                      {
                        "tw:bg-primary tw:border-primary tw:text-white":
                          activeAsc,
                        "tw:border-gray-200 tw:text-gray-500 tw:hover:bg-gray-50":
                          !activeAsc,
                      },
                    )}
                    aria-label={`Sort ${opt.label} ascending`}
                  >
                    <ArrowUp size={12} />
                    Asc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.key, -1)}
                    className={clsx(
                      "tw:flex tw:items-center tw:gap-0.5 tw:rounded tw:border tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:cursor-pointer",
                      {
                        "tw:bg-primary tw:border-primary tw:text-white":
                          activeDesc,
                        "tw:border-gray-200 tw:text-gray-500 tw:hover:bg-gray-50":
                          !activeDesc,
                      },
                    )}
                    aria-label={`Sort ${opt.label} descending`}
                  >
                    <ArrowDown size={12} />
                    Desc
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppPopover>
  );
};

export default SortPopover;
