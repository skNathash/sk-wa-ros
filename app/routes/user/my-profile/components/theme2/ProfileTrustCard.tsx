import React from "react";
import type { ProfileOverviewModel } from "./helper";

interface ProfileTrustCardProps {
  model: ProfileOverviewModel;
  /** Jumps to the first check the store still owes. */
  onComplete: () => void;
}

/** Geometry of the progress ring — radius drives the dash length. */
const RING_RADIUS = 30;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * The profile's trust score and what unlocking the rest of it buys the store —
 * the banner the overview leads with, sitting beside the stat cards.
 */
const ProfileTrustCard: React.FC<ProfileTrustCardProps> = ({
  model,
  onComplete,
}) => {
  const dash = (model.trust.percent / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="tw:flex tw:h-full tw:items-center tw:gap-4 tw:rounded-2xl tw:bg-linear-to-br tw:from-emerald-800 tw:to-emerald-600 tw:p-5 tw:text-white">
      <div className="tw:relative tw:size-20 tw:shrink-0">
        <svg viewBox="0 0 72 72" className="tw:size-full tw:-rotate-90">
          <circle
            cx="36"
            cy="36"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            className="tw:text-white/25"
          />
          <circle
            cx="36"
            cy="36"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${RING_CIRCUMFERENCE}`}
            className="tw:text-white"
          />
        </svg>
        <div className="tw:absolute tw:inset-0 tw:flex tw:flex-col tw:items-center tw:justify-center">
          <span className="tw:text-xl tw:font-bold tw:tabular-nums">
            {model.trust.percent}
          </span>
          <span className="tw:text-[9px] tw:font-semibold tw:tracking-widest tw:text-white/70">
            TRUST
          </span>
        </div>
      </div>

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-white/70">
          {model.trust.remainingLabel} · {model.counts.verified}/
          {model.counts.all} verified
        </div>
        <div className="tw:mt-1 tw:text-lg tw:font-bold tw:leading-tight">
          {model.trust.headline}
        </div>
        {model.trust.remaining > 0 && (
          <button
            type="button"
            onClick={onComplete}
            className="tw:mt-3 tw:cursor-pointer tw:rounded-lg tw:bg-white tw:px-3.5 tw:py-2 tw:text-sm tw:font-bold tw:text-emerald-800 tw:hover:bg-white/90"
          >
            Complete now
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileTrustCard;
