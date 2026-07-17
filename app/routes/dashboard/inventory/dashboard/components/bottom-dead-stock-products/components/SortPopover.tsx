import { ArrowUpDown } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import AppPopover from "~/components/core/popover/AppPopover";
import { Button } from "~/components/ui/button";

export type SortValue = { key: string; value: 1 | -1 };

const options: { label: string; key: string; value: 1 | -1 }[] = [
  { label: "Name (A-Z)", key: "dealName", value: 1 },
  { label: "Name (Z-A)", key: "dealName", value: -1 },
  { label: "Stock Qty (High-Low)", key: "stockQty", value: -1 },
  { label: "Stock Qty (Low-High)", key: "stockQty", value: 1 },
];

type Props = {
  sortValue: SortValue;
  onSort: (value: SortValue) => void;
};

const SortPopover = ({ sortValue, onSort }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <AppPopover
      open={open}
      onOpenChange={setOpen}
      align="end"
      triggerContent={
        <Button
          variant="outline"
          className="tw:flex tw:items-center tw:justify-center tw:h-8 tw:w-8"
        >
          <ArrowUpDown size={16} />
        </Button>
      }
    >
      <div className="tw:w-56">
        <span className="tw:text-xs tw:font-bold tw:text-slate-500 tw:uppercase tw:tracking-wider">
          Sort By
        </span>
        <div className="tw:p-1.5 tw:flex tw:flex-col tw:gap-0.5">
          {options.map((opt) => (
            <button
              key={`${opt.key}-${opt.value}`}
              onClick={() => {
                onSort({ key: opt.key, value: opt.value });
                setOpen(false);
              }}
              className={clsx(
                "tw:w-full tw:text-xs tw:text-left tw:mb-3 tw:cursor-pointer",
                {
                  "tw:text-primary":
                    sortValue.key === opt.key && sortValue.value === opt.value,
                  "tw:text-gray-500":
                    sortValue.key !== opt.key || sortValue.value !== opt.value,
                },
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </AppPopover>
  );
};

export default SortPopover;
