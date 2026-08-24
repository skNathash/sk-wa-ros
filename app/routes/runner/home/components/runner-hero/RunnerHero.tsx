import { Star } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppSwitch from "~/components/core/form/AppSwitch";
import { RUNNER } from "../../helper";

/**
 * Runner home hero — the runner's shift status and what the day has paid so
 * far, ending in the streak/week/rating strip that overlaps the brand block.
 * The greeting above it is its own sticky header ({@link RunnerHeader}). The
 * status pill is a live online/offline switch backed by the runner API.
 */
export default function RunnerHero({
  name = "",
  firstName = "",
  isOnline = RUNNER.isOnline,
  onToggleOnline,
  switching = false,
}: {
  name?: string;
  firstName?: string;
  isOnline?: boolean;
  onToggleOnline?: (online: boolean) => void;
  switching?: boolean;
}) {
  const statusLbl = `You're ${isOnline ? "ONLINE" : "OFFLINE"}`;
  const statusCaption = isOnline ? "Getting jobs" : "Paused for jobs";
  return (
    <section className={`runner-hero${isOnline ? "" : " runner-hero--offline"}`}>
      <div className="runner-hero-band">
        <div className="runner-hero-wash" />

        <div className="tw:relative tw:flex tw:flex-col tw:gap-4 tw:px-4 tw:pt-2 tw:lg:gap-3 tw:lg:pt-1">
          {/* Shift row — the runner beside the online switch. */}
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="runner-hero-avatar">
              {(firstName || name).charAt(0)}
            </div>

            <div className="tw:min-w-0 tw:flex-1">
              <p className="tw:text-xs tw:text-white/70 tw:lg:hidden">
                {RUNNER.greeting}
              </p>
              <p className="tw:truncate tw:text-lg tw:font-bold tw:text-white">
                {name || RUNNER.name} 👋
              </p>
            </div>

            <div className="runner-hero-status">
              <span className="runner-hero-status-dot" />
              <span className="tw:min-w-0">
                <span className="tw:block tw:text-xs tw:font-bold tw:text-white">
                  {statusLbl}
                </span>
                <span className="tw:block tw:text-[10px] tw:text-white/70">
                  {statusCaption}
                </span>
              </span>
              <AppSwitch
                checked={isOnline}
                disabled={switching}
                onCheckedChange={onToggleOnline}
              />
            </div>
          </div>

          {/* Today's money — the one number the runner opens the app for. */}
          <div className="tw:flex tw:flex-col tw:items-center tw:gap-1 tw:pt-2 tw:pb-2 tw:lg:flex-row tw:lg:items-baseline tw:lg:gap-4 tw:lg:pt-0 tw:lg:pb-4">
            <span className="app-label tw:text-white/60">Today's earnings</span>
            <Amount
              value={RUNNER.todayEarning}
              decimalPlaces={0}
              className="tw:text-5xl tw:font-semibold tw:text-white"
            />
            <p className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-white/70 tw:lg:ml-auto">
              <span>
                <b className="tw:text-white">{RUNNER._deliveriesLbl}</b>{" "}
                deliveries
              </span>
              <span className="tw:text-white/40">·</span>
              <b className="tw:text-white">{RUNNER._distanceLbl}</b>
              <span className="tw:text-white/40">·</span>
              <span className="tw:flex tw:items-center tw:gap-1">
                <b className="tw:text-white">{RUNNER._ratingLbl}</b>
                <Star
                  size={13}
                  className="tw:fill-amber-300 tw:text-amber-300"
                />
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Standing record — the card straddles the brand block's bottom edge,
          half over the gradient and half on the page below it. */}
      <div className="runner-hero-strip-wrap">
        <div className="runner-hero-strip">
          <div className="runner-hero-stat">
            <span className="app-label tw:text-slate-400">Streak</span>
            <p className="app-amount tw:text-2xl tw:font-bold tw:text-slate-900">
              {RUNNER.streakDays}
              <span className="tw:ml-1 tw:text-sm tw:font-semibold tw:text-slate-500">
                days
              </span>
            </p>
            <span className="tw:text-[11px] tw:text-slate-400">
              {RUNNER._streakCaption}
            </span>
          </div>

          <div className="runner-hero-stat">
            <span className="app-label tw:text-slate-400">This week</span>
            <p className="app-amount tw:text-2xl tw:font-bold tw:text-slate-900">
              {RUNNER._weekEarningLbl}
            </p>
            <span className="tw:text-[11px] tw:text-slate-400">
              {RUNNER._weekDropsCaption}
            </span>
          </div>

          <div className="runner-hero-stat">
            <span className="app-label tw:text-slate-400">Rating</span>
            <p className="app-amount tw:flex tw:items-center tw:gap-1 tw:text-2xl tw:font-bold tw:text-slate-900">
              {RUNNER.rating}
              <Star size={16} className="tw:fill-amber-400 tw:text-amber-400" />
            </p>
            <span className="tw:text-[11px] tw:text-slate-400">
              {RUNNER._lifetimeCaption}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
