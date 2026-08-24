import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import { AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";
import {
  getSettingsEntryByPath,
  groupSettingsEntries,
  masterLoginAllowedSettings,
  settingsEntries,
  type SettingsEntry,
} from "./helper";

interface SettingsSidePaneProps {
  /** Extra classes merged onto the underlying {@link AppPaneSide}. */
  className?: string;
  /**
   * Key of the entry to highlight. Omit to derive it from the current path —
   * only pages that live outside their entry's own url need to pass it.
   */
  activeKey?: string;
}

/**
 * Side column for the settings section: the settings menu itself.
 *
 * Settings is a Profile tab, so the left rail beside this pane stays the
 * profile rail and this pane carries the navigation between the individual
 * config pages ({@link settingsEntries}). Rendered inside the theme-2 split
 * layout only — the settings index page lists the same destinations as cards
 * for the other themes.
 */
const SettingsSidePane = ({
  className = "",
  activeKey,
}: SettingsSidePaneProps) => {
  const appNav = useAppNav();
  const location = useLocation();
  const toast = useAppToast();
  const { t } = useTranslation(["common"]);

  const entries = useMemo(
    () =>
      settingsEntries.filter(
        (entry) =>
          AuthService.isMasterLogin() || AuthService.isRbacEnabled(entry.rbac),
      ),
    [],
  );

  const groups = useMemo(() => groupSettingsEntries(entries), [entries]);

  const activeEntryKey =
    activeKey ?? getSettingsEntryByPath(location.pathname)?.key;

  const handleSelect = (entry: SettingsEntry) => {
    // A master login is impersonating the store — it may only open the pages
    // it is explicitly allowed to, unless it carries full access.
    if (
      AuthService.isMasterLogin() &&
      !AuthService.isMasterLoginWithFullAccess() &&
      !masterLoginAllowedSettings.includes(entry.key)
    ) {
      toast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    appNav.to(entry.path);
  };

  return (
    <AppPaneSide className={clsx("app-pane-only", className)}>
      <div className="tw:flex tw:flex-col tw:gap-4">
        <div>
          <PaneTitle title={t("settings.title")} />
          <p className="tw:mt-1 tw:text-xs tw:text-slate-500">
            App &amp; store preferences
          </p>
        </div>

        {groups.map((group) => (
          <div key={group.label}>
            <p className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
              {group.label}
            </p>
            <div className="app-bleed-x tw:mt-2 tw:flex tw:flex-col tw:divide-y tw:divide-slate-200 tw:border-y tw:border-slate-200">
              {group.entries.map((entry) => {
                const Icon = entry.icon;
                const active = entry.key === activeEntryKey;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => handleSelect(entry)}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:px-4 tw:py-2.5 tw:text-left tw:transition-colors",
                      active
                        ? "tw:bg-primary/10"
                        : "tw:bg-white tw:hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={clsx(
                        "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg",
                        entry.accent,
                      )}
                    >
                      <Icon className="tw:h-4 tw:w-4" />
                    </span>
                    <span className="tw:min-w-0 tw:flex-1">
                      <span
                        className={clsx(
                          "tw:block tw:truncate tw:text-sm tw:font-semibold tw:leading-tight",
                          active ? "tw:text-primary" : "tw:text-slate-800",
                        )}
                      >
                        {t(entry.labelLangKey, { defaultValue: entry.label })}
                      </span>
                      <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
                        {t(entry.descriptionLangKey, {
                          defaultValue: entry.description,
                        })}
                      </span>
                    </span>
                    <ChevronRight
                      size={16}
                      className={clsx(
                        "tw:shrink-0",
                        active ? "tw:text-primary" : "tw:text-slate-400",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AppPaneSide>
  );
};

export default SettingsSidePane;
