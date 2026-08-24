import { BadgeCheck, Star } from "lucide-react";
import { RUNNER_PROFILE } from "../../helper";

/**
 * Profile hero — who the runner is, as the platform sees them: the face, the
 * name, the record behind it and the two states that decide whether work
 * reaches them at all (shift and KYC). It shares the brand block with the home
 * hero, so the profile opens on the same gradient the runner already knows.
 */
export default function ProfileHero() {
  return (
    <div className="tw:relative tw:flex tw:items-center tw:gap-4 tw:px-4 tw:pt-1 tw:pb-2">
      <span className="runner-profile-avatar">
        {RUNNER_PROFILE.name.charAt(0)}
      </span>

      <div className="tw:min-w-0 tw:flex-1">
        <h2 className="app-heading-serif tw:truncate tw:text-2xl tw:font-semibold tw:text-white">
          {RUNNER_PROFILE.name}
        </h2>

        <p className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:text-white/70">
          <Star size={14} className="tw:fill-amber-300 tw:text-amber-300" />
          <b className="tw:text-white">{RUNNER_PROFILE.rating}</b>
          <span className="tw:text-white/40">·</span>
          {RUNNER_PROFILE._deliveriesLbl}
        </p>

        <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-white/70">
          {RUNNER_PROFILE._vehicleLbl}
          <span className="tw:px-1.5 tw:text-white/40">·</span>
          {RUNNER_PROFILE._plateLbl}
        </p>

        <p className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
          <span className="runner-profile-chip">
            {RUNNER_PROFILE._shiftLbl}
          </span>
          <span className="runner-profile-chip runner-profile-chip--verified">
            <BadgeCheck size={12} />
            {RUNNER_PROFILE._verifiedLbl}
          </span>
        </p>
      </div>
    </div>
  );
}
