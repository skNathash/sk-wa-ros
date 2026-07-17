import { orderBy } from "lodash";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import SellerCatalogService from "~/services/SellerCatalogService";

interface StockStatusProps {
  stockStatus: string;
  onChange: (value: string) => void;
}

const StockStatus = ({ stockStatus, onChange }: StockStatusProps) => {
  const { t } = useTranslation(["common"]);

  const stockStatusOptions = orderBy(
    [
      { value: "All", label: "All Stock Status", langKey: "allStockStatus" },
      ...SellerCatalogService.getStockStatusTypes().map((type: any) => ({
        value: type.value,
        label: type.label,
        langKey: type.key,
      })),
    ],
    ["label"],
    ["asc"]
  );

  const getStockStatusBadgeProps = (
    stockStatusValue: string,
    isSelected: boolean
  ) => {
    const colorMap: Record<string, string> = {
      "Low Stock": "tw:border-amber-500 tw:text-amber-700",
      "Near Expiry": "tw:border-yellow-500 tw:text-yellow-700",
      Expired: "tw:border-red-700 tw:text-red-900",
      All: "tw:border-gray-500 tw:text-gray-700",
    };

    const bgMap: Record<string, string> = {
      "Low Stock": "tw:bg-amber-100",
      "Near Expiry": "tw:bg-yellow-100",
      Expired: "tw:bg-red-200",
      All: "tw:bg-gray-100",
    };

    const darkBgMap: Record<string, string> = {
      "Low Stock": "tw:bg-amber-800",
      "Near Expiry": "tw:bg-yellow-800",
      Expired: "tw:bg-red-900",
      All: "tw:bg-gray-800",
    };

    // For selected chip use dark background and white text
    if (isSelected) {
      return {
        variant: "secondary" as const,
        className: `${darkBgMap[stockStatusValue] || "tw:bg-gray-800"} tw:text-white tw:border-transparent`,
      };
    }

    return {
      variant: "outline" as const,
      className:
        colorMap[stockStatusValue] || "tw:border-gray-500 tw:text-gray-700",
    };
  };

  return (
    <div className="tw:col-span-2">
      <div className="tw:text-xs tw:font-medium tw:mb-2">
        {t("stockStatus")}
      </div>

      <div className="tw:flex tw:flex-wrap tw:gap-2">
        {stockStatusOptions.map((opt) => {
          const isSelected = stockStatus === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="tw:cursor-pointer"
            >
              <AppBadge {...getStockStatusBadgeProps(opt.value, isSelected)}>
                {t(opt.langKey)}
              </AppBadge>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StockStatus;
