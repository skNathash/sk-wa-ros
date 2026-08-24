import { Pencil } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { PROFILE_FIELDS } from "../../helper";

/**
 * The runner's record — one fact per row, each one editable in place. Rows
 * rather than a form: nothing here changes often, so the screen reads as a
 * card the runner checks, with the pencil as the way in when it is wrong.
 */
export default function InfoList() {
  return (
    <div className="runner-profile-card">
      {PROFILE_FIELDS.map((field) => (
        <div key={field.key} className="runner-profile-row">
          <span className="runner-profile-row-icon">
            <DynamicIcon name={field._iconName as any} size={16} />
          </span>

          <span className="tw:min-w-0 tw:flex-1">
            <span className="app-label tw:block tw:text-slate-400">
              {field._labelLbl}
            </span>
            <span className="tw:block tw:truncate tw:text-base tw:font-semibold tw:text-slate-900">
              {field._valueLbl}
            </span>
          </span>

          <button type="button" className="runner-profile-row-edit">
            <Pencil size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
