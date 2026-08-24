import { ChevronRight } from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import useScreenView from "~/hooks/useScreenView";
import type { InventorySummary } from "../helper";

type SummaryCard = {
  label: string;
  icon?: string;
  color: "primary" | "success" | "warning" | "danger" | "secondary";
  value: React.ReactNode;
  info: string;
  group: "counts" | "movement";
  // When set, the card gets a chevron and taps navigate to this product tab.
  target?: { tab: string; view?: string };
};

const SummaryCards = ({
  data,
  group,
  onNavigate,
}: {
  data: InventorySummary;
  group?: "counts" | "movement";
  onNavigate?: (tab: string, view?: string) => void;
}) => {
  const { isMobile } = useScreenView();

  if (data.loading) {
    return (
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:lg:grid-cols-4 tw:gap-3 tw:mb-4 tw:items-start">
        {Array.from({ length: 4 }).map((_, i) => (
          <AppStatsCard key={i} label="" icon="package" color="primary">
            <div className="tw:flex tw:items-center tw:justify-center tw:h-8">
              <AppSpinner size="sm" />
            </div>
          </AppStatsCard>
        ))}
      </div>
    );
  }

  const cards: SummaryCard[] = [
    {
      label: "Total SKUs",
      icon: "package",
      color: "primary",
      group: "counts",
      info: "All the different items in your shop, even the ones that are out of stock.",
      value: (
        <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
          {data.totalSKUs}
        </span>
      ),
    },
    {
      label: "In Stock SKUs",
      icon: "package-check",
      color: "success",
      group: "counts",
      target: { tab: "products", view: "in_stock" },
      info: "Items that currently have stock on hand.",
      value: (
        <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
          {data.inStockSKUs}
        </span>
      ),
    },
    {
      label: "Out of Stock SKUs",
      icon: "package",
      color: "danger",
      group: "counts",
      target: { tab: "products", view: "out_of_stock" },
      info: "Items that are finished. You may lose sales until you buy them again.",
      value: (
        <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
          {data.outOfStockSKUs}
        </span>
      ),
    },
    {
      label: "Reserved Items",
      icon: "lock",
      color: "warning",
      group: "counts",
      target: { tab: "products", view: "reserve" },
      info: "Reserve Mode allows customers to place orders for items that are currently out of stock, but have been made available for future fulfillment.",
      value: (
        <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
          {data.reservedSKUs}
        </span>
      ),
    },
    {
      label: "Fast Moving SKUs",
      icon: "zap",
      color: "success",
      group: "movement",
      target: { tab: "products", view: "fast_moving" },
      info: "Items that sold in the last 30 days. They sell fast, so keep buying them.",
      value: (
        <div>
          <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
            {data.fastMovingPercentage}%
          </span>
          <span className="tw:text-[11px] tw:text-gray-400 tw:ml-1.5">
            {data.fastMovingSKUs} SKUs
          </span>
        </div>
      ),
    },
    {
      label: "Slow Moving SKUs",
      icon: "box",
      color: "warning",
      group: "movement",
      target: { tab: "products", view: "slow_moving" },
      info: "Items that sold in the last 90 days but not in the last 30 days. They sell slowly.",
      value: (
        <div>
          <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
            {data.slowMovingPercentage}%
          </span>
          <span className="tw:text-[11px] tw:text-gray-400 tw:ml-1.5">
            {data.slowMovingSKUs} SKUs
          </span>
        </div>
      ),
    },
    {
      label: "Non Moving SKUs",
      icon: "pause-circle",
      color: "danger",
      group: "movement",
      target: { tab: "products", view: "non_moving" },
      info: "Items that have not sold at all for a long time.",
      value: (
        <div>
          <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
            {data.nonMovingPercentage}%
          </span>
          <span className="tw:text-[11px] tw:text-gray-400 tw:ml-1.5">
            {data.nonMovingSKUs} SKUs
          </span>
        </div>
      ),
    },
    {
      label: "Inventory Turnover",
      color: "secondary",
      group: "movement",
      info: "Shows how fast your stock sells and gets refilled. A higher number is better.",
      value: (
        <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
          {data.inventoryTurnoverPct}%
        </span>
      ),
    },
  ];

  const visibleCards = group
    ? cards.filter((card) => card.group === group)
    : cards;

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:lg:grid-cols-4 tw:gap-3 tw:mb-4 tw:items-start">
      {visibleCards.map((card, idx) => (
        <AppStatsCard
          key={idx}
          label={card.label}
          icon={
            card.target ? (
              <ChevronRight size={18} />
            ) : isMobile ? (
              card.icon
            ) : undefined
          }
          color={card.color}
          onClick={
            card.target
              ? () => onNavigate?.(card.target!.tab, card.target!.view)
              : undefined
          }
          info={
            <p className="tw:text-xs tw:text-gray-600 tw:max-w-[220px]">
              {card.info}
            </p>
          }
        >
          {card.value}
        </AppStatsCard>
      ))}
    </div>
  );
};

export default SummaryCards;
