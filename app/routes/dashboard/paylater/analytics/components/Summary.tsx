import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaylaterService from "~/services/PaylaterService";
import AuthService from "~/services/AuthService";
import useScreenView from "~/hooks/useScreenView";

const initialData = [
  {
    key: "b2c",
    label: "B2C Wallets",
    icon: "indian-rupee",
    value: 0,
    count: 0,
    creditLimit: 0,
    iconClassName: "tw:text-green-500",
  },
  {
    key: "b2b",
    label: "B2B Wallets",
    icon: "building-2",
    value: 0,
    count: 0,
    creditLimit: 0,
    iconClassName: "tw:text-blue-500",
  },
];

const Summary = () => {
  const { t } = useTranslation("paylater");
  const { isMobile } = useScreenView();

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const resp: any = await PaylaterService.getDashboardMetrics();

      const payload = resp?.data?.data ?? {};

      const b2c = payload?.b2cWallets ?? {};
      const b2b = payload?.b2bWallets ?? {};
      const b2cCustomers = payload?.b2cCustomers ?? {};
      const b2bCustomers = payload?.b2bRetailers ?? {};

      setData((prev) =>
        prev.map((item) => {
          if (item.key === "b2c") {
            return {
              ...item,
              value: b2c.totalOutstandingBalance || 0,
              creditLimit: b2c.totalCreditLimit || 0,
              count: b2cCustomers.count || 0,
            };
          }

          if (item.key === "b2b") {
            return {
              ...item,
              value: b2b.totalOutstandingBalance || 0,
              creditLimit: b2b.totalCreditLimit || 0,
              count: b2bCustomers.count || 0,
            };
          }

          return item;
        })
      );
    } catch (e) {
      // swallow – keep defaults
      // console.error("Failed to fetch paylater wallet summary", e);
    } finally {
      setLoading(false);
    }
  };

  const isBuyer = AuthService.isBuyerUser();
  const visibleData = data.filter((d) => !(isBuyer && d.key === "b2b"));

  return (
    <div className="tw:grid tw:grid-cols-2  tw:gap-4">
      {visibleData.map((item) => (
        <AppCard
          key={item.key}
          title={`${t(item.key === "b2c" ? "summary.b2cWallets" : "summary.b2bWallets")} (${item.count ?? 0})`}
          icon={isMobile ? undefined : item.icon}
          iconClassName={item.iconClassName}
        >
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start">
            <div>
              <div className="tw:text-base tw:md:text-2xl tw:font-bold tw:mb-1">
                {loading ? (
                  <AppSpinner className="tw-w-6 tw-h-6" />
                ) : (
                  <Amount value={item.value} />
                )}
              </div>
              <div className="tw:text-gray-500 tw:text-xs tw:md:text-sm tw:mt-1 tw:mb-3">
                {t("summary.totalOutstandingBalance")}
              </div>
            </div>
            <div>
              <div className="tw:text-base tw:md:text-2xl tw:font-bold tw:mb-1">
                {loading ? (
                  <AppSpinner className="tw-w-6 tw:h-6" />
                ) : (
                  <Amount value={item.creditLimit} />
                )}
              </div>
              <div className="tw:text-gray-500 tw:text-xs tw:md:text-sm tw:mt-1">
                {t("summary.totalCreditLimit")}
              </div>
            </div>
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default Summary;
