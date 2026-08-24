import clsx from "clsx";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import ProfitAndLossService, {
  emptyPnlData,
  type PnlData,
} from "~/services/ProfitAndLossService";

// Net position comes from the statements pnl aggregation
// (outputType=pnl), the same source the P&L report page uses.
const PnlOverview = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();

  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const [data, setData] = useState<PnlData>(emptyPnlData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadPnlData = async () => {
      setLoading(true);
      let result: PnlData;
      try {
        result = await ProfitAndLossService.getStatement({ dateFrom, dateTo });
      } catch (e) {
        result = emptyPnlData();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    loadPnlData();

    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

  const onClick = () =>
    appNav.to("/dashboard/accounts/profit-loss", {
      tab: "profit-loss",
      dateFrom,
      dateTo,
    });

  const net = data.net;
  const isProfit = net >= 0;

  const Icon = isProfit ? TrendingUp : TrendingDown;

  // Hero treatment (`.app-pnl-hero`, shared with the P&L report's
  // NetProfitCard) so the net position reads as the headline figure and not
  // as just another white summary tile. Works in both themes. A loss flips
  // the surface to the red variant so the negative state is unmistakable.
  return (
    <div
      onClick={onClick}
      className={clsx(
        "app-pnl-hero tw:mb-3 tw:cursor-pointer tw:rounded-2xl tw:p-4 tw:shadow-sm",
        !loading && !isProfit && "app-pnl-hero-loss",
      )}
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
        <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2.5">
          <span className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-white/15 tw:text-white">
            <Icon size={18} />
          </span>
          <div className="tw:min-w-0">
            <div className="tw:truncate tw:text-sm tw:font-bold tw:text-white">
              {t("profitAndLoss")}
            </div>
            <div className="tw:line-clamp-2 tw:text-[11px] tw:leading-snug tw:text-white/70">
              {t("profitAndLossSubtitle")}
            </div>
          </div>
        </div>

        <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1">
          <div className="tw:text-right">
            <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:text-white/60">
              {isProfit ? t("netProfit") : t("netLoss")}
            </div>
            {loading ? (
              <AppSpinner />
            ) : (
              <span className="tw:text-xl tw:font-bold tw:text-white">
                {isProfit ? "" : "-"}
                <Amount value={Math.abs(net)} decimalPlaces={2} />
              </span>
            )}
          </div>
          <ChevronRight size={18} className="tw:text-white/60" />
        </div>
      </div>
    </div>
  );
};

export default PnlOverview;
