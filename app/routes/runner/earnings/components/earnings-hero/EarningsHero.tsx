import { Landmark } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import { NEXT_PAYOUT_LBL, WEEK_EARNING } from "./helper";

/**
 * Earnings hero — the week's running total, the run behind it, and the date
 * the money actually lands. The payout slab sits inside the brand block rather
 * than under it: "when do I get paid" is read in the same glance as "how much".
 */
export default function EarningsHero() {
  return (
    <section className="runner-hero">
      <div className="runner-hero-band">
        <div className="runner-hero-wash" />

        <div className="tw:relative tw:flex tw:flex-col tw:gap-1 tw:px-4 tw:pt-3">
          <span className="app-label tw:text-white/60">
            {WEEK_EARNING._periodLbl}
          </span>

          {/* The one figure the screen exists for. */}
          <p className="tw:flex tw:items-baseline tw:gap-2">
            <Amount
              value={WEEK_EARNING.amount}
              decimalPlaces={0}
              className="tw:text-5xl tw:font-semibold tw:text-white"
            />
            <span className="tw:text-sm tw:text-white/70">
              {WEEK_EARNING._soFarLbl}
            </span>
          </p>

          <p className="tw:mt-1 tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-white/70">
            <b className="tw:text-white">{WEEK_EARNING._deliveriesLbl}</b>
            <span className="tw:text-white/40">·</span>
            <b className="tw:text-white">{WEEK_EARNING._distanceLbl}</b>
            <span className="tw:text-white/40">·</span>
            <b className="tw:text-white">{WEEK_EARNING._hoursLbl}</b>
          </p>

          {/* Where the week ends up — date on the left, account on the right. */}
          <div className="runner-payout-slab">
            <Landmark size={18} className="tw:shrink-0 tw:text-white/70" />

            <span className="tw:min-w-0 tw:flex-1">
              <span className="app-label tw:block tw:text-white/60">
                {NEXT_PAYOUT_LBL}
              </span>
              <span className="tw:block tw:truncate tw:text-base tw:font-bold tw:text-white">
                {WEEK_EARNING._payoutLbl}
              </span>
            </span>

            <span className="runner-payout-account">
              {WEEK_EARNING._accountLbl}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
