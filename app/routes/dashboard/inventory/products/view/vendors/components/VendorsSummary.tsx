import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";

interface SummaryData {
  totalOrders: number;
  totalQuantity: number;
  totalValue: number;
  avgPrice: number;
  avgMrp: number;
  completedOrders: number;
  pendingOrders: number;
  completionRate: number;
  lastOrderDate: string;
  firstOrderDate: string;
}

interface VendorsSummaryProps {
  summary: SummaryData;
}

const VendorsSummary = ({ summary }: VendorsSummaryProps) => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="tw:bg-gray-50 tw:py-4 tw:px-4">
      <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:text-sm">
        {/* Orders */}
        <div>
          <div className="tw:text-gray-500 tw:mb-1">{t("orders")}</div>
          <div className="tw:font-semibold tw:text-base">
            {summary.totalOrders}
          </div>
        </div>

        {/* Total Qty */}
        <div>
          <div className="tw:text-gray-500 tw:mb-1">{t("totalQty")}</div>
          <div className="tw:font-semibold tw:text-base">
            {summary.totalQuantity}
          </div>
        </div>

        {/* Total Value */}
        <div>
          <div className="tw:text-gray-500 tw:mb-1">{t("totalValue")}</div>
          <div className="tw:font-semibold tw:text-base tw:text-green-600">
            <Amount value={summary.totalValue} decimalPlaces={0} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorsSummary;
