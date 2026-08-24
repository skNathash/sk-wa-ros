import clsx from "clsx";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import { type FilterFormFields } from "../helper";

/** What the tapped chip represents, handed back to the parent. */
export type StockChipType = "all" | "movement" | "status";

export interface StockChipSelection {
  type: StockChipType;
  /** The filter value ("Fast Moving", "Low Stock", …). "All" for the reset chip. */
  value: string;
}

type Tone = "green" | "orange" | "red" | "rose" | "gray" | "amber" | "yellow";

interface StockChip {
  key: string;
  langKey: string;
  type: StockChipType;
  value: string;
  tone?: Tone;
}

// A resting dot + a soft selected fill per semantic tone. Kept muted so a full
// row of chips reads as one calm control rather than a rainbow of borders.
const TONE: Record<Tone, { dot: string; selected: string }> = {
  green: {
    dot: "tw:bg-emerald-500",
    selected: "tw:bg-emerald-50 tw:text-emerald-700 tw:border-emerald-300",
  },
  orange: {
    dot: "tw:bg-orange-500",
    selected: "tw:bg-orange-50 tw:text-orange-700 tw:border-orange-300",
  },
  red: {
    dot: "tw:bg-red-500",
    selected: "tw:bg-red-50 tw:text-red-700 tw:border-red-300",
  },
  rose: {
    dot: "tw:bg-rose-600",
    selected: "tw:bg-rose-50 tw:text-rose-800 tw:border-rose-300",
  },
  gray: {
    dot: "tw:bg-slate-400",
    selected: "tw:bg-slate-100 tw:text-slate-700 tw:border-slate-300",
  },
  amber: {
    dot: "tw:bg-amber-500",
    selected: "tw:bg-amber-50 tw:text-amber-700 tw:border-amber-300",
  },
  yellow: {
    dot: "tw:bg-yellow-500",
    selected: "tw:bg-yellow-50 tw:text-yellow-700 tw:border-yellow-300",
  },
};

// Movement + stock-status shown together in one row. The `type` tells the
// parent which filter field a tap maps to (velocity vs stockStatus).
const CHIPS: StockChip[] = [
  { key: "all", langKey: "all", type: "all", value: "All" },
  {
    key: "in-stock",
    langKey: "in-stock",
    type: "status",
    value: "In Stock",
    tone: "green",
  },
  {
    key: "fast-moving",
    langKey: "fast-moving",
    type: "movement",
    value: "Fast Moving",
    tone: "green",
  },
  {
    key: "slow-moving",
    langKey: "slow-moving",
    type: "movement",
    value: "Slow Moving",
    tone: "orange",
  },
  {
    key: "non-moving",
    langKey: "non-moving",
    type: "movement",
    value: "Non-Moving",
    tone: "red",
  },
  {
    key: "expired",
    langKey: "expired",
    type: "status",
    value: "Expired",
    tone: "rose",
  },
  {
    key: "out-of-stock",
    langKey: "out-of-stock",
    type: "status",
    value: "Out of Stock",
    tone: "gray",
  },
  {
    key: "near-expiry",
    langKey: "near-expiry",
    type: "status",
    value: "Near Expiry",
    tone: "yellow",
  },
  {
    key: "low-stock",
    langKey: "low-stock",
    type: "status",
    value: "Low Stock",
    tone: "amber",
  },
  {
    key: "inactive",
    langKey: "inactive",
    type: "status",
    value: "Inactive",
    tone: "red",
  },
];

const swiperConfig: SwiperOptions = {
  spaceBetween: 8,
  slidesPerView: "auto",
  slidesOffsetAfter: 10,
};

interface StockChipsProps {
  /** Fired on chip tap with the chip's type + value; parent applies the filter. */
  onSelect: (selection: StockChipSelection) => void;
  className?: string;
  /** Count badge per chip key (from the inventory summary). Missing → no badge. */
  counts?: Record<string, number>;
  /** While true, a placeholder dash shows in place of counts. */
  loading?: boolean;
}

/**
 * Inline stock-movement + stock-status chips, surfaced on the products list
 * page in a single horizontal swiper. Resting chips are neutral with a small
 * semantic dot; the active chip fills with its soft tone. A tap reports back
 * which kind of chip it is (movement / status / all) so the parent knows which
 * filter field to set. Active state is read from the shared filter form.
 */
const StockChips = ({
  onSelect,
  className,
  counts,
  loading,
}: StockChipsProps) => {
  const { t } = useTranslation(["common"]);
  const { control } = useFormContext<FilterFormFields>();

  const [velocity, stockStatus, onlyWithStockData, status] = useWatch({
    control,
    name: ["velocity", "stockStatus", "onlyWithStockData", "status"],
  });

  const isInactive = status === "Inactive";

  const isSelected = (chip: StockChip) => {
    if (chip.type === "status" && chip.value === "In Stock") {
      return onlyWithStockData && !isInactive;
    }
    // Product status filter (Active/Inactive), not stockStatus.
    if (chip.type === "status" && chip.value === "Inactive") {
      return isInactive;
    }
    if (chip.type === "all") {
      return (
        (velocity || "All") === "All" &&
        (stockStatus || "All") === "All" &&
        !onlyWithStockData &&
        !isInactive
      );
    }
    if (chip.type === "movement")
      return velocity === chip.value && !onlyWithStockData && !isInactive;
    return stockStatus === chip.value && !onlyWithStockData && !isInactive;
  };

  return (
    <AppSwiper config={swiperConfig} className={className}>
      {CHIPS.map((chip) => {
        const selected = isSelected(chip);
        const tone = chip.tone ? TONE[chip.tone] : null;
        const count = counts?.[chip.key];
        const hasCount = typeof count === "number";

        // "All" carries a soft brand tint when active (matching the nav chips);
        // the rest use their semantic tone. The `app-stock-chip-all` seam lets
        // themes swap the translucent tint for an opaque one — over a tinted
        // page a translucent brand fill muddies (see theme-2.css).
        const selectedClass =
          chip.type === "all"
            ? "app-stock-chip-all tw:bg-primary/10 tw:text-primary tw:border-primary/40"
            : tone?.selected;

        return (
          <AppSwiper.Slide key={chip.key} isAutoWidth>
            <button
              type="button"
              onClick={() => onSelect({ type: chip.type, value: chip.value })}
              className={clsx(
                "tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:whitespace-nowrap tw:rounded-full tw:border tw:px-3 tw:py-1 tw:text-xs tw:font-medium tw:transition-colors",
                selected
                  ? selectedClass
                  : "tw:border-slate-200 tw:bg-white tw:text-slate-600 tw:hover:bg-slate-50",
              )}
            >
              {tone && (
                <span
                  className={clsx(
                    "tw:h-1.5 tw:w-1.5 tw:rounded-full",
                    tone.dot,
                  )}
                />
              )}
              {t(chip.langKey)}
              {hasCount || loading ? (
                <span
                  className={clsx(
                    "tw:rounded-full tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:leading-none",
                    selected
                      ? "tw:bg-black/10"
                      : "tw:bg-slate-100 tw:text-slate-500",
                  )}
                >
                  {loading ? "…" : count}
                </span>
              ) : null}
            </button>
          </AppSwiper.Slide>
        );
      })}
    </AppSwiper>
  );
};

export default StockChips;
