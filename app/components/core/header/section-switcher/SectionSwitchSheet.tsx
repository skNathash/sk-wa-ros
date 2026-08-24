import clsx from "clsx";
import { Check, ChevronRight, MoreHorizontal, X } from "lucide-react";
import { Fragment, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { EVENTS } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import MiscService from "~/services/MiscService";
import SectionTabService from "~/services/SectionTabService";
import { renderSectionIcon } from "~/shared/navigation/sectionIcons";
import type { SectionTab, SectionTabKey } from "~/types/CommonTypes";

interface SectionSwitchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which section's tabs to list (bill, business, supply, catalog). */
  sectionKey: SectionTabKey;
  /** Active tab key; derived from the current route when omitted. */
  activeTab?: string;
  /**
   * Live counts keyed by tab key, merged over the static `badge` on the tab
   * config (e.g. `{ "receive-stock": 2 }`).
   */
  badges?: Record<string, number | string | undefined>;
}

/**
 * theme-2 mobile "switch section" sheet — the full list of destinations inside
 * the current section ({@link SectionTabService}), opened from the header
 * title. Each row shows the icon, the label (with the translated label beside
 * it when the app is not in English), a one-line description and an optional
 * count badge; the active row is highlighted with a check.
 *
 * A trailing "More" row hands off to the account/side menu
 * ({@link Theme2SideMenu}) via `EVENTS.OPEN_APP_MENU`.
 */
