import clsx from "clsx";
import { ArrowRight, BanknoteArrowUp, Package } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import type { RunnerAvailableJob } from "../../helper";

interface AvailableJobCardProps {
  job: RunnerAvailableJob;
}

/**
 * An open job, still unclaimed. Pickup and drop sit side by side because the
 * runner is comparing two distances before anything else, and the pay is
 * repeated inside Accept so the tap and the reason for it are the same target.
 */
export default function AvailableJobCard({ job }: AvailableJobCardProps) {
  return (
    <AppCard className="tw:mb-0 tw:py-3.5" bodyClassName="tw:px-4">
      {/* The handle on an unclaimed job, against what the run pays. */}
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="runner-nearby-code">{job.orderCode}</span>
        <span className="tw:ml-auto tw:flex tw:items-center tw:text-xl tw:font-bold tw:text-slate-900">
          +
          <Amount value={job.earning} decimalPlaces={0} />
        </span>
      </div>

      {/* Both ends of the run in one row — the arrow carries the direction. */}
      <div className="tw:mt-2.5 tw:flex tw:items-start tw:gap-2">
        <div className="tw:min-w-0 tw:flex-1">
          <span className="app-label tw:block tw:text-slate-400">Pickup</span>
          <p className="tw:truncate tw:font-bold tw:text-slate-900">
            {job._pickupStoreLbl}
          </p>
          <p className="tw:text-xs tw:text-slate-400">
            {job._pickupDistanceLbl}
          </p>
        </div>

        <ArrowRight size={16} className="tw:mt-4 tw:shrink-0 tw:text-slate-300" />

        <div className="tw:min-w-0 tw:flex-1">
          <span className="app-label tw:block tw:text-slate-400">Drop</span>
          <p className="tw:truncate tw:font-bold tw:text-slate-900">
            {job._dropNameLbl}
          </p>
          <p className="tw:truncate tw:text-xs tw:text-slate-400">
            {job._dropPlaceLbl} · {job._dropDistanceLbl}
          </p>
        </div>
      </div>

      {/* What the run collects and carries. */}
      <div className="tw:mt-2.5 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        {job._codLbl && (
          <span className="runner-job-cod">
            <BanknoteArrowUp size={13} />
            COD {job._codLbl}
          </span>
        )}

        <span className="runner-job-load">
          <Package size={13} />
          {job._itemsLbl}
        </span>

        <span className={clsx("runner-job-badge", job._typeCls)}>
          {job._typeLbl}
        </span>
      </div>

      {/* Take it or leave it — same height, opposite weight. */}
      <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2.5">
        <AppButton fill="outline" color="light" size="large" className="tw:flex-1">
          Skip
        </AppButton>

        <AppButton size="large" className="tw:flex-[2]">
          {job._acceptLbl}
          <ArrowRight size={16} />
        </AppButton>
      </div>
    </AppCard>
  );
}
