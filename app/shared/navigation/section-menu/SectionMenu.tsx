import clsx from "clsx";
import { DynamicIcon } from "lucide-react/dynamic";
import React, { useMemo } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import SectionTabService from "~/services/SectionTabService";
import type { SectionTab, SectionTabKey } from "~/types/CommonTypes";

interface SectionMenuProps {
  /** Which section's tabs to render (bill, business, supply, catalog). */
  sectionKey: SectionTabKey;
  /**
   * Small uppercase heading shown above the menu (e.g. "Manage supply").
   * Omit to render the list without a heading.
   */
  title?: string;
  /**
   * Key of the currently active tab. When omitted the active item is derived
   * from the current location by matching each tab's redirect url.
   */
  activeTab?: string;
  /**
   * Optional override for tab selection. When provided it is called with the
   * selected tab instead of the default redirect navigation.
   */
  onSelect?: (tab: SectionTab) => void;
  className?: string;
}

/**
 * Vertical side navigation for a top-level section. Renders the tabs from
 * {@link SectionTabService} as a stacked list of links with an icon, label and
 * optional badge, highlighting the active item. Meant for the desktop left
 * rail; on mobile prefer {@link SectionTabs} (horizontal scroller).
 */
const SectionMenu: React.FC<SectionMenuProps> = ({
  sectionKey,
  title,
  activeTab,
  onSelect,
  className = "",
}) => {
  const appNav = useAppNav();
  const location = useLocation();
  const { t } = useTranslation(["common"]);

  const tabs = useMemo(() => {
    const sectionTabs = SectionTabService.getTabs(sectionKey);
    return sectionTabs.filter((tab) =>
      tab.rbac ? AuthService.isRbacEnabled(tab.rbac) : true,
    );
  }, [sectionKey]);

  // Prefer the explicit active key; otherwise match the longest redirect url
  // that prefixes the current pathname so nested routes stay highlighted.
  const activeKey = useMemo(() => {
    if (activeTab) return activeTab;

    let matchKey: string | undefined;
    let matchLen = -1;
    for (const tab of tabs) {
      const url = tab.redirect.url;
      if (location.pathname.startsWith(url) && url.length > matchLen) {
        matchKey = tab.key;
        matchLen = url.length;
      }
    }
    return matchKey;
  }, [activeTab, tabs, location.pathname]);

  const handleSelect = (tab: SectionTab) => {
    if (onSelect) {
      onSelect(tab);
      return;
    }
    appNav.to(tab.redirect.url, tab.redirect.params);
  };

  const renderIcon = (icon: SectionTab["icon"]) => {
    if (!icon) return null;
    if (typeof icon === "string") {
      return <DynamicIcon size={18} name={icon as any} />;
    }
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, { size: 18 } as any);
    }
    return icon;
  };

  return (
    <nav
      className={clsx(
        "tw:flex tw:h-full tw:flex-col tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-2 tw:shadow-sm",
        className,
      )}
    >
      {title && (
        <p className="tw:px-3 tw:pb-2.5 tw:pt-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-slate-400">
          {title}
        </p>
      )}

      <ul className="tw:flex tw:flex-col tw:gap-0.5">
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <li key={tab.key}>
              <button
                type="button"
                onClick={() => handleSelect(tab)}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "tw:group tw:relative tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-lg tw:py-1.5 tw:pl-3 tw:pr-2.5 tw:text-sm tw:transition-colors tw:duration-150 tw:cursor-pointer",
                  isActive
                    ? "tw:bg-primary/8 tw:text-primary tw:font-semibold"
                    : "tw:text-slate-600 tw:font-medium tw:hover:bg-slate-50",
                )}
              >
                {/* Selected-row accent: a teal edge bar, like WhatsApp's active chat. */}
                <span
                  aria-hidden
                  className={clsx(
                    "tw:absolute tw:left-0 tw:top-1/2 tw:-translate-y-1/2 tw:w-1 tw:rounded-r-full tw:bg-primary tw:transition-all tw:duration-200",
                    isActive
                      ? "tw:h-6 tw:opacity-100"
                      : "tw:h-0 tw:opacity-0 tw:group-hover:h-3 tw:group-hover:opacity-40",
                  )}
                />

                {/* Circular icon "avatar" — the chat-list signature. */}
                <span
                  className={clsx(
                    "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:transition-colors tw:duration-150",
                    isActive
                      ? "tw:bg-primary tw:text-white tw:shadow-sm"
                      : "tw:bg-slate-100 tw:text-slate-500 tw:group-hover:bg-primary/10 tw:group-hover:text-primary",
                  )}
                >
                  {renderIcon(tab.icon)}
                </span>

                <span className="tw:flex-1 tw:truncate tw:text-left">
                  {tab.langKey ? t(tab.langKey) : tab.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SectionMenu;
