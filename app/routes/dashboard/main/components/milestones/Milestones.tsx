import clsx from "clsx";
import { ChevronRight, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import {
  emptyMilestones,
  getMilestones,
  type Milestone,
  type MilestonesData,
} from "./helper";

const MilestoneRow = ({ milestone }: { milestone: Milestone }) => (
  <div
    className={clsx(
      "tw:flex tw:items-center tw:gap-3 tw:py-3 tw:first:pt-0 tw:last:pb-0",
      !milestone.earned && "tw:opacity-60",
    )}
  >
    <span className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-slate-100 tw:text-lg">
      {milestone.emoji}
    </span>

    <div className="tw:min-w-0 tw:flex-1">
      <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
        {milestone.title}
      </div>
      <div className="tw:text-[11px] tw:text-slate-500">{milestone.meta}</div>
    </div>

    {milestone.earned && (
      <Star size={16} className="tw:shrink-0 tw:fill-amber-400 tw:text-amber-400" />
    )}
  </div>
);

/** The shop's trophy shelf — what it has already earned, and what's next. */
const Milestones = () => {
  const [data, setData] = useState<MilestonesData>(emptyMilestones);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: MilestonesData;
      try {
        result = await getMilestones();
      } catch (e) {
        result = emptyMilestones();
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
    <AppCard className="app-home-panel">
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
          {data.heading}{" "}
          <span className="tw:font-normal tw:text-slate-400">
            {data.earnedCount}/{data.totalCount} earned
          </span>
        </div>
        {data.linkTo && (
          <Link
            to={data.linkTo}
            className="tw:flex tw:items-center tw:text-xs tw:font-semibold tw:text-emerald-700"
          >
            {data.linkLabel}
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="tw:flex tw:justify-center tw:py-6">
          <AppSpinner />
        </div>
      ) : (
        <div className="tw:divide-y tw:divide-border/60">
          {data.milestones.map((milestone) => (
            <MilestoneRow key={milestone.key} milestone={milestone} />
          ))}
        </div>
      )}
    </AppCard>
  );
};

export default Milestones;
