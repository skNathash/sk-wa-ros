import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import AccountService from "~/services/AccountService";

interface SummaryEntry {
  amount: number;
  parties: number;
}

const EMPTY: SummaryEntry = { amount: 0, parties: 0 };

/**
 * Fetch the outstanding total (and party count) across all parties for one
 * direction. Mirrors the accounts payables page `getSummary` helper but is
 * self-contained so this shared component carries no route coupling.
 */
const fetchSummary = async (
  type: "payables" | "receivables",
): Promise<SummaryEntry> => {
  try {
    const response = await AccountService.getPayablesReceiveables({
      type,
      outputType: "count",
    });
    const data = response?.data?.data || {};
    return {
      amount: Number(data.totalOutstandingAmount) || 0,
      parties: Number(data.totalParties) || 0,
    };
  } catch (error) {
    return EMPTY;
  }
};

const partiesText = (parties: number) =>
  `${parties} ${parties === 1 ? "party" : "parties"}`;

/**
 * Compact overall Payables & Receivables summary — two tinted cards showing the
 * outstanding total owed to and by the user across every party. Reusable side
 * card; rendered in the accounts side pane (`AppPaneSide`).
 */
const PayablesReceivablesSummary = () => {
  const appNav = useAppNav();
  const [receivables, setReceivables] = useState<SummaryEntry>(EMPTY);
  const [payables, setPayables] = useState<SummaryEntry>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const [rec, pay] = await Promise.all([
        fetchSummary("receivables"),
        fetchSummary("payables"),
      ]);
      if (!active) return;
      setReceivables(rec);
      setPayables(pay);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const goTo = (view: "payables" | "receivables") =>
    appNav.to("/dashboard/accounts/payables", { view });

  return (
    <div className="tw:grid tw:grid-cols-2 tw:gap-3">
      <button
        type="button"
        onClick={() => goTo("receivables")}
        className="tw:cursor-pointer tw:text-left tw:rounded-2xl tw:bg-green-50 tw:p-4 tw:ring-1 tw:ring-green-200/70 tw:transition-shadow tw:hover:shadow-sm tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-green-400"
      >
        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-green-700">
          Receivables
        </div>
        {loading ? (
          <div className="tw:flex tw:min-h-[40px] tw:items-center">
            <AppSpinner className="tw:w-5 tw:h-5" />
          </div>
        ) : (
          <>
            <Amount
              value={receivables.amount}
              decimalPlaces={0}
              className="tw:mt-1 tw:block tw:text-xl tw:font-bold tw:text-green-800"
            />
            <p className="tw:mt-0.5 tw:text-[11px] tw:text-green-700/80">
              {partiesText(receivables.parties)}
            </p>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => goTo("payables")}
        className="tw:cursor-pointer tw:text-left tw:rounded-2xl tw:bg-red-50 tw:p-4 tw:ring-1 tw:ring-red-200/70 tw:transition-shadow tw:hover:shadow-sm tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-red-400"
      >
        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-red-700">
          Payables
        </div>
        {loading ? (
          <div className="tw:flex tw:min-h-[40px] tw:items-center">
            <AppSpinner className="tw:w-5 tw:h-5" />
          </div>
        ) : (
          <>
            <Amount
              value={payables.amount}
              decimalPlaces={0}
              className="tw:mt-1 tw:block tw:text-xl tw:font-bold tw:text-red-900"
            />
            <p className="tw:mt-0.5 tw:text-[11px] tw:text-red-700/80">
              {partiesText(payables.parties)}
            </p>
          </>
        )}
      </button>
    </div>
  );
};

export default PayablesReceivablesSummary;
