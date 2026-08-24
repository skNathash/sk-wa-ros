import { ShieldCheck } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import { TRUST_BOND } from "./helper";

/**
 * The deposit held against cash handling. It reads as a bar rather than a
 * line item because the runner is owed this money back — the fill is how close
 * the release is, and the count under it is what earns it.
 */
export default function TrustBond() {
  return (
    <section className="tw:px-4 tw:pt-4">
      <AppCard className="tw:mb-0 tw:py-3.5" bodyClassName="tw:px-4">
        <div className="tw:flex tw:items-center tw:gap-3">
          <span className="runner-bond-icon">
            <ShieldCheck size={18} />
          </span>

          <span className="tw:min-w-0 tw:flex-1">
            <span className="tw:block tw:truncate tw:text-base tw:font-bold tw:text-slate-900">
              {TRUST_BOND.title}
            </span>
            <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
              {TRUST_BOND._captionLbl}
            </span>
          </span>

          <span className="app-amount tw:text-lg tw:font-bold tw:text-primary">
            {TRUST_BOND._amountLbl}
          </span>
        </div>

        <div className="runner-bond-track">
          <span
            className="runner-bond-fill"
            style={{ width: `${TRUST_BOND._progressPct}%` }}
          />
        </div>

        <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
          <span className="tw:text-xs tw:text-slate-500">
            {TRUST_BOND._dropsLbl}
          </span>
          <span className="tw:ml-auto tw:text-xs tw:font-bold tw:text-primary">
            {TRUST_BOND._statusLbl} ✓
          </span>
        </div>
      </AppCard>
    </section>
  );
}
