import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppPopover from "~/components/core/popover/AppPopover";

const ChargeSlabPopup = ({ slabs }: { slabs: any[] }) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppPopover
      triggerContent={
        <button className="tw:text-blue-500 tw:text-xs tw:font-medium tw:cursor-pointer tw:inline-flex tw:items-center tw:gap-1">
          {t("deliveryCharge.viewCharges")} <ChevronDown size={14} />
        </button>
      }
    >
      <div className="tw:font-semibold tw:mb-2 tw:text-sm">
        {t("deliveryCharge.kilometerWiseChargeConfig")}
      </div>
      <div className="tw:w-full">
        <div className="tw:text-xs tw:font-medium tw:grid tw:grid-cols-3 tw:gap-2 tw:w-full tw:border-b tw:border-gray-200 tw:pb-2">
          <div>{t("deliveryCharge.fromKm")}</div>
          <div>{t("deliveryCharge.toKm")}</div>
          <div>{t("deliveryCharge.charge")}</div>
        </div>
        {slabs.map((slab, index) => (
          <div
            key={slab.from}
            className="tw:text-xs tw:font-medium tw:grid tw:grid-cols-3 tw:gap-2 tw:w-full tw:mt-2 tw:border-b tw:border-gray-200 tw:pb-2"
          >
            <div>{slab.from}</div>
            <div>{slab.to}</div>
            <div>
              <Amount value={slab.charge} decimalPlaces={2} />
            </div>
          </div>
        ))}
      </div>
    </AppPopover>
  );
};

export default ChargeSlabPopup;
