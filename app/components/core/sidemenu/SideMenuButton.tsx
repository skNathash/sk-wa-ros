import React from "react";
import { Link, useLocation } from "react-router";
import { ChevronDown } from "lucide-react";
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import useAppToast from "~/hooks/useAppToast";
import MiscService from "~/services/MiscService";
import type { MenuItem } from "~/types/CommonTypes";

type Props = {
  item: MenuItem;
  tMenu: (k: string) => string;
  className?: string;
  hideIcon?: boolean;
  setOpenMobile?: (open: boolean) => void;
  disabled?: boolean;
  hasActivePlan?: boolean;
  hasSubscribedToAnyDeal?: boolean;
  isFranchiseProfileComplete?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
};

export default function SideMenuButton({
  item,
  tMenu,
  className,
  hideIcon = false,
  setOpenMobile,
  disabled = false,
  hasActivePlan = true,
  hasSubscribedToAnyDeal = true,
  isFranchiseProfileComplete = true,
  isExpanded = false,
  onToggleExpand,
}: Props) {
  const Icon = item.icon;
  const location = useLocation();

  // Check if this is a parent item with children
  const isParentItem = !!(item.children && item.children.length > 0);

  // Check if the current menu item is active based on the URL
  const isActive = React.useMemo(() => {
    if (!item.path) return false;

    const normalizePath = (path: string) => {
      return path.split("?")[0].split("#")[0].replace(/\/$/, "");
    };
    const currentPath = normalizePath(location.pathname);
    const [itemPathOnly, itemQuery] = item.path.split("#")[0].split("?");
    const menuPath = normalizePath(itemPathOnly);

    const pathMatches =
      currentPath === menuPath ||
      (currentPath.startsWith(menuPath) &&
        (currentPath[menuPath.length] === "/" ||
          !currentPath[menuPath.length]));

    if (!pathMatches) return false;

    // When menu path carries query params, require exact match on those keys
    // so siblings sharing a pathname (e.g. assisted=true) don't both activate.
    if (itemQuery) {
      const current = new URLSearchParams(location.search);
      const required = new URLSearchParams(itemQuery);
      const requiredKeys = new Set<string>();
      for (const [k, v] of required) {
        requiredKeys.add(k);
        if (current.get(k) !== v) return false;
      }
      // Reject if current URL defines a flag the menu omits (distinguishes siblings)
      for (const k of current.keys()) {
        if (!requiredKeys.has(k) && k === "assisted") return false;
      }
    }

    return true;
  }, [item.path, location.pathname, location.search]);

  const appToast = useAppToast();

  const itemCount = (item as any).count;
  const hasCount = typeof itemCount === "number" && itemCount > 0;
  const isNew = !!item.isNew;
  const newBadge = isNew ? (
    <span className="tw:inline-flex tw:items-center tw:rounded-sm tw:bg-primary/10 tw:px-1 tw:py-px tw:text-[9px] tw:font-bold tw:leading-none tw:tracking-wide tw:text-primary tw:uppercase">
      New
    </span>
  ) : null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hasActivePlan) {
      e.preventDefault();
      e.stopPropagation();
      appToast.show({
        msg: "This feature is disabled because no active plan is available.",
        color: "danger",
      });
      return;
    }
    if (disabled) {
      e.preventDefault();
      e.stopPropagation();
      if (!isFranchiseProfileComplete) {
        appToast.show({
          msg: "Please complete your profile to access this page",
          color: "danger",
        });
      } else {
        appToast.show({
          msg: "Please subscribe to any deal to access this page",
          color: "danger",
        });
      }
      return;
    }
    if (!MiscService.isDesktopView()) {
      const t = setTimeout(() => {
        setOpenMobile?.(false);
        clearTimeout(t);
      }, 300);
    }
  };

  const handleParentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleExpand?.();
  };

  return (
    <SidebarMenuItem
      className={`tw:py-0.5 ${className}`}
      key={item.id || item.label}
    >
      <SidebarMenuButton
        asChild={!!item.path && !isParentItem}
        isActive={isActive}
        onClick={isParentItem ? handleParentClick : undefined}
        className={`tw:font-normal ${isParentItem ? "tw:cursor-pointer" : ""}`}
      >
        {item.path && !isParentItem ? (
          <Link
            to={item.path}
            className={`tw:flex tw:items-center tw:gap-2 tw:w-full ${
              disabled ? "tw:opacity-40" : ""
            }`}
            onClick={handleClick}
          >
            {Icon && !hideIcon && (
              <Icon
                className="tw:w-3.5 tw:h-3.5 tw:opacity-60"
                aria-hidden="true"
              />
            )}
            <span className="tw:flex tw:items-center tw:justify-between tw:flex-1 tw:gap-2">
              <span className="tw:flex tw:items-center tw:gap-1 tw:min-w-0">
                <span className="tw:truncate">
                  {item.langKey ? tMenu(item.langKey) : item.label}
                </span>
                {newBadge}
              </span>
              {hasCount && (
                <SidebarMenuBadge className="tw:bg-gray-100 tw:shrink-0">
                  {itemCount}
                </SidebarMenuBadge>
              )}
            </span>
          </Link>
        ) : (
          <div
            className={`tw:flex tw:items-center tw:gap-2 tw:w-full ${disabled ? "tw:opacity-40" : ""}`}
          >
            {Icon && !hideIcon && (
              <span>
                <Icon className="tw:w-3.5 tw:h-3.5 tw:opacity-60" />
              </span>
            )}
            <span
              className={`tw:flex tw:items-center tw:justify-between tw:flex-1 tw:gap-2`}
            >
              <span className="tw:flex tw:items-center tw:gap-1 tw:min-w-0">
                <span className="tw:truncate">
                  {item.langKey ? tMenu(item.langKey) : item.label}
                </span>
                {newBadge}
              </span>
              <span className="tw:flex tw:items-center tw:gap-1 tw:shrink-0">
                {hasCount && (
                  <SidebarMenuBadge className="tw:bg-gray-100">
                    {itemCount}
                  </SidebarMenuBadge>
                )}
                {isParentItem && (
                  <ChevronDown
                    className={`tw:h-3.5 tw:w-3.5 tw:opacity-60 tw:transition-transform tw:duration-200 ${
                      isExpanded ? "tw:rotate-180" : ""
                    }`}
                  />
                )}
              </span>
            </span>
          </div>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
