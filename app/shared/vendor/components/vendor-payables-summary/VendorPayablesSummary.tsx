import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import AccountService from "~/services/AccountService";

/**
 * Outstanding payables owed to vendors — same accounts API the payables page
 * uses (`getPayablesReceiveables` + `outputType: "count"`), scoped with the
 * vendor party filter so the side-pane total matches the Vendor chip there.
 */
const fetchVendorPayables = async (): Promise<number> => {
  try {
    const response = await AccountService.getPayablesReceiveables({
      type: "payables",
      outputType: "count",
      filter: { "partyDetails.type": "vendor" },
    });
    const data = response?.data?.data || {};
    return Number(data.totalOutstandingAmount) || 0;
  } catch {
    return 0;
  }
};

/**
 * Compact "YOU OWE" payables strip for the vendor side pane. Same accounts
 * fetch as the payables page (vendor filter); single-row layout to keep the
 * pane list above the fold.
 */
const VendorPayablesSummary = () => {
  const { t } = useTranslation();
  const appNav = useAppNav();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const value = await fetchVendorPayables();
      if (!active) return;
      setAmount(value);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() =>
        appNav.to("/dashboard/accounts/payables", { view: "payables" })
      }
      className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:justify-between tw:gap-3 tw:rounded-xl tw:bg-red-50 tw:px-3 tw:py-2 tw:text-left tw:ring-1 tw:ring-red-200/60 tw:transition-colors tw:hover:bg-red-100/70 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-red-400"
    >
      <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-red-600">
        {t("youOwe", { defaultValue: "You owe" })}
      </span>
      {loading ? (
        <AppSpinner className="tw:h-4 tw:w-4" />
      ) : (
        <Amount
          value={amount}
          decimalPlaces={0}
          className="tw:text-sm tw:font-bold tw:tabular-nums tw:text-red-600"
        />
      )}
    </button>
  );
};

export default VendorPayablesSummary;
