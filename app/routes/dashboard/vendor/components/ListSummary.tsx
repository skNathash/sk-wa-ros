import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

interface Summary {
  totalVendors: number;
  totalPOValue: number;
  pendingDeliveries: number;
  unpaidInvoices: number;
}

const ListSummary = ({
  className,
  summary: summaryData,
}: {
  className?: string;
  summary: Summary;
}) => {
  const { t } = useTranslation(["common"]);

  const summary = [
    {
      label: t("totalVendors"),
      key: "totalVendors",
      value: summaryData.totalVendors,
      icon: "building-2",
      color: "primary",
      isAmount: false,
    },
    {
      label: t("totalPOValue"),
      key: "totalPOValue",
      value: summaryData.totalPOValue,
      icon: "indian-rupee",
      color: "success",
      isAmount: true,
    },
    {
      label: t("pendingDeliveries"),
      key: "pendingDeliveries",
      value: summaryData.pendingDeliveries,
      icon: "truck",
      color: "warning",
      isAmount: false,
    },
    {
      label: t("unpaidInvoices"),
      key: "unpaidInvoices",
      value: summaryData.unpaidInvoices,
      icon: "circle-alert",
      color: "danger",
      isAmount: false,
    },
  ];

  return (
    <div
      className={`tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-x-2 ${className}`}
    >
      {summary.map((item) => (
        <AppStatsCard
          key={item.key}
          label={item.label}
          icon={item.icon}
          color={item.color as any}
          template={1}
        >
          <div className="tw:text-base tw:md:text-2xl tw:font-bold">
            {item.isAmount ? (
              <Amount value={item.value} decimalPlaces={0} />
            ) : (
              item.value
            )}
          </div>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default ListSummary;
