import clsx from "clsx";
import { BanknoteArrowUp, MapPin, Star } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import type { RunnerTodayJob } from "../../helper";

interface TodayJobCardProps {
  job: RunnerTodayJob;
}

/**
 * One line of today's run. Compact by design — the runner is scanning a list
 * they already rode, so the card carries the status, the customer and what it
 * paid, with the left rail colouring the status without being read.
 */
export default function TodayJobCard({ job }: TodayJobCardProps) {
  return (
    <AppCard
      className={clsx("runner-job-card tw:mb-0 tw:py-3.5", job._cardCls)}
      bodyClassName="tw:px-4 tw:pl-4.5"
    >
      {/* Status, order type and code — what the job is, then its time. */}
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className={clsx("runner-job-badge", job._statusCls)}>
          {job._statusLbl}
        </span>
        <span className={clsx("runner-job-badge", job._typeCls)}>
          {job._typeLbl}
        </span>
        <span className="tw:text-xs tw:font-semibold tw:text-slate-500">
          {job.orderCode}
        </span>
        <span className="tw:ml-auto tw:text-xs tw:font-medium tw:text-slate-400">
          {job._timeLbl}
        </span>
      </div>

      <h3 className="tw:mt-2 tw:truncate tw:text-lg tw:font-bold tw:text-slate-900">
        {job.customerName}
      </h3>

      {/* Where it went, how far, how much it carried. */}
      <p className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-slate-500">
        <MapPin size={13} className="tw:shrink-0" />
        <span className="tw:truncate">{job._placeLbl}</span>
        <span className="tw:text-slate-300">·</span>
        <span>{job._distanceLbl}</span>
        <span className="tw:text-slate-300">·</span>
        <span>{job._itemsLbl}</span>
      </p>

      {/* Cash, clock or stars — whichever the job still carries — against pay. */}
      <div className="tw:mt-2.5 tw:flex tw:items-center tw:gap-2">
        {job._codLbl && (
          <span className="runner-job-cod">
            <BanknoteArrowUp size={13} />
            COD {job._codLbl}
          </span>
        )}

        {job._etaLbl && <span className="runner-job-eta">{job._etaLbl}</span>}

        {job._rating > 0 && (
          <span className="tw:flex tw:items-center tw:gap-0.5 tw:text-amber-500">
            {Array.from({ length: job._rating }).map((_, i) => (
              <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
            ))}
          </span>
        )}

        <span className="tw:ml-auto tw:flex tw:items-center tw:text-lg tw:font-bold tw:text-slate-900">
          +
          <Amount value={job.earning} decimalPlaces={0} />
        </span>
      </div>
    </AppCard>
  );
}
