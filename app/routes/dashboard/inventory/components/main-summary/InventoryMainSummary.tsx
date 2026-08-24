import Amount from "app/components/core/amount/Amount";
import React, { useCallback, useEffect, useRef } from "react";
import type Swiper from "swiper";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import { DynamicIcon } from "lucide-react/dynamic";
import clsx from "clsx";
import AppSwiper from "~/components/core/swiper";
import useScreenView from "~/hooks/useScreenView";

const colorMap: Record<
  string,
  { topBorder: string; iconBg: string; iconText: string; value: string }
> = {
  primary: {
    topBorder: "tw:border-t-blue-500",
    iconBg: "tw:bg-blue-100",
    iconText: "tw:text-blue-600",
    value: "tw:text-blue-900",
  },
  success: {
    topBorder: "tw:border-t-green-500",
    iconBg: "tw:bg-green-100",
    iconText: "tw:text-green-600",
    value: "tw:text-green-900",
  },
  warning: {
    topBorder: "tw:border-t-amber-500",
    iconBg: "tw:bg-amber-100",
    iconText: "tw:text-amber-600",
    value: "tw:text-amber-900",
  },
  danger: {
    topBorder: "tw:border-t-red-500",
    iconBg: "tw:bg-red-100",
    iconText: "tw:text-red-600",
    value: "tw:text-red-900",
  },
};

interface InventoryMainSummaryProps {
  className?: string;
  summaryData?: {
    totalProducts: number;
    lowStock: number;
    inventoryValue: number;
    outOfStock: number;
    nearExpiry: number;
    expired: number;
  };
  loading?: boolean;
  onItemClick?: (key: string) => void;
}

const swiperConfig: SwiperOptions = {
  spaceBetween: 12,
  pagination: false,
  navigation: false,
  autoplay: {
    delay: 4000,
    disableOnInteraction: true,
    pauseOnMouseEnter: true,
  },
  breakpoints: {
    0: {
      slidesPerView: "auto",
    },
    768: {
      slidesPerView: 4,
    },
  },
};

const InventoryMainSummary: React.FC<InventoryMainSummaryProps> = ({
  className,
  summaryData = {
    totalProducts: 0,
    lowStock: 0,
    inventoryValue: 0,
    outOfStock: 0,
    nearExpiry: 0,
    expired: 0,
  },
  loading = false,
  onItemClick,
}) => {
  const { t } = useTranslation(["common"]);

  const { isMobile } = useScreenView();

  // Keep a ref to the underlying Swiper instance provided by AppSwiper via callback
  const swiperRef = useRef<Swiper | null>(null);

  const onSwiperCallback = useCallback(
    (data: { swiper: Swiper; action: "init" | "slideChange" }) => {
      if (!data || !data.swiper) return;
      if (data.action === "init") {
        swiperRef.current = data.swiper;
      }
      // no-op on init for now; we only need the instance to call update when data changes
    },
    []
  );

  const statsData = [
    {
      key: "totalProducts",
      label: t("totalProducts"),
      icon: "boxes",
      desc: t("allProductsInInventory"),
      value: summaryData.totalProducts,
      color: "primary",
      isAmount: false,
    },
    {
      key: "inventoryValue",
      label: t("inventoryValue"),
      icon: "indian-rupee",
      desc: t("totalStockValue"),
      value: summaryData.inventoryValue,
      color: "success",
      isAmount: true,
    },
    {
      key: "lowStock",
      label: t("lowStockAlert"),
      icon: "alert-triangle",
      desc: t("productsRunningLow"),
      value: summaryData.lowStock,
      color: "warning",
      isAmount: false,
    },
    {
      key: "outOfStock",
      label: t("outOfStock"),
      icon: "ban",
      desc: t("productsOutOfStock"),
      value: summaryData.outOfStock,
      color: "danger",
      isAmount: false,
    },
    {
      key: "nearExpiry",
      label: t("nearExpiry"),
      icon: "clock",
      desc: t("nearExpiry"),
      value: summaryData.nearExpiry,
      color: "warning",
      isAmount: false,
    },
    {
      key: "expired",
      label: t("expired"),
      icon: "x-circle",
      desc: t("expired"),
      value: summaryData.expired,
      color: "danger",
      isAmount: false,
    },
  ];

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (!swiperRef.current) return;
        swiperRef.current.update();
      } catch (e) {
        // ignore runtime errors from update
      }
    }, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const s = swiperRef.current as any;
      if (!s) return;
      try {
        if (typeof s.update === "function") s.update();
      } catch (e) {
        // ignore runtime errors from update
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [
    summaryData.totalProducts,
    summaryData.lowStock,
    summaryData.inventoryValue,
    summaryData.outOfStock,
    summaryData.nearExpiry,
    summaryData.expired,
  ]);

  return (
    <AppSwiper
      config={swiperConfig}
      className={`${className}`}
      callback={onSwiperCallback}
    >
      {statsData.map((item) => {
        const c = colorMap[item.color] || colorMap.primary;
        return (
          <AppSwiper.Slide key={item.key} isAutoWidth={isMobile}>
            <div
              onClick={() => onItemClick?.(item.key)}
              title={item.desc}
              className={clsx(
                "tw:flex tw:items-center tw:gap-3 tw:px-3.5 tw:py-2.5 tw:rounded-xl tw:bg-white tw:border tw:border-gray-200 tw:border-t-[3px] tw:cursor-pointer tw:transition-shadow hover:tw:shadow-sm",
                c.topBorder
              )}
            >
              <span
                className={clsx(
                  "tw:shrink-0 tw:rounded-lg tw:p-2 tw:flex tw:items-center tw:justify-center",
                  c.iconBg
                )}
              >
                <DynamicIcon
                  name={item.icon as any}
                  size={16}
                  className={c.iconText}
                />
              </span>
              <div className="tw:flex tw:flex-col tw:min-w-0 tw:gap-0.5 tw:leading-tight">
                <span className="app-label tw:text-[10px] tw:uppercase tw:tracking-wide tw:font-medium tw:text-gray-500 tw:truncate">
                  {item.label}
                </span>
                <span
                  className={clsx(
                    "app-amount tw:text-base tw:font-bold",
                    c.value
                  )}
                >
                  {loading ? (
                    "…"
                  ) : item.isAmount ? (
                    <Amount value={item.value as number} />
                  ) : (
                    item.value
                  )}
                </span>
              </div>
            </div>
          </AppSwiper.Slide>
        );
      })}
    </AppSwiper>
  );
};

export default InventoryMainSummary;
