import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaylaterService from "~/services/PaylaterService";

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

const WalletSummary = () => {
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
      const b2bCustomers = payload?.b2bCustomers ?? {};

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

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
      {data.map((item) => (
        <AppCard
          key={item.key}
          title={`${item.label} (${item.count ?? 0})`}
          icon={item.icon}
          iconClassName={item.iconClassName}
        >
          <div className="tw:flex tw:justify-between tw:items-start">
            <div>
              <div className="tw:text-2xl tw:font-bold tw:mb-1">
                {loading ? (
                  <AppSpinner className="tw-w-6 tw-h-6" />
                ) : (
                  <Amount value={item.value} />
                )}
              </div>
              <div className="tw:text-gray-500 tw:text-sm tw:mt-1 tw:mb-3">
                Total Outstanding Balance
              </div>
            </div>
            <div>
              <div className="tw:text-2xl tw:font-bold tw:mb-1">
                {loading ? (
                  <AppSpinner className="tw-w-6 tw-h-6" />
                ) : (
                  <Amount value={item.creditLimit} />
                )}
              </div>
              <div className="tw:text-gray-500 tw:text-sm tw:mt-1">
                Total Credit Limit
              </div>
            </div>
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default WalletSummary;
