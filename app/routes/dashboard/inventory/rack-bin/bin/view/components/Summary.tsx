import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import {
  Boxes,
  AlertTriangle,
  IndianRupee,
  Clock,
  PieChart,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type StatsColor =
  | "primary"
  | "secondary"
  | "warning"
  | "danger"
  | "info"
  | "success";
interface SummaryItem {
  label: string;
  langKey: string;
  value: number;
  description: string;
  icon?: React.ReactNode;
  color: StatsColor;
  apiValueKey: string;
}

const Summary = ({
  binId,
  isSellable,
  refresh,
}: {
  binId: string;
  isSellable?: boolean | null;
  refresh?: number;
}) => {
  const { t } = useTranslation(["common"]);

  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      const response = await RackBinService.getBinMetrics(
        AuthService.getLoggedInUserId() || "",
        binId
      );
      setSummary({
        ...(response.data?.data?.metrics || {}),
        percentageFilled: response.data?.data?.percentageFilled || 0,
        usedLimit: response.data?.data?.usedLimit || 0,
        binLimit: response.data?.data?.binLimit || 0,
      });
      setLoading(false);
    };
    fetchSummary();
  }, [binId, refresh]);

  const summaryData: SummaryItem[] = [
    {
      label: "Total Stock Units",
      langKey: "totalStockUnits",
      value: summary?.totalStockUnits || 0,
      description: t("sellableInventory"),
      icon: <Boxes />,
      color: "primary",
      apiValueKey: "totalStockUnits",
    },
    {
      label: "Non-Sellable Units",
      langKey: "nonSellableUnits",
      value: summary?.nonSellableUnits || 0,
      description: t("damagedExpired"),
      icon: <AlertTriangle />,
      color: "warning",
      apiValueKey: "nonSellableUnits",
    },
    {
      label: "Total Value",
      langKey: "totalValue",
      value: summary?.totalValue || 0,
      description: t("inventoryWorth"),
      icon: <IndianRupee />,
      color: "success",
      apiValueKey: "totalValue",
    },
    {
      label: "Expiry Status",
      langKey: "itemsNeedingAttention",
      value: summary?.itemsNeedingAttention || 0,
      description: t("itemsNeedingAttention"),
      icon: <Clock />,
      color: "danger",
      apiValueKey: "itemsNeedingAttention",
    },
    // Capacity item built from bin metrics (from getBinMetrics)
    {
      label: "Bin Used",
      langKey: "percentageFilled",
      value: summary?.percentageFilled || 0,
      description: t("binViewUnitsUsed", {
        used: summary?.usedLimit ?? 0,
        limit: summary?.binLimit ?? 0,
      }),
      icon: <PieChart />,
      color: "info",
      apiValueKey: "percentageFilled",
    },
  ];

  const filteredSummary = summaryData.filter((item) => {
    if (isSellable === true && item.apiValueKey === "nonSellableUnits")
      return false;
    if (isSellable === false && item.apiValueKey === "totalStockUnits")
      return false;
    return true;
  });

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4">
      {filteredSummary.map((item) => (
        <AppStatsCard
          key={item.label}
          label={t(item.langKey)}
          icon={item.icon}
          color={item.color}
          template={2}
        >
          <div className="tw:flex tw:flex-col">
            <span className="tw:text-2xl tw:font-bold">
              {item.apiValueKey === "totalValue" ? (
                <Amount value={summary?.[item.apiValueKey] || 0} />
              ) : item.apiValueKey === "percentageFilled" ? (
                `${Math.round(item.value)}%`
              ) : (
                item.value
              )}
            </span>
            <span className="tw:text-sm tw:text-gray-500">
              {item.description}
            </span>
          </div>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
