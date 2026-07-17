import AppCard from "~/components/core/card/AppCard";
import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import VendorService from "~/services/VendorService";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import Amount from "~/components/core/amount/Amount";
import Divider from "~/components/core/divider/Divider";
import AppBadge from "~/components/core/badge/AppBadge";
import AppProgress from "~/components/core/progress/AppProgress";
import { useTranslation } from "react-i18next";

const FinancialOverview = () => {
  const { t } = useTranslation(["common"]);
  const [data, setData] = useState<{
    pendingCredits: number;
    pendingCreditsDescription: string;
    pendingDebits: number;
    pendingDebitsDescription: string;
    paymentHealth: number;
    description: string;
    percentage: number;
    health: string;
  }>({
    pendingCredits: 0,
    pendingCreditsDescription: "",
    pendingDebits: 0,
    pendingDebitsDescription: "",
    paymentHealth: 0,
    description: "",
    percentage: 0,
    health: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await VendorService.getVendorFinancialSummary();
      const finalData = response.data?.financialOverview;
      setData({
        pendingCredits: finalData?.pendingCredits?.amount,
        pendingCreditsDescription: finalData?.pendingCredits?.description,
        pendingDebits: finalData?.pendingDebits?.amount,
        pendingDebitsDescription: finalData?.pendingDebits?.description,
        paymentHealth: finalData?.paymentHealth,
        description: finalData?.paymentHealth?.description,
        percentage: finalData?.paymentHealth?.percentage,
        health: finalData?.paymentHealth?.status,
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <AppCard
      title={t("financialOverview")}
      icon="indian-rupee"
      iconClassName="tw:text-blue-500"
    >
      {loading ? (
        <div className="tw:text-center">
          <AppSpinner />
        </div>
      ) : null}

      <div className="tw:grid tw:grid-cols-2 tw:gap-4">
        <div className="tw:bg-red-50 tw:p-4 tw:rounded-lg">
          <div className="tw:text-sm tw:font-medium tw:text-red-800 tw:mb-1">
            {t("pendingCredits")}
          </div>
          <div className="tw:mb-1">
            <Amount
              value={data.pendingCredits}
              className="tw:text-xl tw:font-bold tw:text-red-900"
            />
          </div>
          <div className="tw:text-xs tw:text-red-500">
            {data.pendingCreditsDescription}
          </div>
        </div>

        <div className="tw:bg-orange-50 tw:p-4 tw:rounded-lg">
          <div className="tw:text-sm tw:font-medium tw:text-orange-800 tw:mb-1">
            {t("pendingDebits")}
          </div>
          <div className="tw:mb-1">
            <Amount
              value={data.pendingDebits}
              className="tw:text-xl tw:font-bold tw:text-orange-900"
            />
          </div>
          <div className="tw:text-xs tw:text-orange-500">
            {data.pendingDebitsDescription}
          </div>
        </div>
      </div>

      <Divider />

      <div>
        <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
          <div className="tw:text-sm tw:font-medium tw:text-gray-800">
            {t("paymentHealth")}
          </div>
          <div>
            <AppBadge variant={data.health === "good" ? "success" : "danger"}>
              {data.health}
            </AppBadge>
          </div>
        </div>
        <AppProgress value={data.percentage} className="tw:mb-2" />
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          {data.description}
        </div>
      </div>
    </AppCard>
  );
};

export default FinancialOverview;
