import clsx from "clsx";
import React, { useEffect, useMemo } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import SectionTabService from "~/services/SectionTabService";
import VendorNavService from "~/services/VendorNavService";
import { claimActiveSection } from "~/shared/navigation/activeSection";
import { renderSectionIcon } from "~/shared/navigation/sectionIcons";
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

/** First letters of the first two words of the store name (e.g. "SK"). */
const getStoreInitials = () => {
  const name: string = AuthService.getLoggedInUser()?.name || "";
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w.charAt(0).toUpperCase())
    .join("");
  return initials || "SK";
};

/**
 * Vertical side navigation for a top-level section. Renders as a narrow dark
 * teal icon rail: store-initials avatar on top, the tabs from
 * {@link SectionTabService} as icon-over-label items (with an optional red
 * count badge), and a profile avatar pinned to the bottom. Meant for the
 * desktop left rail; on mobile prefer {@link SectionTabs} (horizontal
 * scroller).
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
  const activeKey = useMemo(
    () =>
      SectionTabService.resolveActiveTab(tabs, location.pathname, activeTab),
    [activeTab, tabs, location.pathname],
  );

  // Tell the rest of the shell which top-level section — and which entry inside
  // it — is on screen. The header nav chips highlight the section, and the side
  // panes take their heading from the entry (see useSectionMenuLabel). The
  // section's routes don't all sit under the tab's own path, so neither can be
  // derived from the location alone.
  useEffect(
    () => claimActiveSection(sectionKey, activeKey),
    [sectionKey, activeKey],
  );

  // Consecutive tabs sharing a `group` render under one uppercase heading.
  const groups = useMemo(() => SectionTabService.groupTabs(tabs), [tabs]);

  const handleSelect = async (tab: SectionTab) => {
    if (onSelect) {
      onSelect(tab);
      return;
    }
    // Desktop rail only: "Vendors" jumps straight to a vendor detail page
    // (last opened, else first from the list) instead of the Vendors list —
    // the theme-2 split layout shows the vendor list as a side pane there.
    // if (tab.key === "vendors") {
    //   const redirect = await VendorNavService.resolveVendorsRedirect();
    //   appNav.to(redirect.url, redirect.params);
    //   return;
    // }
    appNav.to(tab.redirect.url, tab.redirect.params);
  };

  const initials = getStoreInitials();

  return (
    <nav
      className={clsx(
        "tw:flex tw:h-full tw:flex-col tw:items-center tw:bg-primary tw:px-1.5 tw:py-3",
        className,
      )}
    >
      {/* Rail is icon-width only — keep the section title for screen readers. */}
      {title && <p className="tw:sr-only">{title}</p>}

      {/* Store-initials avatar (brand mark). */}
      <span className="tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-white/15 tw:text-sm tw:font-semibold tw:text-white">
        {initials}
      </span>

      {/* Grouped rail can outgrow the viewport, so the list itself scrolls and
          the profile avatar stays pinned at the bottom. */}
      <div className="tw:mt-4 tw:flex tw:w-full tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-3 tw:overflow-y-auto tw:[scrollbar-width:none]">
        {groups.map((group, index) => (
          <ul
            key={group.label ?? `ungrouped-${index}`}
            aria-label={group.label}
            className="tw:flex tw:w-full tw:flex-col tw:gap-1"
          >
            {group.label && (
              <li
                aria-hidden="true"
                className="tw:px-1 tw:pt-1 tw:pb-0.5 tw:text-center tw:text-[8px] tw:font-semibold tw:tracking-wider tw:text-white/45 tw:uppercase"
              >
                {group.label}
              </li>
            )}
            {group.tabs.map((tab) => {
              const isActive = tab.key === activeKey;
              const label = tab.langKey ? t(tab.langKey) : tab.label;
              const badge =
                tab.badge !== undefined && tab.badge !== 0 && tab.badge !== ""
                  ? tab.badge
                  : null;
              return (
                <li key={tab.key}>
                  <button
                    type="button"
                    onClick={() => handleSelect(tab)}
                    title={label}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={label}
                    className={clsx(
                      "tw:flex tw:w-full tw:cursor-pointer tw:flex-col tw:items-center tw:gap-0.5 tw:rounded-2xl tw:px-1 tw:py-1.5 tw:transition-colors tw:duration-150",
                      isActive
                        ? "tw:bg-white/20 tw:text-white"
                        : "tw:text-white/70 tw:hover:bg-white/10 tw:hover:text-white",
                    )}
                  >
                    <span className="tw:relative tw:flex tw:h-7 tw:w-10 tw:items-center tw:justify-center">
                      {renderSectionIcon(tab.icon)}
                      {badge !== null && (
                        <span className="tw:absolute tw:-right-1 tw:-top-1 tw:flex tw:h-4 tw:min-w-4 tw:items-center tw:justify-center tw:rounded-full tw:bg-red-500 tw:px-1 tw:text-[10px] tw:font-semibold tw:leading-none tw:text-white">
                          {badge}
                        </span>
                      )}
                    </span>

                    <span
                      className={clsx(
                        "tw:max-w-full tw:px-0.5 tw:text-center tw:text-[9px] tw:leading-tight tw:line-clamp-2 tw:whitespace-normal tw:break-words",
                        isActive ? "tw:font-semibold" : "tw:font-medium",
                      )}
                    >
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ))}
      </div>

      {/* Profile avatar pinned to the bottom of the rail. */}
      <button
        type="button"
        onClick={() => appNav.to("/user/my-profile")}
        aria-label={t("profile", { defaultValue: "Profile" })}
        className="tw:mt-auto tw:flex tw:size-10 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:bg-white/15 tw:text-sm tw:font-semibold tw:text-white tw:transition-colors tw:duration-150 tw:hover:bg-white/25"
      >
        {initials}
      </button>
    </nav>
  );
};

export default SectionMenu;
