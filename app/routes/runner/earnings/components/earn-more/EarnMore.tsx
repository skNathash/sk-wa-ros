import AppCard from "~/components/core/card/AppCard";
import { EARN_MORE_LBL, EARN_MORE_WAYS } from "./helper";

/**
 * What next week could pay. Sits last on purpose — it is the only block that
 * talks about money the runner has not earned yet, so it never competes with
 * the settled figures above it.
 */
export default function EarnMore() {
  return (
    <section className="tw:px-4 tw:pt-4 tw:pb-6">
      <AppCard className="tw:mb-0" bodyClassName="tw:px-4">
        <span className="app-label tw:text-slate-500">{EARN_MORE_LBL}</span>

        <div className="tw:mt-2">
          {EARN_MORE_WAYS.map((way) => (
            <div key={way.key} className="runner-earn-row">
              <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-sm tw:text-slate-700">
                {way.label}
              </span>
              <span className="app-amount tw:text-sm tw:font-bold tw:text-primary">
                {way._amountLbl}
              </span>
              <span className="tw:text-xs tw:font-semibold tw:text-slate-400">
                {way._unitLbl}
              </span>
            </div>
          ))}
        </div>
      </AppCard>
    </section>
  );
}
