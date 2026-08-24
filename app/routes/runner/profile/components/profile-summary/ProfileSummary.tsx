import type { CSSProperties } from "react";
import { RUNNER_PROFILE } from "../../helper";

/**
 * Standing record — the three figures the runner is paid and ranked on. The
 * card straddles the brand block's bottom edge, so the record reads as part of
 * the identity above it rather than as the first row of the tab below.
 */
export default function ProfileSummary() {
  return (
    <div className="runner-hero-strip-wrap">
      <div className="runner-profile-strip">
        {/* Trust is a single score, so it is drawn rather than listed — the
            ring fills to the score and the runner reads it without a figure. */}
        <div
          className="runner-trust-ring"
          style={{ "--runner-trust": `${RUNNER_PROFILE.trustScore}%` } as CSSProperties}
        >
          <span className="runner-trust-value">
            {RUNNER_PROFILE.trustScore}
            <span className="tw:text-[0.6rem]">%</span>
          </span>
          <span className="runner-trust-label">{RUNNER_PROFILE._trustLbl}</span>
        </div>

        <div className="runner-profile-stat">
          <span className="app-label tw:text-slate-400">Streak</span>
          <p className="app-amount tw:text-2xl tw:font-bold tw:text-primary">
            {RUNNER_PROFILE.streakDays}
            <span className="tw:ml-1 tw:text-sm tw:font-semibold tw:text-slate-500">
              {RUNNER_PROFILE._streakUnitLbl}
            </span>
          </p>
          <span className="tw:text-[11px] tw:text-slate-400">
            {RUNNER_PROFILE._streakCaption}
          </span>
        </div>

        <div className="runner-profile-stat">
          <span className="app-label tw:text-slate-400">Clean drops</span>
          <p className="app-amount tw:text-2xl tw:font-bold tw:text-slate-900">
            {RUNNER_PROFILE._cleanDropsLbl}
            <span className="tw:ml-1 tw:text-sm tw:font-semibold tw:text-slate-500">
              {RUNNER_PROFILE._cleanTotalLbl}
            </span>
          </p>
          <span className="tw:text-[11px] tw:text-slate-400">
            {RUNNER_PROFILE._cleanCaption}
          </span>
        </div>
      </div>
    </div>
  );
}
