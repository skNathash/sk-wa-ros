import { useEffect, useMemo, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import {
  getCurrentMonthYear,
  getMonthRange,
} from "~/shared/others/month-year-filter/MonthYearFilter";

/**
 * "You owe" Local khata due card.
 * Fetches the `youOwe` insights block for the current month and reads the
 * `localKhata` slice.
 */
const LocalKhata = () => {
  const [amount, setAmount] = useState<number>(0);
  const [vendorCount, setVendorCount] = useState<number>(0);

  const { startDate, endDate } = useMemo(() => {
    const { month, year } = getCurrentMonthYear();
    return getMonthRange(month, year);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchKhata = async () => {
      try {
        const response = await PurchaseOrderService.getDashboardInsights({
          filter: { type: "youOwe", startDate, endDate },
        });
        if (!active) return;
        const localKhata = response.data?.data?.youOwe?.localKhata;
        setAmount(localKhata?.amount ?? 0);
        setVendorCount(localKhata?.vendors ?? 0);
      } catch (error) {
        console.error("Local khata insights error:", error);
      }
    };
    fetchKhata();
    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  return (
    <div className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70 tw:border-t-4 tw:border-t-[#c85a1d]">
      <p className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-[#c85a1d]">
        YOU OWE
      </p>
      <Amount
        value={amount}
        className="tw:mt-1 tw:block tw:text-xl tw:font-bold tw:text-slate-900"
        decimalPlaces={0}
      />
      <p className="tw:mt-0.5 tw:text-xs tw:text-gray-500">Local khata</p>
      <p className="tw:text-[10px] tw:text-gray-400">{vendorCount} vendors</p>
    </div>
  );
};

export default LocalKhata;
