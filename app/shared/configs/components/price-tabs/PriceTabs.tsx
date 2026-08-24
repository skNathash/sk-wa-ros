import clsx from "clsx";
import React from "react";
import { useLocation, useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";

/** Manage Price — host of the price sheet. */
const MANAGE_PRICE_PATH = "/configs/rsp";

/** Trend watch — the price-trend view of the same catalogue. */
const PRICE_TREND_PATH = "/configs/rsp/trend";

export type PriceTabKey = "sheet" | "trend" | "b2bScheme" | "priceSlab";

/**
 * Underline tab bar for the pricing screens: Price sheet, plus the B2B-only
 * Scheme and Price Slab entries.
 *
 * The bar owns its navigation: Scheme / Price Slab are separate routes and
 * Price sheet is Manage Price itself, so a screen only says which tab is
 * active. `onChange` is optional and exists for host-side side-effects only.
 *
 * The bar is surface-less — the host block (`.pricing-command-bar`) owns the
 * background and the hairline the underline sits on.
 */
const PriceTabs: React.FC<{
  /** Pricing channel — B2B ("network") adds the Scheme / Price Slab tabs. */
  type: "network" | "customer";
  activeTab: PriceTabKey;
  /** Optional side-effects for the host screen; navigation is handled here. */
  onChange?: (key: PriceTabKey) => void;
  /** Tabs owned by another control on the page (e.g. the channel cards). */
  hiddenKeys?: PriceTabKey[];
  className?: string;
}> = ({ type, activeTab, onChange, hiddenKeys = [], className = "" }) => {
  const appNav = useAppNav();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const tabs: { key: PriceTabKey; label: string }[] = (
    [
      { key: "sheet", label: "Price sheet" },
      { key: "trend", label: "Trend watch" },
      ...(type === "network"
        ? [
            { key: "b2bScheme", label: "B2B Scheme" },
            { key: "priceSlab", label: "Price Slab" },
          ]
        : []),
    ] as { key: PriceTabKey; label: string }[]
  ).filter((tab) => !hiddenKeys.includes(tab.key));

  const handleSelect = (key: PriceTabKey) => {
    if (key === activeTab) return;

    if (key === "b2bScheme") {
      appNav.to("/configs/schemes");
      return;
    }
    if (key === "priceSlab") {
      appNav.to("/configs/price-slab");
      return;
    }

    onChange?.(key);

    if (key === "trend") {
      appNav.to(`${PRICE_TREND_PATH}?type=${type}`);
      return;
    }

    // Already on Manage Price: keep the filters in the URL. Coming from
    // Scheme / Price Slab those params belong to another screen, so the
    // channel is all we carry over.
    const isOnManagePrice = pathname === MANAGE_PRICE_PATH;
    const next = new URLSearchParams(
      isOnManagePrice ? searchParams : undefined,
    );
    next.set("type", type);

    const target = `${MANAGE_PRICE_PATH}?${next.toString()}`;
    if (isOnManagePrice) appNav.replace(target);
    else appNav.to(target);
  };

  return (
    <div className={clsx("tw:overflow-x-auto", className)}>
      {/* `px-1` + the buttons' `px-3` lines the first label up with the 1rem
          gutter of whatever block hosts the bar (e.g. the channel cards). */}
      <div className="tw:flex tw:min-w-max tw:items-center tw:gap-1 tw:px-1">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleSelect(tab.key)}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "tw:relative tw:flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:whitespace-nowrap tw:px-3 tw:py-3 tw:text-sm tw:transition-colors",
                isActive
                  ? "tw:font-semibold tw:text-emerald-700"
                  : "tw:font-medium tw:text-gray-600 tw:hover:text-gray-900",
              )}
            >
              {tab.label}
              {/* Active underline */}
              <span
                className={clsx(
                  "tw:absolute tw:inset-x-2 tw:bottom-0 tw:h-0.5 tw:rounded-full",
                  isActive ? "tw:bg-emerald-600" : "tw:bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PriceTabs;
