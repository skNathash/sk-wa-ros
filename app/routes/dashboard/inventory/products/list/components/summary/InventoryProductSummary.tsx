import { Info, TrendingUp } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import AppPopover from "~/components/core/popover/AppPopover";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import useAppNav from "~/hooks/useAppNav";
import { DEFAULT_PRODUCT_SUMMARY, type SummaryItem } from "../../helper";
import SellerCatalogService from "~/services/SellerCatalogService";

interface InventoryProductSummaryProps {
  summaryData?: SummaryItem[];
}

const swiperConfig: SwiperOptions = {
  spaceBetween: 10,
  slidesPerView: "auto",
  autoplay: {
    delay: 4000,
  },
};

const InventoryProductSummary: React.FC<InventoryProductSummaryProps> = ({
  summaryData = DEFAULT_PRODUCT_SUMMARY,
}) => {
  const { t } = useTranslation(["common"]);
  const { to } = useAppNav();
  const handleRedirect = (item: any) => {
    const velocities = SellerCatalogService.getMovementTypes();
    let velocity = velocities.find((v) => v.key === item.key)?.value || "";

    if (item.key === "out-of-stock") {
      velocity = "outOfStock";
    }

    if (velocity) {
      to("/dashboard/inventory/products/list", {
        tab: "products",
        velocity: velocity,
      });
    }
  };

  if (1) {
    return (
      <AppSwiper config={swiperConfig} className="tw:mb-4">
        {summaryData.map((item, index) => (
          <AppSwiper.Slide key={index} isAutoWidth={true}>
            <div
              className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:cursor-pointer tw:hover:bg-gray-50 tw:transition-colors tw:duration-200  tw:rounded-lg"
              onClick={() => handleRedirect(item)}
            >
              <AppBadge variant={item.color as any} className="tw:w-full">
                <div className="tw:flex tw:gap-2 tw:items-center">
                  <span
                    className={
                      item.key === "expired"
                        ? "tw:text-white"
                        : "tw:text-gray-800"
                    }
                  >
                    {t(item.label)}
                  </span>
                  {item.key !== "normal" ? (
                    <AppPopover
                      triggerContent={
                        <button
                          className="tw:cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info size={12} />
                        </button>
                      }
                    >
                      <div className="tw:text-xs">{item.description}</div>
                    </AppPopover>
                  ) : null}
                  <div
                    className={
                      item.key === "expired"
                        ? "tw:text-base tw:font-bold tw:text-white"
                        : "tw:text-base tw:font-bold tw:text-gray-800"
                    }
                  >
                    {item.value}
                  </div>
                </div>
              </AppBadge>
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    );
  }

  return (
    <AppCard
      title={t("stockMovementType")}
      icon={<TrendingUp />}
      className="tw:pb-1 tw:pt-3"
    >
      <AppSwiper config={swiperConfig}>
        {summaryData.map((item, index) => (
          <AppSwiper.Slide key={index} className="tw:px-2">
            <div
              className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:cursor-pointer tw:hover:bg-gray-50 tw:transition-colors tw:duration-200  tw:rounded-lg"
              onClick={() => handleRedirect(item)}
            >
              <AppBadge variant={item.color as any} className="tw:w-full">
                <div className="tw:flex tw:gap-2 tw:items-center">
                  <span
                    className={
                      item.key === "expiry"
                        ? "tw:text-white"
                        : "tw:text-gray-800"
                    }
                  >
                    {t(item.label)}
                  </span>
                  {item.key !== "normal" ? (
                    <AppPopover
                      triggerContent={
                        <button
                          className="tw:cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info size={12} />
                        </button>
                      }
                    >
                      <div className="twp-4 tw:text-xs">{item.description}</div>
                    </AppPopover>
                  ) : null}
                </div>
              </AppBadge>
              <div
                className={
                  item.key === "expiry"
                    ? "tw:text-lg tw:font-semibold tw:text-white"
                    : "tw:text-lg tw:font-semibold tw:text-gray-700"
                }
              >
                {item.value}
              </div>
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </AppCard>
  );
};

export default InventoryProductSummary;
