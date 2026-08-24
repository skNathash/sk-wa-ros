import { ChevronRight } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import clsx from "clsx";
import { PROFILE_SUPPORT_LINKS, SUPPORT_LBL } from "../../helper";

/**
 * Where the runner goes when something is wrong — help, the rate book, a
 * dispute, and the way out. Sign-out sits in the same list rather than alone
 * at the foot of the screen: it is one more door, and the list is where the
 * runner already looks for one.
 */
export default function Support() {
  return (
    <section>
      <p className="runner-profile-section-lbl">{SUPPORT_LBL}</p>

      <div className="runner-profile-card">
        {PROFILE_SUPPORT_LINKS.map((link) => (
          <button
            key={link.key}
            type="button"
            className="runner-profile-row tw:w-full tw:text-left"
          >
            <span
              className={clsx("runner-profile-row-icon", {
                "runner-profile-row-icon--danger": link._isDanger,
              })}
            >
              <DynamicIcon name={link._iconName as any} size={16} />
            </span>

            <span className="tw:min-w-0 tw:flex-1">
              <span
                className={clsx("tw:block tw:truncate tw:text-base tw:font-semibold", {
                  "tw:text-rose-600": link._isDanger,
                  "tw:text-slate-900": !link._isDanger,
                })}
              >
                {link._labelLbl}
              </span>
              {link._captionLbl && (
                <span className="tw:block tw:truncate tw:text-xs tw:text-slate-400">
                  {link._captionLbl}
                </span>
              )}
            </span>

            <ChevronRight size={17} className="tw:shrink-0 tw:text-slate-300" />
          </button>
        ))}
      </div>
    </section>
  );
}
