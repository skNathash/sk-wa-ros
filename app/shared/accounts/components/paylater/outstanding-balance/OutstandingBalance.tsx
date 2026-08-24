import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaylaterService from "~/services/PaylaterService";

interface OutstandingRow {
  key: "b2c" | "b2b";
  label: string;
  icon: string;
  iconClassName: string;
  value: number;
  count: number;
}

const initialData: OutstandingRow[] = [
  {
    key: "b2c",
    label: "B2C",
    icon: "indian-rupee",
    iconClassName: "tw:text-green-500",
    value: 0,
    count: 0,
  },
  {
    key: "b2b",
    label: "B2B",
    icon: "building-2",
    iconClassName: "tw:text-blue-500",
    value: 0,
    count: 0,
  },
];

interface OutstandingBalanceProps {
  /** Stack the two cards in a single column (pane) instead of a 2-col grid. */
  stacked?: boolean;
  className?: string;
}

/**
 * Outstanding balance summary for both PayLater customer types (B2C and B2B),
 * sourced from the shared dashboard metrics endpoint
 * ({@link PaylaterService.getDashboardMetrics}). Each card shows the type's
 * total outstanding balance and account count.
 *
 * Pass `stacked` to render the two cards in a single column (e.g. inside the
 * layout side pane); the default is a responsive 2-column grid.
 */
const OutstandingBalance = ({
  stacked = false,
  className = "",
}: OutstandingBalanceProps) => {
  const [data, setData] = useState<OutstandingRow[]>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const resp: any = await PaylaterService.getDashboardMetrics();
        const payload = resp?.data?.data ?? {};

        const b2c = payload?.b2cWallets ?? {};
        const b2b = payload?.b2bWallets ?? {};
        const b2cCustomers = payload?.b2cCustomers ?? {};
        const b2bCustomers = payload?.b2bCustomers ?? {};

        if (!mounted) return;
        setData((prev) =>
          prev.map((item) => {
            if (item.key === "b2c") {
              return {
                ...item,
                value: b2c.totalOutstandingBalance || 0,
                count: b2cCustomers.count || 0,
              };
            }
            if (item.key === "b2b") {
              return {
                ...item,
                value: b2b.totalOutstandingBalance || 0,
                count: b2bCustomers.count || 0,
              };
            }
            return item;
          }),
        );
      } catch (e) {
        // keep defaults
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSummary();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      className={`tw:grid tw:gap-4 ${
        stacked ? "tw:grid-cols-1" : "tw:grid-cols-1 tw:md:grid-cols-2"
      } ${className}`}
    >
      {data.map((item) => (
        <AppCard
          key={item.key}
          title={`${item.label} (${item.count ?? 0})`}
          icon={item.icon}
          iconClassName={item.iconClassName}
        >
          <div className="tw:text-2xl tw:font-bold tw:mb-1">
            {loading ? (
              <AppSpinner className="tw-w-6 tw-h-6" />
            ) : (
              <Amount value={item.value} />
            )}
          </div>
          <div className="tw:text-gray-500 tw:text-sm">
            Total Outstanding Balance
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default OutstandingBalance;
