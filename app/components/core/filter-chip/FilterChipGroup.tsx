import clsx from "clsx";
import { Children, isValidElement, type ReactNode } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";

interface FilterChipGroupProps {
  /** FilterChip elements. */
  children: ReactNode;
  /** Optional static leading label for the row, e.g. "Filter". */
  label?: ReactNode;
  className?: string;
}

const swiperConfig: SwiperOptions = {
  spaceBetween: 8,
  freeMode: true,
  slidesPerView: "auto",
};

/**
 * A horizontally-scrollable row of {@link FilterChip}s powered by AppSwiper.
 * Chips keep their natural width and overflow gracefully on narrow screens.
 */
const FilterChipGroup = ({ children, label, className }: FilterChipGroupProps) => {
  return (
    <div className={clsx("tw:flex tw:items-center tw:gap-2", className)}>
      {label && (
        <span className="tw:shrink-0 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400">
          {label}
        </span>
      )}
      <AppSwiper config={swiperConfig} className="tw:min-w-0 tw:flex-1">
        {Children.toArray(children).map((child, index) => (
          <AppSwiper.Slide
            key={isValidElement(child) ? child.key ?? index : index}
            isAutoWidth
          >
            {child}
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  );
};

export default FilterChipGroup;
