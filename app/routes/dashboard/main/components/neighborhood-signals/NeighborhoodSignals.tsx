import { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyNeighborhoodSignals,
  getNeighborhoodSignals,
  type NeighborhoodSignalsData,
} from "./helper";

/**
 * The one card on this row that isn't about the shop's own books — weather and
 * nearby demand, so it carries the dark treatment to read as outside news.
 */
const NeighborhoodSignals = () => {
  const [data, setData] = useState<NeighborhoodSignalsData>(
    emptyNeighborhoodSignals,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: NeighborhoodSignalsData;
      try {
        result = await getNeighborhoodSignals();
      } catch (e) {
        result = emptyNeighborhoodSignals();
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
    <div className="app-home-signals-card tw:h-full tw:rounded-xl tw:p-5 tw:shadow-sm">
      {/* Same eyebrow pill the journey card uses, so both dark cards open the
          same way. */}
      <span className="tw:inline-block tw:rounded-full tw:bg-white/12 tw:px-3 tw:py-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-white/80">
        {data.heading}
      </span>

      {loading ? (
        <div className="tw:flex tw:justify-center tw:py-6">
          <AppSpinner />
        </div>
      ) : (
        <>
          <div className="tw:mt-3 tw:text-4xl tw:font-bold tw:text-white">
            {data.temperature}°
          </div>
          <div className="tw:mt-2 tw:border-b tw:border-white/15 tw:pb-3 tw:text-xs tw:leading-relaxed tw:text-white/70">
            {data.condition}
          </div>

          <ul className="tw:mt-3 tw:space-y-2">
            {data.signals.map((signal) => (
              <li
                key={signal.key}
                className="tw:flex tw:gap-2 tw:text-xs tw:leading-relaxed tw:text-white/70"
              >
                <span className="tw:shrink-0">{signal.emoji}</span>
                <span>{signal.text}</span>
              </li>
            ))}
          </ul>

          {data.tip && (
            <div className="tw:mt-4 tw:rounded-xl tw:border-l-2 tw:border-amber-300 tw:bg-white/8 tw:p-3 tw:text-xs tw:font-medium tw:leading-relaxed tw:text-white">
              {data.tip}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NeighborhoodSignals;
