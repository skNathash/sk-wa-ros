import { useEffect, useMemo, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import {
  getCurrentMonthYear,
  getMonthRange,
} from "~/shared/others/month-year-filter/MonthYearFilter";

/**
 * "You owe" Seller paylater due card.
 * Fetches the `youOwe` insights block for the current month and reads the
 * `peerPaylater` slice.
 */
const PeerPaylater = () => {
  const [amount, setAmount] = useState<number>(0);
  const [dueCount, setDueCount] = useState<number>(0);

  const { startDate, endDate } = useMemo(() => {
    const { month, year } = getCurrentMonthYear();
    return getMonthRange(month, year);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchPaylater = async () => {
      try {
        const response = await PurchaseOrderService.getDashboardInsights({
          filter: { type: "youOwe", startDate, endDate },
        });
        if (!active) return;
        const peerPaylater = response.data?.data?.youOwe?.peerPaylater;
        setAmount(peerPaylater?.amount ?? 0);
        setDueCount(peerPaylater?.invoices ?? 0);
      } catch (error) {
        console.error("Seller paylater insights error:", error);
      }
    };
    fetchPaylater();
    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  return (
    <div className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:border-t-4 tw:border-t-[#1f8a4f]">
      <p className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-[#1f8a4f]">
        YOU OWE
      </p>
      <Amount
        value={amount}
        className="tw:mt-1 tw:block tw:text-xl tw:font-bold tw:text-slate-900"
        decimalPlaces={0}
      />
      <p className="tw:mt-0.5 tw:text-xs tw:text-gray-500">Seller paylater</p>
      <p className="tw:text-[10px] tw:text-gray-400">{dueCount} invoices due</p>
    </div>
  );
};

export default PeerPaylater;
