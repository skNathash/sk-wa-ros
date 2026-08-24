import { useEffect, useMemo, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import {
  getCurrentMonthYear,
  getMonthRange,
} from "~/shared/others/month-year-filter/MonthYearFilter";

interface WalletPrepaidProps {
  label?: string;
  subLabel?: string;
}

/**
 * "You have" SK Wallet prepaid balance card.
 * Fetches the `youHave` insights block for the current month.
 */
const WalletPrepaid = ({
  label = "YOU HAVE",
  subLabel = "SK Wallet prepaid",
}: WalletPrepaidProps) => {
  const [amount, setAmount] = useState<number>(0);

  const { startDate, endDate } = useMemo(() => {
    const { month, year } = getCurrentMonthYear();
    return getMonthRange(month, year);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchWallet = async () => {
      try {
        const response = await PurchaseOrderService.getDashboardInsights({
          filter: { type: "youHave", startDate, endDate },
        });
        if (!active) return;
        setAmount(response.data?.data?.youHave?.skWalletPrepaid ?? 0);
      } catch (error) {
        console.error("Wallet prepaid insights error:", error);
      }
    };
    fetchWallet();
    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  return (
    <div className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      <p className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-[#2e5aa8]">
        {label}
      </p>
      <Amount
        value={amount}
        className="tw:mt-1 tw:block tw:text-xl tw:font-bold tw:text-slate-900"
        decimalPlaces={0}
      />
      <p className="tw:mt-0.5 tw:text-xs tw:text-gray-500">{subLabel}</p>
    </div>
  );
};

export default WalletPrepaid;
