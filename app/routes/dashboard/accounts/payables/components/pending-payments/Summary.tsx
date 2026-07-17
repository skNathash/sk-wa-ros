import { useState, useEffect } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AccountService from "~/services/AccountService";
import { useTranslation } from "react-i18next";

const Summary = () => {
  const { t } = useTranslation(["common"]);
  const [totalPending, setTotalPending] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      // Fetch total pending transactions
      const pendingResponse = await AccountService.getTransactions({
        groupbycond: "status",
        filter: { status: "pending" },
      });

      // Fetch total due transactions (pending status)
      const dueResponse = await AccountService.getTransactions({
        groupbycond: "status",
        filter: { status: "pending", dueDate: { $lte: new Date() } },
      });

      setTotalPending(pendingResponse.data?.data?.[0]?.totalAmount || 0);
      setTotalDue(dueResponse.data?.data?.[0]?.totalAmount || 0);
    } catch (error) {
      setTotalPending(0);
      setTotalDue(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-4">
      <div className="tw:rounded-lg tw:bg-[color:var(--wa-domain-out-bg)] tw:p-4">
        <div className="wa-section-label">{t("totalPending")}</div>
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:min-h-[40px]">
            <AppSpinner className="tw:w-6 tw:h-6" />
          </div>
        ) : (
          <Amount
            value={totalPending}
            className="wa-amount tw:text-2xl tw:font-bold tw:text-[color:var(--wa-domain-out)]"
            decimalPlaces={0}
          />
        )}
      </div>

      <div className="tw:rounded-lg tw:bg-[color:var(--wa-domain-pending-bg)] tw:p-4">
        <div className="wa-section-label">{t("overdue")}</div>
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:min-h-[40px]">
            <AppSpinner className="tw:w-6 tw:h-6" />
          </div>
        ) : (
          <Amount
            value={totalDue}
            className="wa-amount tw:text-2xl tw:font-bold tw:text-[color:var(--wa-domain-pending)]"
            decimalPlaces={0}
          />
        )}
      </div>
    </div>
  );
};

export default Summary;
