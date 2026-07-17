import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { ArrowRight, Info, TrendingUp } from "lucide-react";
import AppPopover from "~/components/core/popover/AppPopover";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { MainSummaryData, SummaryItem } from "./helper";
import Amount from "~/components/core/amount/Amount";

interface SummaryProps {
  mainSummary: MainSummaryData;
  productSummary: SummaryItem[];
  loading?: boolean;
}

const Summary: React.FC<SummaryProps> = ({
  mainSummary,
  productSummary,
  loading = false,
}) => {
  const { t } = useTranslation(["common"]);
  const [searchParams, setSearchParams] = useSearchParams();

  // Build velocity map from SellerCatalogService.getMovementTypes()
  const velocityMap = useMemo(() => {
    const map: Record<string, string> = {};

    // Get movement types from service and map key -> value
    const movementTypes = SellerCatalogService.getMovementTypes();
    movementTypes.forEach((type) => {
      map[type.key] = type.value;
    });

    // Add additional mappings that are in filter modal but not in getMovementTypes
    map["out-of-stock"] = "outOfStock";

    return map;
  }, []);

  // Map summary movement type keys to filter modal velocity values
  const getVelocityValue = (key: string): string => {
    return velocityMap[key] || key;
  };

  const handleRedirect = (item: SummaryItem) => {
    const newParams = new URLSearchParams(searchParams);
    // Map the movement type key to the velocity value used in filter modal
    const velocityValue = getVelocityValue(item.key);
    newParams.set("velocity", velocityValue);
    // Set tab to products to activate the products tab
    newParams.set("tab", "products");
    setSearchParams(newParams, { replace: true });
  };

  const handleTotalProductsClick = () => {
    const newParams = new URLSearchParams(searchParams);
    // Set tab to products to activate the products tab
    newParams.set("tab", "products");
    setSearchParams(newParams, { replace: true });
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "success":
        return {
          bg: "tw:bg-green-50",
          border: "tw:border-green-200",
          text: "tw:text-green-700",
          valueText: "tw:text-green-900",
          hover: "tw:hover:bg-green-100",
          hoverBorder: "tw:hover:border-green-300",
        };
      case "primary":
        return {
          bg: "tw:bg-blue-50",
          border: "tw:border-blue-200",
          text: "tw:text-blue-700",
          valueText: "tw:text-blue-900",
          hover: "tw:hover:bg-blue-100",
          hoverBorder: "tw:hover:border-blue-300",
        };
      case "warning":
        return {
          bg: "tw:bg-yellow-50",
          border: "tw:border-yellow-200",
          text: "tw:text-yellow-700",
          valueText: "tw:text-yellow-900",
          hover: "tw:hover:bg-yellow-100",
          hoverBorder: "tw:hover:border-yellow-300",
        };
      case "danger":
        return {
          bg: "tw:bg-red-50",
          border: "tw:border-red-200",
          text: "tw:text-red-700",
          valueText: "tw:text-red-900",
          hover: "tw:hover:bg-red-100",
          hoverBorder: "tw:hover:border-red-300",
        };
      case "error":
      case "destructive":
        return {
          bg: "tw:bg-red-50",
          border: "tw:border-red-200",
          text: "tw:text-red-700",
          valueText: "tw:text-red-900",
          hover: "tw:hover:bg-red-100",
          hoverBorder: "tw:hover:border-red-300",
        };
      default:
        return {
          bg: "tw:bg-gray-50",
          border: "tw:border-gray-200",
          text: "tw:text-gray-700",
          valueText: "tw:text-gray-900",
          hover: "tw:hover:bg-gray-100",
          hoverBorder: "tw:hover:border-gray-300",
        };
    }
  };

  const mainStats = [
    {
      key: "totalProducts",
      label: t("totalProducts"),
      icon: "boxes",
      value: mainSummary.totalProducts,
      color: "primary",
      isAmount: false,
    },
    {
      key: "lowStock",
      label: t("lowStockAlert"),
      icon: "alert-triangle",
      value: mainSummary.lowStock,
      color: "warning",
      isAmount: false,
    },
    {
      key: "inventoryValue",
      label: t("inventoryValue"),
      icon: "indian-rupee",
      value: mainSummary.inventoryValue,
      color: "success",
      isAmount: true,
    },
    {
      key: "outOfStock",
      label: t("outOfStock"),
      icon: "ban",
      value: mainSummary.outOfStock,
      color: "danger",
      isAmount: false,
    },
  ];

  return (
    <div className="tw:flex tw:flex-col tw:gap-4 tw:mb-4">
      {/* Main Stats Grid */}
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4">
        {mainStats.map((item) => (
          <AppStatsCard
            key={item.key}
            label={item.label}
            icon={item.icon}
            color={item.color as any}
            template={2}
            onClick={
              item.key === "totalProducts"
                ? handleTotalProductsClick
                : undefined
            }
          >
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
              <div className="tw:text-xl tw:font-bold">
                {loading ? (
                  t("loading")
                ) : item.isAmount ? (
                  <Amount value={item.value as number} />
                ) : (
                  item.value
                )}
              </div>
              {item.key === "totalProducts" && (
                <div
                  className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium tw:text-blue-600 hover:tw:text-blue-800 tw:transition-colors tw:cursor-pointer tw:flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTotalProductsClick();
                  }}
                >
                  <span>{t("view") || "View"}</span>
                  <ArrowRight size={12} />
                </div>
              )}
            </div>
          </AppStatsCard>
        ))}
      </div>

      {/* Product Summary (Velocity/Expiry) */}
      {productSummary && productSummary.length > 0 && (
        <AppCard
          title={t("stockMovementType")}
          icon={<TrendingUp />}
          className="tw:overflow-hidden"
        >
          <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:lg:grid-cols-6 tw:gap-3">
            {productSummary.map((item, index) => {
              const colorClasses = getColorClasses(item.color);
              return (
                <div
                  key={index}
                  className={`tw:relative tw:p-3 tw:rounded-lg tw:border tw:flex tw:flex-col tw:justify-between tw:cursor-pointer tw:transition-all tw:duration-200 tw:shadow-sm ${colorClasses.bg} ${colorClasses.border} ${colorClasses.hover} ${colorClasses.hoverBorder} tw:hover:shadow-md`}
                  onClick={() => handleRedirect(item)}
                >
                  {/* Label with info icon */}
                  <div className="tw:flex tw:items-start tw:justify-between tw:gap-1 tw:mb-2">
                    <span
                      className={`tw:text-xs tw:font-semibold tw:leading-tight tw:uppercase tw:tracking-wide ${colorClasses.text}`}
                    >
                      {t(item.label)}
                    </span>
                    {item.description && (
                      <AppPopover
                        triggerContent={
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="tw:flex-shrink-0 tw:mt-0.5"
                          >
                            <Info
                              size={14}
                              className={`${colorClasses.text} tw:opacity-60 tw:hover:opacity-100 tw:transition-opacity`}
                            />
                          </div>
                        }
                      >
                        <div className="tw:p-2 tw:text-xs tw:max-w-xs">
                          {item.description}
                        </div>
                      </AppPopover>
                    )}
                  </div>
                  {/* Value and View Link */}
                  <div className="tw:flex tw:items-end tw:justify-between tw:gap-2">
                    <div
                      className={`tw:text-2xl tw:font-bold tw:leading-none ${colorClasses.valueText}`}
                    >
                      {item.value}
                    </div>
                    <div
                      className={`tw:flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium ${colorClasses.text} hover:tw:opacity-80 tw:transition-opacity tw:cursor-pointer tw:flex-shrink-0`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRedirect(item);
                      }}
                    >
                      <span>{t("view") || "View"}</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AppCard>
      )}
    </div>
  );
};

export default Summary;
