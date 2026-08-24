import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyProfitLeaks,
  getProfitLeaks,
  type ProfitLeaksData,
} from "./helper";

// The other side of the drivers block: the small costs that quietly ate into
// the margin this month, each with the reason it was flagged.
const ProfitLeaks = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<ProfitLeaksData>(emptyProfitLeaks);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: ProfitLeaksData;
      try {
        result = await getProfitLeaks();
      } catch (e) {
        result = emptyProfitLeaks();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("pnlTopLeaks", { defaultValue: "Top 5 leaks" })}
        </div>
        <div className="tw:text-[11px] tw:text-gray-400">{data.note}</div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : data.items.length === 0 ? (
        /* No cost line grew this month — that is the good outcome, not an
           empty table. */
        <div className="tw:px-4 tw:py-8 tw:text-center tw:text-xs tw:text-emerald-700">
          {t("pnlNoLeaks", {
            defaultValue: "No cost line grew this month",
          })}
        </div>
      ) : (
        <div className="tw:px-4 tw:py-1">
          {data.items.map((item) => (
            <div
              key={item.key}
              className="tw:flex tw:items-start tw:gap-2.5 tw:border-b tw:border-gray-100 tw:py-3 tw:last:border-b-0"
            >
              <span className="tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-red-50 tw:text-red-600">
                <TriangleAlert size={14} />
              </span>
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                  {item.label}
                </div>
                <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                  {item.detail}
                </div>
              </div>
              <div className="tw:shrink-0 tw:text-sm tw:font-bold tw:text-red-600">
                −<Amount value={item.amount} decimalPlaces={0} />
              </div>
            </div>
          ))}

          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:border-gray-100 tw:py-3">
            <div className="tw:text-xs tw:text-gray-500">
              {t("pnlTotalLeaks", { defaultValue: "Total identified leaks" })}
            </div>
            <div className="tw:text-sm tw:font-bold tw:text-red-600">
              −<Amount value={data.total} decimalPlaces={0} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLeaks;
