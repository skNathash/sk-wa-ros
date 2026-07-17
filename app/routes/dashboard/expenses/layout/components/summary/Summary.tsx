import { IndianRupee } from "lucide-react";
import React, { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import ExpenseService from "~/services/ExpenseService";

const Summary: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await ExpenseService.getTransactionStats({});

        if (res && res.statusCode === 200) {
          setStats(res.data || {});
        } else {
          setStats(null);
        }
      } catch (e) {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-3 tw:mb-4">
      <AppStatsCard
        label="Total Expenses"
        color="danger"
        template={2}
        icon={<IndianRupee />}
      >
        {loading ? (
          "Loading..."
        ) : (
          <Amount
            value={stats?.totalExpenses ?? 0}
            className="tw:text-lg tw:font-semibold"
          />
        )}
      </AppStatsCard>

      <AppStatsCard
        label="Amount Paid"
        color="success"
        template={2}
        icon={<IndianRupee />}
      >
        {loading ? (
          "Loading..."
        ) : (
          <Amount
            value={stats?.amountPaid ?? 0}
            className="tw:text-lg tw:font-semibold"
          />
        )}
      </AppStatsCard>
    </div>
  );
};

export default Summary;
