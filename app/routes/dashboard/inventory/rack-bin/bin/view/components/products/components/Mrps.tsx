import { Tag } from "lucide-react";
import React from "react";
import type { SwiperOptions } from "swiper/types";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppSwiper from "~/components/core/swiper";

interface MrpsProps {
  mrps: Array<{ mrp: number }>;
}

// Auto-width slides — price chips are as wide as their amount.
const swiperConfig: SwiperOptions = {
  spaceBetween: 8,
  freeMode: true,
  slidesPerView: "auto",
};

const Mrps: React.FC<MrpsProps> = ({ mrps }) => {
  const { t } = useTranslation(["common"]);

  if (mrps.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
        <Tag className="tw:w-4 tw:h-4 tw:text-gray-500" />
        <div className="tw:text-sm tw:font-medium tw:text-gray-800">
          {t("mrps")} <span className="tw:text-gray-500">({mrps.length})</span>
        </div>
      </div>
      {/* MRP chips */}
      <AppSwiper config={swiperConfig}>
        {mrps.map((item) => (
          <AppSwiper.Slide key={item.mrp} isAutoWidth>
            <div className="tw:bg-gray-100 tw:rounded-lg tw:px-3 tw:py-1.5 tw:text-xs tw:font-mono tw:whitespace-nowrap">
              <Amount value={item.mrp} />
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  );
};

export default Mrps;
