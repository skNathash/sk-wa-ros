import clsx from "clsx";
import { Check, Plus, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import {
  getInitialsColor,
  type YouBoughtItem as YouBoughtItemType,
} from "./helper";

type Props = {
  vendorName?: string;
  items: YouBoughtItemType[];
  loading?: boolean;
  addingDealId?: string | null;
  onAdd: (item: YouBoughtItemType) => void;
  onViewCart?: () => void;
  /** Wrapper classes — the strip sits on a white band on mobile and inside the
   *  browse card on desktop. */
  className?: string;
};

/** Auto-width slides so a pill is only as wide as its product name. */
const SWIPER_CONFIG: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 8,
  freeMode: true,
};

/**
 * Recent buys from this vendor — the fastest way to rebuild a PO. One strip of
 * swipeable pills, identical on mobile and desktop.
 */
const YouBought = ({
  vendorName,
  items,
  loading = false,
  addingDealId,
  onAdd,
  onViewCart,
  className,
}: Props) => {
  const { t } = useTranslation(["common"]);

  if (!loading && items.length === 0) return null;

  return (
    <div className={clsx("tw:px-4 tw:py-3", className)}>
      <div className="tw:mb-2 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-bold tw:tracking-wide tw:text-gray-500 tw:uppercase">
        <Sparkles size={12} className="tw:text-primary" />
        {t("lastTimeFrom", "Last time from")} {vendorName || t("vendor")}
      </div>

      {loading ? (
        <div className="tw:flex tw:gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="tw:h-11 tw:w-40 tw:shrink-0 tw:animate-pulse tw:rounded-full tw:bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <AppSwiper config={SWIPER_CONFIG}>
          {items.map((item) => (
            <AppSwiper.Slide key={item.id} isAutoWidth>
              <div
                className={`tw:flex tw:h-11 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:py-1 tw:pr-2 tw:pl-1 ${
                  item.inCart
                    ? "tw:border-primary/30 tw:bg-primary/5"
                    : "tw:border-gray-200 tw:bg-white"
                }`}
              >
                <span
                  className={`tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[11px] tw:font-bold ${getInitialsColor(
                    item.name,
                  )}`}
                >
                  {item.initials}
                </span>
                <span className="tw:max-w-32 tw:truncate tw:text-[13px] tw:font-medium tw:text-gray-800">
                  {item.name}
                </span>
                {item.inCart ? (
                  <button
                    type="button"
                    onClick={onViewCart}
                    aria-label={`${t("viewCart", "View Cart")} - ${item.name}`}
                    className="tw:flex tw:h-6 tw:w-6 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:text-primary-foreground tw:hover:opacity-90"
                  >
                    <Check size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={addingDealId === item.dealId}
                    onClick={() => onAdd(item)}
                    aria-label={`${t("add", "Add")} ${item.name}`}
                    className="tw:flex tw:h-6 tw:w-6 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:text-gray-500 tw:hover:bg-gray-100 tw:disabled:opacity-50"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      )}
    </div>
  );
};

export default YouBought;
