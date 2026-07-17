import { ArrowUpDown } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";
import { Button } from "~/components/ui/button";
import { clsx } from "clsx";
import { useState } from "react";

const options = [
  {
    label: "Name (A-Z)",
    value: "asc",
    key: "productName",
  },
  {
    label: "Name (Z-A)",
    value: "desc",
    key: "productName",
  },
  {
    label: "Order Quantity (Low-High)",
    value: "asc",
    key: "totalUnits",
  },
  {
    label: "Order Quantity (High-Low)",
    value: "desc",
    key: "totalUnits",
  },
  {
    label: "Recently ordered",
    value: "desc",
    key: "lastOrder.createdAt",
  },
];

const SortPopover = ({
  sortValue,
  onSort,
}: {
  sortValue: { key: string; value: "asc" | "desc" };
  onSort: ({ key, value }: { key: string; value: "asc" | "desc" }) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
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
        onOpenChange={setOpen}
      >
        <div className="tw:w-56">
          <span className="tw:text-xs tw:font-bold tw:text-slate-500 tw:uppercase tw:tracking-wider">
            Sort By
          </span>

          <div className="tw:p-1.5 tw:flex tw:flex-col tw:gap-0.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSort({
                    key: opt.key,
                    value: opt.value as "asc" | "desc",
                  });
                  setOpen(false);
                }}
                className={clsx(
                  "tw:w-full tw:text-xs tw:text-left tw:mb-3 tw:cursor-pointer",
                  {
                    "tw:text-primary":
                      sortValue.key === opt.key &&
                      sortValue.value === opt.value,
                    "tw:text-gray-500":
                      sortValue.key !== opt.key ||
                      sortValue.value !== opt.value,
                  },
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </AppPopover>
    </>
  );
};

export default SortPopover;
