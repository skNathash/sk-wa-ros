import { Switch } from "~/components/ui/switch";
import { PREFERENCES_LBL, PROFILE_PREFERENCES } from "../../helper";

/**
 * The terms the runner works on. Each one is a switch rather than a setting
 * behind a screen: they are flipped between shifts, so they have to be one tap
 * from the profile.
 */
export default function Preferences() {
  return (
    <section>
      <p className="runner-profile-section-lbl">{PREFERENCES_LBL}</p>

      <div className="runner-profile-card">
        {PROFILE_PREFERENCES.map((pref) => (
          <label key={pref.key} className="runner-profile-row">
            <span className="tw:min-w-0 tw:flex-1 tw:text-base tw:font-medium tw:text-slate-900">
              {pref._labelLbl}
            </span>

            <Switch defaultChecked={pref.isOn} className="runner-profile-switch" />
          </label>
        ))}
      </div>
    </section>
  );
}
