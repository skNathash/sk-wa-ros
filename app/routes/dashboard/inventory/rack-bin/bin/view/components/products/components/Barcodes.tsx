import React from "react";
import { Copy, Barcode } from "lucide-react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";
import { useTranslation } from "react-i18next";

interface BarcodesProps {
  barcodes: Array<{ barcode: string }>;
}

// Auto-width slides — barcode chips are as wide as their digits.
const swiperConfig: SwiperOptions = {
  spaceBetween: 8,
  freeMode: true,
  slidesPerView: "auto",
};

const Barcodes: React.FC<BarcodesProps> = ({ barcodes }) => {
  const { t } = useTranslation(["common"]);
  const { show } = useAppToast();
  const handleCopy = (barcode: string) => {
    CommonService.copyToClipboard(barcode);
    show({ msg: "Copied to clipboard!", color: "success" });
  };

  return (
    <div>
      {/* Header */}
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
        <Barcode className="tw:w-4 tw:h-4 tw:text-gray-500" />
        <div className="tw:text-sm tw:font-medium tw:text-gray-800">
          {t("barcodes")}{" "}
          <span className="tw:text-gray-500">({barcodes.length})</span>
        </div>
      </div>
      {/* Barcodes List or Empty State */}
      {!barcodes || barcodes.length === 0 ? (
        <div className="tw:text-gray-400 tw:text-xs tw:py-1">
          {t("noBarcodesFound")}
        </div>
      ) : (
        <AppSwiper config={swiperConfig}>
          {barcodes.map((item) => (
            <AppSwiper.Slide key={item.barcode} isAutoWidth>
              <div className="tw:bg-gray-100 tw:rounded-lg tw:px-3 tw:py-1.5 tw:flex tw:items-center tw:gap-2 tw:text-xs tw:font-mono tw:whitespace-nowrap">
                <span>{item.barcode}</span>
                <Copy
                  className="tw:w-3.5 tw:h-3.5 tw:cursor-pointer tw:text-gray-500 hover:tw:text-blue-500"
                  onClick={() => handleCopy(item.barcode)}
                />
              </div>
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      )}
    </div>
  );
};

export default Barcodes;
