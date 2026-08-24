import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAccountsDateRange from "~/shared/accounts/hooks/useAccountsDateRange";
import { emptyThreePipes, getThreePipes, type ThreePipesData } from "./helper";

// Each customer type gets its own dot tone so the lanes stay tellable apart at
// a glance; purely presentational, the API only carries the numbers.
const tones: Record<string, string> = {
  b2c: "var(--accent-in, #1f8a4f)",
  b2b: "#2563eb",
};

// The lanes money moves through the selected window, side by side, so the shop
// can see which channel is actually carrying the period.
const ThreePipes = () => {
  const range = useAccountsDateRange();

  // Header carries the window the numbers belong to, not a fixed "this month".
  const rangeLabel = useMemo(() => {
    try {
      return `${format(new Date(range.startDate), "dd MMM")} – ${format(
        new Date(range.endDate),
        "dd MMM yyyy",
      )}`;
    } catch {
      return "";
    }
  }, [range]);

  const [data, setData] = useState<ThreePipesData>(emptyThreePipes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: ThreePipesData;
      try {
        result = await getThreePipes(range);
      } catch (e) {
        result = emptyThreePipes();
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

  return (
    <div className="tw:mb-3 tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {rangeLabel}
        </div>
        <div className="tw:text-[11px] tw:text-gray-500">
          How the money moves
        </div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:p-4">
          {data.lanes.map((lane) => (
            <div key={lane.key}>
              <div className="tw:flex tw:items-center tw:gap-1.5">
                <span
                  className="tw:h-2 tw:w-2 tw:shrink-0 tw:rounded-full"
                  style={{ backgroundColor: tones[lane.key] }}
                />
                <span className="tw:truncate tw:text-xs tw:font-semibold tw:text-gray-700">
                  {lane.label}
                </span>
              </div>

              <div className="tw:mt-1 tw:text-xl tw:font-bold tw:text-gray-900">
                <Amount value={lane.amount} decimalPlaces={0} />
              </div>

              <div className="tw:text-[11px] tw:text-gray-500">{lane.note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThreePipes;