const SectionSwitchSheet = ({
  open,
  onOpenChange,
  sectionKey,
  activeTab,
  badges,
}: SectionSwitchSheetProps) => {
  const appNav = useAppNav();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const meta = SectionTabService.getMeta(sectionKey);
  /** What to run once the sheet has finished animating out. */
  const pendingAction = useRef<(() => void) | null>(null);

  const tabs = useMemo(
    () =>
      SectionTabService.getTabs(sectionKey).filter((tab) =>
        tab.rbac ? AuthService.isRbacEnabled(tab.rbac) : true,
      ),
    [sectionKey],
  );

  const activeKey = SectionTabService.resolveActiveTab(
    tabs,
    location.pathname,
    activeTab,
  );

  // Consecutive tabs sharing a `group` sit under one uppercase heading row.
  const groups = useMemo(() => SectionTabService.groupTabs(tabs), [tabs]);

  /**
   * Translated label shown next to the English one. Skipped in English and
   * whenever the key has no translation (i18next echoes the key back) or the
   * translation is identical to the label.
   */
  const nativeLabel = (tab: SectionTab) => {
    if (!tab.langKey || i18n.language === "en") return null;
    const translated = t(tab.langKey);
    if (!translated || translated === tab.langKey || translated === tab.label) {
      return null;
    }
    return translated;
  };

  /**
   * Closes the sheet and defers `action` to {@link runPendingAction} — running
   * it right away would navigate mid-animation and make the sheet jump away
   * instead of sliding out.
   */
  const closeThen = (action: () => void) => {
    pendingAction.current = action;
    onOpenChange(false);
  };

  /**
   * Fired by Radix once the sheet has fully closed (exit animation done, focus
   * being restored), so the redirect lands after the sheet is gone.
   */
  const runPendingAction = (event: Event) => {
    const action = pendingAction.current;
    pendingAction.current = null;
    if (!action) return;
    // Focus is about to move with the route change anyway.
    event.preventDefault();
    action();
  };

  const handleSelect = (tab: SectionTab) =>
    closeThen(() => appNav.to(tab.redirect.url, tab.redirect.params));

  const handleMore = () =>
    closeThen(() => MiscService.createEvent(EVENTS.OPEN_APP_MENU, null));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        onCloseAutoFocus={runPendingAction}
        // `overflow-hidden` is what makes the bottom radius stick: the rows are
        // opaque white buttons with square corners and would otherwise paint
        // over the curve, leaving a white rectangle under the sheet.
        className="section-switch-sheet tw:gap-0 tw:overflow-hidden tw:rounded-b-3xl tw:border-b-0 tw:p-0"
      >
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:pt-4 tw:pb-3">
          <div className="tw:min-w-0">
            <p className="tw:text-[11px] tw:font-semibold tw:tracking-wider tw:text-gray-400 tw:uppercase">
              Switch section
            </p>
            <SheetTitle className="tw:mt-0.5 tw:text-base tw:font-semibold tw:text-gray-900">
              {meta.prompt}
            </SheetTitle>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="tw:flex tw:size-9 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:text-gray-500"
          >
            <X className="tw:size-4" />
          </button>
        </div>

        <ul className="tw:max-h-[70vh] tw:overflow-y-auto tw:pb-2">
          {groups.map((group, index) => (
            <Fragment key={group.label ?? `ungrouped-${index}`}>
              {group.label && (
                <li className="tw:bg-white tw:px-4 tw:pt-3 tw:pb-1 tw:text-[11px] tw:font-semibold tw:tracking-wider tw:text-gray-400 tw:uppercase">
                  {group.label}
                </li>
              )}
              {group.tabs.map((tab) => {
                const isActive = tab.key === activeKey;
                const badge = badges?.[tab.key] ?? tab.badge;
                const showBadge =
                  badge !== undefined &&
                  badge !== null &&
                  badge !== 0 &&
                  badge !== "";
                const native = nativeLabel(tab);

                return (
                  <li key={tab.key}>
                    <button
                      type="button"
                      onClick={() => handleSelect(tab)}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3 tw:text-left",
                        isActive ? "tw:bg-primary/10" : "tw:bg-white",
                      )}
                    >
                      <span
                        className={clsx(
                          "tw:relative tw:flex tw:size-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full",
                          isActive
                            ? "tw:bg-primary tw:text-white"
                            : "tw:bg-gray-100 tw:text-gray-600",
                        )}
                      >
                        {renderSectionIcon(tab.icon)}
                        {showBadge && (
                          <span className="tw:absolute tw:-top-0.5 tw:-right-0.5 tw:flex tw:h-4 tw:min-w-4 tw:items-center tw:justify-center tw:rounded-full tw:bg-red-500 tw:px-1 tw:text-[10px] tw:leading-none tw:font-semibold tw:text-white">
                            {badge}
                          </span>
                        )}
                      </span>

                      <span className="tw:min-w-0 tw:flex-1">
                        <span className="tw:flex tw:items-baseline tw:gap-1.5">
                          <span className="tw:truncate tw:text-base tw:font-semibold tw:text-gray-900">
                            {tab.label}
                          </span>
                          {native && (
                            <span className="tw:truncate tw:text-xs tw:text-gray-400">
                              {native}
                            </span>
                          )}
                        </span>
                        {tab.description && (
                          <span className="tw:mt-0.5 tw:block tw:truncate tw:text-xs tw:text-gray-500">
                            {tab.description}
                          </span>
                        )}
                      </span>

                      {isActive ? (
                        <Check className="tw:text-primary tw:size-5 tw:shrink-0" />
                      ) : (
                        <ChevronRight className="tw:size-5 tw:shrink-0 tw:text-gray-300" />
                      )}
                    </button>
                  </li>
                );
              })}
            </Fragment>
          ))}

          {/* Everything outside the section lives in the account menu. */}
          <li>
            <button
              type="button"
              onClick={handleMore}
              className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:bg-white tw:px-4 tw:py-3 tw:text-left"
            >
              <span className="tw:flex tw:size-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100 tw:text-gray-600">
                <MoreHorizontal size={20} />
              </span>
              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:block tw:text-base tw:font-semibold tw:text-gray-900">
                  More
                </span>
                <span className="tw:mt-0.5 tw:block tw:truncate tw:text-xs tw:text-gray-500">
                  Settings & profile
                </span>
              </span>
              <ChevronRight className="tw:size-5 tw:shrink-0 tw:text-gray-300" />
            </button>
          </li>
        </ul>
      </SheetContent>
    </Sheet>
  );
};

export default SectionSwitchSheet;
