import { ArrowRight, Equal } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptySubscriptionRoi,
  getSubscriptionRoi,
  type SubscriptionRoiData,
} from "./helper";

/**
 * The subscription read as an equation — what it costs, what it gave back, and
 * the multiple between them — so the month's platform value can be weighed
 * against the bill it arrives with.
 */
const SubscriptionRoi = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<SubscriptionRoiData>(emptySubscriptionRoi);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: SubscriptionRoiData;
      try {
        result = await getSubscriptionRoi();
      } catch (e) {
        result = emptySubscriptionRoi();
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
    <div className="tw:mb-3 tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("pnlSubscriptionRoi", {
            defaultValue: "ROI on StoreKing subscription",
          })}
        </div>
        <div className="tw:shrink-0 tw:text-[11px] tw:text-gray-400">
          {data.note}
        </div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:flex tw:flex-col tw:items-stretch tw:gap-3 tw:px-4 tw:py-4 tw:md:flex-row tw:md:items-center">
          <div className="tw:flex-1 tw:rounded-xl tw:bg-gray-50 tw:px-4 tw:py-4 tw:text-center">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
              {data.costLabel}
            </div>
            <div className="tw:mt-1 tw:text-2xl tw:font-bold tw:text-gray-900">
              {data.costValue}
            </div>
            <div className="tw:mt-1 tw:text-[11px] tw:text-gray-500">
              {data.costNote}
            </div>
          </div>

          <ArrowRight
            size={18}
            className="tw:mx-auto tw:shrink-0 tw:rotate-90 tw:text-gray-400 tw:md:rotate-0"
          />

          <div className="tw:flex-1 tw:rounded-xl tw:bg-emerald-50 tw:px-4 tw:py-4 tw:text-center">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-700">
              {data.earnLabel}
            </div>
            <div className="tw:mt-1 tw:text-2xl tw:font-bold tw:text-emerald-700">
              {data.earnValue}
            </div>
            <div className="tw:mt-1 tw:text-[11px] tw:text-gray-500">
              {data.earnNote}
            </div>
          </div>

          <Equal
            size={18}
            className="tw:mx-auto tw:shrink-0 tw:text-gray-400"
          />

          <div className="tw:flex-1 tw:rounded-xl tw:bg-emerald-700 tw:px-4 tw:py-4 tw:text-center">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-50">
              {data.roiLabel}
            </div>
            <div className="tw:mt-1 tw:text-3xl tw:font-bold tw:text-white">
              {data.roiValue}
            </div>
            <div className="tw:mt-1 tw:text-[11px] tw:text-emerald-50">
              {data.roiNote}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionRoi;
