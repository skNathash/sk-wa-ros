import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppPopover from "~/components/core/popover/AppPopover";
import SellerCatalogService from "~/services/SellerCatalogService";

interface StockMovementTypeProps {
  velocity: string;
  onChange: (value: string) => void;
}

const StockMovementType = ({ velocity, onChange }: StockMovementTypeProps) => {
  const { t } = useTranslation(["common"]);

  const velocityOptions = [
    { value: "All", label: "All Velocities", langKey: "allVelocities" },
    ...SellerCatalogService.getMovementTypes().map((type: any) => ({
      value: type.value,
      label: type.label,
      langKey: type.key,
    })),
    {
      value: "subscribedByCustomer",
      label: "Only customer subscribed",
      langKey: "subscribedByCustomer",
    },
  ];

  const getVelocityBadgeProps = (
    velocityValue: string,
    isSelected: boolean
  ) => {
    const colorMap: Record<string, string> = {
      "Fast Moving": "tw:border-green-500 tw:text-green-700",
      Normal: "tw:border-blue-500 tw:text-blue-700",
      "Slow Moving": "tw:border-orange-500 tw:text-orange-700",
      "Non-Moving": "tw:border-red-500 tw:text-red-700",
      All: "tw:border-gray-500 tw:text-gray-700",
      "Near Expiry": "tw:border-yellow-500 tw:text-yellow-700",
      "Low Stock": "tw:border-amber-500 tw:text-amber-700",
      Expired: "tw:border-red-700 tw:text-red-900",
      outOfStock: "tw:border-gray-500 tw:text-gray-700",
      subscribedByCustomer: "tw:border-purple-500 tw:text-purple-700",
    };

    const bgMap: Record<string, string> = {
      "Fast Moving": "tw:bg-green-100",
      Normal: "tw:bg-blue-100",
      "Slow Moving": "tw:bg-orange-100",
      "Non-Moving": "tw:bg-red-100",
      All: "tw:bg-gray-100",
      "Near Expiry": "tw:bg-yellow-100",
      "Low Stock": "tw:bg-amber-100",
      Expired: "tw:bg-red-200",
      outOfStock: "tw:bg-gray-100",
      subscribedByCustomer: "tw:bg-purple-100",
    };

    const darkBgMap: Record<string, string> = {
      "Fast Moving": "tw:bg-green-800",
      Normal: "tw:bg-blue-800",
      "Slow Moving": "tw:bg-orange-800",
      "Non-Moving": "tw:bg-red-800",
      All: "tw:bg-gray-800",
      "Near Expiry": "tw:bg-yellow-800",
      "Low Stock": "tw:bg-amber-800",
      Expired: "tw:bg-red-900",
      outOfStock: "tw:bg-gray-800",
      subscribedByCustomer: "tw:bg-purple-800",
    };

    // For selected chip use dark background and white text
    if (isSelected) {
      return {
        variant: "secondary" as const,
        className: `${darkBgMap[velocityValue] || "tw:bg-gray-800"} tw:text-white tw:border-transparent`,
      };
    }

    return {
      variant: "outline" as const,
      className:
        colorMap[velocityValue] || "tw:border-gray-500 tw:text-gray-700",
    };
  };

  const movementTypes = SellerCatalogService.getMovementTypes();

  return (
    <div className="tw:col-span-2">
      <div className="tw:flex tw:items-center tw:justify-between tw:text-xs tw:font-medium tw:mb-2">
        <div>{t("stockMovementType")}</div>
        <AppPopover
          triggerContent={
            <button
              type="button"
              className="tw:text-gray-500 hover:tw:text-gray-700 tw:flex tw:items-center tw:gap-1"
            >
              <span>Know More</span>
              <Info size={14} />
            </button>
          }
        >
          <div className="tw:space-y-2 tw:max-w-xs">
            {movementTypes.map((type) => (
              <div key={type.value} className="tw:text-xs">
                <strong>{type.label}:</strong> {type.description}
              </div>
            ))}
          </div>
        </AppPopover>
      </div>

      <div className="tw:flex tw:flex-wrap tw:gap-2">
        {velocityOptions.map((opt) => {
          const isSelected = velocity === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="tw:cursor-pointer"
            >
              <AppBadge {...getVelocityBadgeProps(opt.value, isSelected)}>
                {t(opt.langKey)}
              </AppBadge>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StockMovementType;
