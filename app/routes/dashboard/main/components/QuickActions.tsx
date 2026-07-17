import useAppNav from "~/hooks/useAppNav";
import { quickActions } from "../data";
import { actionAccent, actionIcon } from "./actionIcons";

/** Desktop left-rail quick actions list with keyboard shortcut hints. */
const QuickActions = () => {
  const appNav = useAppNav();

  return (
    <div className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      <p className="tw:mb-3 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        Quick actions
      </p>
      <ul className="tw:space-y-1">
        {quickActions.map((action) => {
          const Icon = actionIcon[action.icon];
          return (
            <li key={action.key}>
              <button
                type="button"
                onClick={() => appNav.to(action.to)}
                className="tw:group tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:px-2 tw:py-2 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
              >
                <span
                  className={`tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-lg ${actionAccent[action.icon]}`}
                >
                  <Icon className="tw:h-4.5 tw:w-4.5" />
                </span>
                <span className="tw:flex-1 tw:text-sm tw:font-semibold tw:text-slate-700">
                  {action.label}
                </span>
                {action.shortcut && (
                  <kbd className="tw:rounded tw:border tw:border-slate-200 tw:bg-slate-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:text-slate-400">
                    {action.shortcut}
                  </kbd>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default QuickActions;
