import clsx from "clsx";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppProgress from "~/components/core/progress/AppProgress";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyTodayLive,
  getTodayLive,
  type LiveTile,
  type LiveTileTone,
  type TodayLiveData,
} from "./helper";

/** Icon chip + label share the metric's tone; the rail colour lives in app.css. */
const toneClasses: Record<LiveTileTone, { chip: string; label: string }> = {
  success: { chip: "tw:bg-emerald-50", label: "tw:text-emerald-700" },
  primary: { chip: "tw:bg-blue-50", label: "tw:text-blue-600" },
  warning: { chip: "tw:bg-amber-50", label: "tw:text-amber-600" },
  info: { chip: "tw:bg-indigo-50", label: "tw:text-indigo-600" },
};

const Tile = ({ tile }: { tile: LiveTile }) => {
  const tone = toneClasses[tile.tone];

  return (
    <div
      className={clsx(
        "app-home-live-tile",
        `app-home-live-tile-${tile.tone}`,
        "tw:flex tw:h-full tw:flex-col tw:rounded-lg tw:bg-white tw:p-3 tw:shadow-sm",
      )}
    >
      <div className="tw:flex tw:items-center tw:gap-2">
        <span
          className={clsx(
            tone.chip,
            "tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-xl",
          )}
        >
          {tile.emoji}
        </span>
        <span
          className={clsx(
            tone.label,
            "tw:text-xs tw:font-semibold tw:uppercase tw:leading-tight",
          )}
        >
          {tile.label}
        </span>
      </div>

      <div className="tw:mt-2 tw:border-t tw:border-slate-200 tw:pt-2">
        <div className="tw:text-2xl tw:font-bold tw:text-slate-900 tw:md:text-3xl">
          {tile.isAmount ? (
            <Amount value={tile.value} decimalPlaces={0} />
          ) : (
            tile.value
          )}
        </div>
        <div className="tw:mt-1 tw:text-[11px] tw:text-slate-500">
          {tile.hint}
        </div>
      </div>

      {typeof tile.progress === "number" && (
        <div className="tw:mt-auto tw:pt-3">
          <AppProgress value={tile.progress} color="success" className="tw:h-1" />
        </div>
      )}
    </div>
  );
};

/**
 * The live strip: four numbers that move during the day. Refreshes itself on
 * the interval the helper reports, so the "LIVE" chip is honest.
 */
const TodayLive = () => {
  const [data, setData] = useState<TodayLiveData>(emptyTodayLive);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async (initial: boolean) => {
      if (initial) setLoading(true);
      let result: TodayLiveData;
      try {
        result = await getTodayLive();
      } catch (e) {
        result = emptyTodayLive();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
      return result;
    };

    let timer: ReturnType<typeof setInterval> | undefined;

    load(true).then((result) => {
      if (cancelled || !result?.refreshSeconds) return;
      timer = setInterval(() => load(false), result.refreshSeconds * 1000);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <section className="tw:mb-5">
      <div className="tw:mb-2 tw:flex tw:items-center tw:justify-between tw:gap-3">
        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-700">
          Today · Live{" "}
          <span className="tw:font-normal tw:text-slate-400">
            Auto-refresh · {data.refreshSeconds}s
          </span>
        </div>
        <span className="tw:flex tw:items-center tw:gap-1.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-600">
          <span className="tw:h-1.5 tw:w-1.5 tw:animate-pulse tw:rounded-full tw:bg-emerald-500" />
          Live
        </span>
      </div>

      {loading ? (
        <div className="tw:flex tw:justify-center tw:py-6">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2 tw:xl:grid-cols-4">
          {data.tiles.map((tile) => (
            <Tile key={tile.key} tile={tile} />
          ))}
        </div>
      )}
    </section>
  );
};

export default TodayLive;
