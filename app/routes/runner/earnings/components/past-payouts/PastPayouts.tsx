import { Check } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import {
  PAST_PAYOUTS,
  PAST_PAYOUTS_LBL,
  PAST_PAYOUTS_RANGE_LBL,
} from "./helper";

/**
 * Settled weeks. Each row leads with a cleared mark rather than the amount:
 * the runner comes here to confirm a transfer landed, and only then to check
 * what it was — hence the UTR sitting under the week it belongs to.
 */
export default function PastPayouts() {
  return (
    <section className="tw:flex tw:flex-col tw:gap-3 tw:px-4 tw:pt-5">
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="app-label tw:text-slate-500">{PAST_PAYOUTS_LBL}</span>
        <span className="tw:text-xs tw:text-slate-400">
          {PAST_PAYOUTS_RANGE_LBL}
        </span>
      </div>

      <div className="runner-card-grid">
        {PAST_PAYOUTS.map((payout) => (
          <AppCard
            key={payout.id}
            className="tw:mb-0 tw:py-3.5"
            bodyClassName="tw:px-4"
          >
            <div className="tw:flex tw:items-center tw:gap-3">
              <span className="runner-payout-tick">
                <Check size={16} />
              </span>

              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:block tw:truncate tw:text-base tw:font-bold tw:text-slate-900">
                  {payout._rangeLbl}
                </span>
                <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
                  {payout._metaLbl}
                </span>
                <span className="runner-payout-utr">{payout._utrLbl}</span>
              </span>

              <span className="tw:text-right">
                <span className="app-amount tw:block tw:text-lg tw:font-bold tw:text-slate-900">
                  {payout._amountLbl}
                </span>
                <span className="runner-payout-status">
                  {payout._statusLbl}
                </span>
              </span>
            </div>
          </AppCard>
        ))}
      </div>
    </section>
  );
}
