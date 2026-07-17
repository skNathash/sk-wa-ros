import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import VendorService from "~/services/VendorService";
import { useTranslation } from "react-i18next";

type ColorType =
  | "primary"
  | "secondary"
  | "warning"
  | "danger"
  | "info"
  | "success";

interface AnalyticsData {
  totalVendorSpend: {
    amount: number;
    growth: string;
    description: string;
  };
  avgOrderValue: {
    amount: number;
    growth: string;
    description: string;
  };
  onTimeDelivery: {
    percentage: number;
    status: string;
    totalDeliveries: number;
    onTimeCount: number;
  };
  activeVendors: {
    active: number;
    total: number;
    ratio: string;
    networkStrength: string;
  };
  summary: {
    totalOrders: number;
    closedOrders: number;
    totalVendors: number;
    activeVendors: number;
  };
}

const AnalyticsSummary = ({ className }: { className?: string }) => {
  const { t } = useTranslation(["common"]);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const getDeliveryColor = (status: string): ColorType => {
    if (status === t("excellent")) return "success";
    if (status === t("good")) return "primary";
    return "warning";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await VendorService.getVendorAnalytics();
        setData(response.data || {});
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const summaryItems = [
    {
      label: t("totalVendorSpend"),
      key: "totalVendorSpend",
      value: data?.totalVendorSpend?.amount,
      icon: "indian-rupee",
      color: "success" as const,
      description: `${data?.totalVendorSpend?.growth || ""} ${data?.totalVendorSpend?.description || ""
        }`,
      isValueAmount: true,
    },
    {
      label: t("avgOrderValue"),
      key: "avgOrderValue",
      value: data?.avgOrderValue?.amount,
      icon: "trending-up",
      color: "primary" as const,
      description: `${data?.avgOrderValue?.growth || ""} ${data?.avgOrderValue?.description || ""
        }`,
      isValueAmount: true,
    },
    {
      label: t("onTimeDelivery"),
      key: "onTimeDelivery",
      value: `${data?.onTimeDelivery?.percentage || 0}%`,
      icon: "circle-check-big",
      color: getDeliveryColor(data?.onTimeDelivery?.status || ""),
      description: data?.onTimeDelivery?.status || "",
    },
    {
      label: t("activeVendors"),
      key: "activeVendors",
      value: data?.activeVendors?.active || 0,
      icon: "star",
      color: "primary" as const,
      description: data?.activeVendors?.networkStrength || "",
    },
  ];

  return (
    <div
      className={`tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 ${className}`}
    >
      {summaryItems.map((item) => (
        <AppStatsCard
          key={item.key}
          label={item.label}
          icon={item.icon}
          color={item.color}
          template={2}
        >
          <div className="tw:text-2xl tw:font-bold">
            {loading ? (
              <AppSpinner />
            ) : (
              <>
                {item.isValueAmount ? (
                  <Amount value={item.value || 0} />
                ) : (
                  <span className="tw:text-gray-500">{item.value}</span>
                )}
              </>
            )}
          </div>
          <div className="tw:text-xs tw:text-gray-500">{item.description}</div>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default AnalyticsSummary;
