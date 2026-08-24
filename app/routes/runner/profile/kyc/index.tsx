import { Check, Info, ShieldCheck } from "lucide-react";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import { KYC_DOCS, KYC_NOTE_LBL, KYC_STATE } from "./helper";

/**
 * KYC panel — the checks that decide which jobs reach the runner. The verdict
 * is stated once at the top, and every row below it repeats the same green
 * tick: a runner scanning the list is looking for the one that breaks the run,
 * not reading six results.
 */
export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    allowNoSubscribe: true,
    allowIncompleteProfile: true,
  });
}

const RunnerProfileKyc = () => {
  return (
    <div className="runner-profile-panel">
      <div className="runner-profile-banner">
        <ShieldCheck size={20} className="tw:shrink-0 tw:text-emerald-600" />
        <span className="tw:min-w-0">
          <span className="tw:block tw:text-base tw:font-bold tw:text-emerald-900">
            {KYC_STATE._titleLbl}
          </span>
          <span className="tw:block tw:text-xs tw:text-emerald-700">
            {KYC_STATE._captionLbl}
          </span>
        </span>
      </div>

      <div className="runner-profile-card">
        {KYC_DOCS.map((doc) => (
          <div key={doc.key} className="runner-profile-row">
            <span className="runner-profile-check">
              <Check size={16} strokeWidth={3} />
            </span>

            <span className="tw:min-w-0 tw:flex-1">
              <span className="tw:block tw:truncate tw:text-base tw:font-bold tw:text-slate-900">
                {doc._labelLbl}
              </span>
              <span className="app-label tw:block tw:truncate tw:text-xs tw:text-slate-400">
                {doc._valueLbl}
              </span>
            </span>

            <span className="runner-profile-badge runner-profile-badge--ok">
              {doc._statusLbl}
            </span>
          </div>
        ))}
      </div>

      <p className="runner-profile-note">
        <Info size={14} className="tw:mt-0.5 tw:shrink-0" />
        {KYC_NOTE_LBL}
      </p>
    </div>
  );
};

export default RunnerProfileKyc;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Runner KYC"),
    },
  ];
}
