import { ArrowUpDown, Check } from "lucide-react";
import React from "react";
import AppPopover from "~/components/core/popover/AppPopover";
import { Button } from "~/components/ui/button";
import { SORT_OPTIONS } from "../helper";

type Props = {
  globalSortValue: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
};

const SortBy: React.FC<Props> = ({
  globalSortValue,
  open,
  onOpenChange,
  onSelect,
}) => {
  return (
    <AppPopover
      triggerContent={
        <Button
          variant="outline"
          className="tw:flex tw:items-center tw:justify-center tw:h-8 tw:w-8"
        >
          <ArrowUpDown size={16} />
        </Button>
      }
      open={open}
      onOpenChange={onOpenChange}
      contentClassName="tw:w-auto tw:p-0 tw:overflow-hidden tw:rounded-lg tw:shadow-xl tw:border tw:border-slate-100"
    >
      <div className="tw:w-56">
        <div className="tw:px-4 tw:py-3 tw:bg-slate-50 tw:border-b tw:border-slate-100">
          <span className="tw:text-xs tw:font-bold tw:text-slate-500 tw:uppercase tw:tracking-wider">
            Sort By
          </span>
        </div>
        <div className="tw:p-1.5 tw:flex tw:flex-col tw:gap-0.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={`tw:group tw:flex tw:items-center tw:justify-between tw:w-full tw:text-left tw:px-3 tw:py-2.5 tw:rounded-md tw:transition-all tw:duration-200 ${
                globalSortValue === opt.value
                  ? "tw:bg-blue-50 tw:text-blue-700"
                  : "tw:text-slate-700 hover:tw:bg-slate-50 hover:tw:text-slate-900"
              }`}
            >
              <span
                className={`tw:text-sm ${
                  globalSortValue === opt.value
                    ? "tw:font-semibold"
                    : "tw:font-medium"
                }`}
              >
                {opt.label}
              </span>
              {globalSortValue === opt.value ? (
                <Check size={16} className="tw:text-blue-600 tw:stroke-[2.5]" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </AppPopover>
  );
};

export default SortBy;
