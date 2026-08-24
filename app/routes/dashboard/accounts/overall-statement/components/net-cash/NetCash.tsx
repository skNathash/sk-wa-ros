import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAccountsDateRange from "~/shared/accounts/hooks/useAccountsDateRange";
import { emptyNetCash, getNetCash, type NetCashData } from "./helper";

// The headline of the accounts screen: one number that answers "did the shop
// make or lose money this period?", with the supporting in/out/notes line and
// the SK wallet balance parked on the right.
const NetCash = () => {
  const { t } = useTranslation(["common"]);
  const range = useAccountsDateRange();

  const [data, setData] = useState<NetCashData>(emptyNetCash);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: NetCashData;
      try {
        result = await getNetCash(range);
      } catch (e) {
        result = emptyNetCash();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [range]);

  const isPositive = data.net >= 0;

  return (
    <div className="app-pnl-hero tw:mb-3 tw:rounded-2xl tw:p-4 tw:shadow-sm">
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:min-w-0">
          <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-white/70">
            {t("netCash")}
            {data.periodLabel ? ` · ${data.periodLabel}` : ""}
          </div>

          {loading ? (
            <div className="tw:mt-1">
              <AppSpinner />
            </div>
          ) : (
            <>
              <div className="tw:mt-0.5 tw:text-3xl tw:font-bold tw:text-white">
                {isPositive ? "+" : "-"}
                <Amount value={Math.abs(data.net)} decimalPlaces={0} />
              </div>
              <div className="tw:mt-1 tw:text-[11px] tw:leading-snug tw:text-white/70">
                {t("received")} <Amount value={data.received} decimalPlaces={0} />{" "}
                · {t("paid")} <Amount value={data.paid} decimalPlaces={0} /> ·{" "}
                {t("notes")} −<Amount value={data.notes} decimalPlaces={0} />
                {data.lockLabel ? ` · ${data.lockLabel}` : ""}
              </div>
            </>
          )}
        </div>

        <div className="tw:shrink-0 tw:rounded-xl tw:bg-white/15 tw:px-3 tw:py-2 tw:text-right">
          <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:text-white/60">
            {t("skWallet")}
          </div>
          {loading ? (
            <AppSpinner />
          ) : (
            <div className="tw:text-base tw:font-bold tw:text-white">
              <Amount value={data.walletBalance} decimalPlaces={0} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetCash;
