import clsx from "clsx";
import { Clock, MessageSquare, Navigation, Phone } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import StaticGMap from "~/components/core/map/StaticGMap";
import type { RunnerActiveJobCard } from "../../helper";

interface ActiveJobCardProps {
  job: RunnerActiveJobCard;
}

/**
 * A job the runner is on this minute. The map leads because the only question
 * on an active job is where to go next; the stage strip above it names the leg
 * so a pickup never reads as a drop, and the actions close the card.
 */
export default function ActiveJobCard({ job }: ActiveJobCardProps) {
  return (
    <AppCard
      className={clsx("runner-active-card tw:mb-0", job._cardCls)}
      noPadding
      bodyClassName="tw:p-0"
    >
      {/* Stage strip — the leg the runner is on, against the order code. */}
      <div className="runner-active-stage">
        <span className="runner-active-stage-dot" />
        <span className="tw:truncate">{job._stageLbl}</span>
        <span className="tw:ml-auto tw:shrink-0">{job.orderCode}</span>
      </div>

      <div className="runner-active-map">
        <StaticGMap lat={job.lat} lng={job.lng} className="tw:h-40 tw:w-full" />

        <span className="runner-active-eta">
          <Clock size={13} />
          {job._etaLbl}
        </span>
      </div>

      <div className="tw:p-4">
        <span className="app-label tw:text-slate-400">{job._targetLbl}</span>
        <h3 className="tw:truncate tw:text-xl tw:font-bold tw:text-slate-900">
          {job.name}
        </h3>

        {/* The leg in one line: where, how far, how much to carry. */}
        <p className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:text-slate-500">
          <span className="tw:truncate">{job._placeLbl}</span>
          <span className="tw:text-slate-300">·</span>
          <span>{job._distanceLbl}</span>
          <span className="tw:text-slate-300">·</span>
          <span>{job._itemsLbl}</span>
          <span className="tw:text-slate-300">·</span>
          <span>{job._weightLbl}</span>
        </p>

        {/* Reach the person, or ride. Navigation takes the row's weight. */}
        <div className="tw:mt-3.5 tw:flex tw:items-center tw:gap-2">
          <AppButton fill="outline" color="light" size="icon">
            <Phone size={18} />
          </AppButton>
          <AppButton fill="outline" color="light" size="icon">
            <MessageSquare size={18} />
          </AppButton>

          <AppButton size="large" className="tw:flex-1">
            <Navigation size={16} />
            {job._actionLbl}
          </AppButton>
        </div>

        {/* Money the runner is accountable for, only when there is any. */}
        {job._collectLbl && (
          <p className="runner-active-collect">{job._collectLbl}</p>
        )}
      </div>
    </AppCard>
  );
}
