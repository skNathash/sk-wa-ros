import React from "react";
import { AlertCircle } from "lucide-react";
import type { SwiperOptions } from "swiper/types";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppSwiper from "~/components/core/swiper";
import { useTranslation } from "react-i18next";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface ShelfLifeOverviewProps {
  data: Array<{
    quantity: number;
    expiresOn: string;
    _id: string[];
    daysLeft: number;
  }>;
  callback: (a: { action: string }) => void;
  showManageExpiry?: boolean;
  selectedStockUom?: string;
  /** Bin quantity for this deal — shown when nothing in it is expiring. */
  totalQty?: number;
}

// Auto-width slides so each expiry pill keeps its natural size and the strip
// scrolls freely — the batch count varies per product.
const swiperConfig: SwiperOptions = {
  spaceBetween: 8,
  freeMode: true,
  slidesPerView: "auto",
};

const ShelfLifeOverview: React.FC<ShelfLifeOverviewProps> = ({
  data,
  callback,
  showManageExpiry = false,
  selectedStockUom,
  totalQty,
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <div>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-2">
        <div className="tw:flex tw:items-center tw:gap-2 tw:font-medium tw:text-sm tw:text-gray-800">
          <AlertCircle className="tw:w-4 tw:h-4 tw:text-blue-500" />
          {t("shelfLifeOverview")}
        </div>
        {showManageExpiry && (
          <AppButton
            color="danger"
            size="small"
            onClick={() => callback({ action: "manage-expiry" })}
          >
            {t("manageExpiry")}
          </AppButton>
        )}
      </div>

      {data && data.length > 0 ? (
        <AppSwiper config={swiperConfig}>
          {data.map((item, idx) => (
            <AppSwiper.Slide key={idx} isAutoWidth>
              <div className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-xl tw:px-3 tw:py-2 tw:flex tw:items-center tw:gap-3">
                <span className="tw:text-base tw:font-semibold tw:text-red-600 tw:whitespace-nowrap">
                  <DisplayQty
                    qty={item.quantity}
                    isLooseQty={false}
                    uom={selectedStockUom}
                  />
                </span>
                <span className="tw:text-[11px] tw:text-red-600 tw:whitespace-nowrap">
                  {t("expires")}:{" "}
                  {item.expiresOn ? (
                    <>
                      <DateFormat
                        value={item.expiresOn}
                        formatStr="dd MMM yyyy"
                      />{" "}
                      (
                      <span className="tw:font-semibold">
                        {item.daysLeft < 0
                          ? `${Math.abs(item.daysLeft)} ${t("daysAgo")}`
                          : item.daysLeft === 0
                          ? t("today")
                          : `in ${item.daysLeft} ${t("days")}`}
                      </span>
                      )
                    </>
                  ) : (
                    <span className="tw:font-semibold">--</span>
                  )}
                </span>
              </div>
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      ) : (
        /* Nothing expiring — the neutral band still carries the bin quantity so
           the section never reads as "no data at all". */
        <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-xl tw:px-3 tw:py-2 tw:flex tw:items-center tw:gap-3">
          {totalQty !== undefined && (
            <span className="tw:text-base tw:font-semibold tw:text-gray-700 tw:whitespace-nowrap">
              <DisplayQty
                qty={totalQty}
                isLooseQty={false}
                uom={selectedStockUom}
              />
            </span>
          )}
          <span className="tw:text-xs tw:text-gray-500">
            {t("noShelfLifeDataAvailable")}
          </span>
        </div>
      )}
    </div>
  );
};

export default ShelfLifeOverview;
