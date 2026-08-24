import clsx from "clsx";
import { Briefcase, Sparkles, TrendingUp, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import SellerCatalogService from "~/services/SellerCatalogService";

export type PricingChannelKey = "customer" | "network" | "electronics";

/** Catalogue views the pill row can switch between on mobile. */
export type PricingViewTab = "sheet" | "trend";

/** Manage Price — the B2C / B2B channels are views of this screen. */
const MANAGE_PRICE_PATH = "/configs/rsp";

/** Electronics · CLUB match — its own screen under Manage Price. */
const ELECTRONICS_PATH = "/configs/rsp/electronics";

/** Trend watch — the price-trend view of the same catalogue. */
const PRICE_TREND_PATH = "/configs/rsp/trend";

/** Screens this switcher navigates between — moving between them replaces. */
const PRICING_VIEW_PATHS = [MANAGE_PRICE_PATH, ELECTRONICS_PATH];

export interface PricingChannelCallbackArgs {
  action: "change";
  data: { key: PricingChannelKey; label: string };
}

interface PricingChannelCardsProps {
  activeKey: PricingChannelKey;
  /** Optional side-effects for the host screen; navigation is handled here. */
  callback?: (args: PricingChannelCallbackArgs) => void;
  className?: string;
  /** Visual template — `card` (default) shows the full channel cards; `tab` renders a compact tab bar. */
  variant?: "card" | "tab";
  /**
   * Which pricing view the host screen is — set this to append the view tabs
   * (currently just Trend watch) to the pill row, so they share this row's
   * single scroll container instead of stacking a second strip under it.
   *
   * Only drawn on mobile, where there is no underline tab row: the desktop
   * screens render their own {@link PriceTabs} bar instead. Omit on screens
   * that are not a view of the catalogue.
   */
  viewTab?: PricingViewTab;
}

interface ChannelCard {
  key: PricingChannelKey;
  label: string;
  /** Compact label used in the mobile tab variant. */
  shortLabel?: string;
  description: string;
  icon: ReactNode;
  /** Deals counted for this channel — undefined until the count lands. */
  count?: number;
  /** Small red pill beside the label. */
  badge?: number;
}

/**
 * Channel switcher shared by the pricing screens (Manage Price, B2B Schemes,
 * B2B Price Slab): B2C · CLUB app, B2B · Retailers and the Electronics online
 * price-match view.
 *
 * The cards are owned by this component: screens only say which one is active,
 * and switching channels navigates to the matching Manage Price view from here
 * so every pricing screen behaves the same. `callback` is only for host-side
 * side-effects (e.g. resetting a filter) — it is not required.
 *
 * The B2C/B2B counts are the deals already carrying a price on that channel,
 * fetched here so every screen shows the same figures; the electronics figure
 * comes from the same price-comparison count API the Electronics sheet uses.
 */
const PricingChannelCards = ({
  activeKey,
  callback,
  className = "",
  variant = "card",
  viewTab,
}: PricingChannelCardsProps) => {
  const appNav = useAppNav();
  const { pathname } = useLocation();
  const { isMobile } = useScreenView();

  const [counts, setCounts] = useState<{
    customer?: number;
    network?: number;
    electronics?: { all?: number; above?: number };
  }>({});

  useEffect(() => {
    let cancelled = false;

    // Priced-deal counts per channel. Failures stay silent — the cards simply
    // render without a figure rather than blocking the screen.
    const fetchCounts = async () => {
      const getChannelCount = async (field: string) => {
        try {
          const response = await SellerCatalogService.getProducts({
            outputType: "count",
            filter: { [`${field}.price`]: { $gt: 0 } },
          });
          return response?.data?.count ?? undefined;
        } catch {
          return undefined;
        }
      };

      const getElectronicsCounts = async () => {
        try {
          const base = {
            distance: 15,
            priceType: "b2c",
            onlinePriceExist: true,
            outputType: "count",
          };

          const [total, above] = await Promise.all([
            SellerCatalogService.getPriceComparison(base),
            SellerCatalogService.getPriceComparison({
              ...base,
              type: "aboveOnlinePrice",
            }),
          ]);

          return {
            all: total?.data?.count || 0,
            above: above?.data?.count || 0,
          };
        } catch {
          return undefined;
        }
      };

      const [customer, network, electronics] = await Promise.all([
        getChannelCount("customerSellingPrice"),
        getChannelCount("networkSellingPrice"),
        getElectronicsCounts(),
      ]);

      if (!cancelled) setCounts({ customer, network, electronics });
    };

    fetchCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards: ChannelCard[] = [
    {
      key: "customer",
      label: "B2C · Customer",
      shortLabel: "B2C",
      description: "Sell to customers via CLUB / POS",
      icon: <UserRound size={18} />,
      count: counts.customer,
    },
    {
      key: "network",
      label: "B2B · Customer",
      shortLabel: "B2B",
      description: "Sell to other retailers & group retailers",
      icon: <Briefcase size={18} />,
      count: counts.network,
    },
    {
      key: "electronics",
      label: "Electronics",
      description: "CLUB · Amazon · Flipkart · JioMart match",
      icon: <Sparkles size={18} />,
      count: counts.electronics?.all,
      badge: counts.electronics?.above,
    },
  ];

  // Electronics is its own screen — the online price match only exists for
  // B2C, so it carries no channel of its own.
  const getTarget = (key: PricingChannelKey) =>
    key === "electronics"
      ? ELECTRONICS_PATH
      : `${MANAGE_PRICE_PATH}?type=${key}`;

  const handleSelect = (card: ChannelCard) => {
    // Re-tapping the live channel is a no-op only on the screen it leads to.
    // From Trend watch / Scheme / Price Slab it is the way back to that
    // channel's sheet — on mobile it is the only way back.
    if (card.key === activeKey && PRICING_VIEW_PATHS.includes(pathname)) return;

    callback?.({
      action: "change",
      data: { key: card.key, label: card.label },
    });

    // Switching between the pricing views shouldn't stack up history entries;
    // arriving from Scheme / Price Slab should.
    const target = getTarget(card.key);
    if (PRICING_VIEW_PATHS.includes(pathname)) appNav.replace(target);
    else appNav.to(target);
  };

  // The view tabs only exist on mobile — desktop carries the view in its own
  // underline tab row (see PriceTabs).
  const showViewTabs = variant === "tab" && isMobile && viewTab !== undefined;

  // Trend watch has no channel of its own: Electronics is a B2C view, so it
  // trends against the customer price.
  const viewChannel = activeKey === "electronics" ? "customer" : activeKey;

  // The strip reads as a single tab group, so exactly one pill in it is ever
  // lit. On Trend watch the channel pills stand down — but they stay live,
  // since tapping one is the only way back to that channel's sheet on mobile.
  const trendActive = showViewTabs && viewTab === "trend";

  if (variant === "tab") {
    return (
      <div
        role="tablist"
        aria-label="Pricing channel"
        className={clsx(
          "tw:flex tw:gap-1 tw:overflow-x-auto tw:pb-1 hide-scrollbar",
          className,
        )}
      >
        {cards.map((card) => {
          const isActive = !trendActive && card.key === activeKey;

          return (
            <button
              key={card.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelect(card)}
              className={clsx(
                "tw:flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-full tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:transition-colors",
                isActive
                  ? "tw:bg-primary tw:text-white"
                  : // Resting tabs sit on a soft grey fill rather than an
                    // outlined white pill — only the active channel carries ink.
                    "tw:bg-gray-100 tw:text-gray-700 hover:tw:bg-gray-200",
              )}
            >
              <span className={isActive ? "tw:text-white" : "tw:text-gray-400"}>
                {card.icon}
              </span>
              <span>{card.shortLabel || card.label}</span>
            </button>
          );
        })}

        {/* One more pill in the same strip, carrying the channel pills'
            styling exactly so the row reads — and scrolls — as one control. */}
        {showViewTabs ? (
          <button
            type="button"
            onClick={() => {
              if (trendActive) return;
              appNav.to(`${PRICE_TREND_PATH}?type=${viewChannel}`);
            }}
            aria-current={trendActive ? "page" : undefined}
            className={clsx(
              "tw:flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-full tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:whitespace-nowrap tw:transition-colors",
              trendActive
                ? "tw:bg-primary tw:text-white"
                : "tw:border tw:border-gray-200 tw:bg-white tw:text-gray-700 hover:tw:bg-gray-50",
            )}
          >
            <span className={trendActive ? "tw:text-white" : "tw:text-gray-400"}>
              <TrendingUp size={16} />
            </span>
            Trend watch
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Pricing channel"
      // Cards keep a readable min width, so narrow screens scroll the row
      // instead of squeezing the descriptions into unreadable columns.
      className={clsx(
        "tw:flex tw:gap-3 tw:overflow-x-auto tw:pb-1 tw:md:overflow-visible tw:md:pb-0",
        className,
      )}
    >
      {cards.map((card) => {
        const isActive = card.key === activeKey;

        return (
          <button
            key={card.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(card)}
            className={clsx(
              "tw:flex tw:min-w-[16rem] tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-2xl tw:border tw:px-4 tw:py-3 tw:text-left tw:transition-all tw:md:min-w-0 tw:md:flex-1 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-[color-mix(in_srgb,var(--primary)_45%,transparent)]",
              isActive
                ? "tw:border-transparent tw:bg-primary tw:shadow-md"
                : "tw:border-gray-200 tw:bg-gray-50 hover:tw:border-gray-300 hover:tw:bg-white",
            )}
          >
            <span
              className={clsx(
                "tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl",
                isActive ? "tw:bg-white/20 tw:text-white" : "tw:text-gray-400",
              )}
            >
              {card.icon}
            </span>

            <span className="tw:min-w-0 tw:flex-1">
              <span className="tw:flex tw:items-center tw:gap-1.5">
                <span
                  className={clsx(
                    "tw:truncate tw:text-sm tw:font-bold",
                    isActive ? "tw:text-white" : "tw:text-gray-900",
                  )}
                >
                  {card.label}
                </span>
                {card.badge ? (
                  <span className="tw:flex tw:h-4 tw:min-w-4 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-red-500 tw:px-1 tw:text-[10px] tw:font-semibold tw:leading-none tw:text-white">
                    {card.badge}
                  </span>
                ) : null}
              </span>

              <span
                className={clsx(
                  "tw:mt-0.5 tw:block tw:truncate tw:text-xs",
                  isActive ? "tw:text-white/80" : "tw:text-gray-500",
                )}
              >
                {card.description}
              </span>
            </span>

            {card.count !== undefined ? (
              <span
                className={clsx(
                  "tw:shrink-0 tw:text-lg tw:font-bold",
                  isActive ? "tw:text-white" : "tw:text-gray-900",
                )}
              >
                {card.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

export default PricingChannelCards;
