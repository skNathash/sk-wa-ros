import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import useScreenView from "~/hooks/useScreenView";
import type { InventorySummary } from "../helper";

const SummaryCards = ({ data }: { data: InventorySummary }) => {
  const { isMobile } = useScreenView();

  if (data.loading) {
    return (
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:lg:grid-cols-4 tw:gap-3 tw:mb-4 tw:items-start">
        {Array.from({ length: 7 }).map((_, i) => (
          <AppStatsCard key={i} label="" icon="package" color="primary">
            <div className="tw:flex tw:items-center tw:justify-center tw:h-8">
              <AppSpinner size="sm" />
            </div>
          </AppStatsCard>
        ))}
      </div>
    );
  }

  const cards: {
    label: string;
    icon?: string;
    color: "primary" | "success" | "warning" | "danger" | "secondary";
    value: React.ReactNode;
    info: string;
  }[] = [
    {
      label: "Total SKUs",
      icon: "package",
      color: "primary",
      info: "All the different items in your shop, even the ones that are out of stock.",
      value: (
        <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
          {data.totalSKUs}
        </span>
      ),
    },
    {
      label: "Inventory Value",
      icon: "indian-rupee",
      color: "success",
      info: "The total money value of all your stock, based on what you paid for it.",
      value: (
        <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
          <Amount value={data.inventoryValue} />
        </span>
      ),
    },
    {
      label: "Fast Moving SKUs",
      icon: "zap",
      color: "success",
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
      label: "Out of Stock SKUs",
      icon: "package",
      color: "danger",
      info: "Items that are finished. You may lose sales until you buy them again.",
      value: (
        <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
          {data.outOfStockSKUs}
        </span>
      ),
    },
    {
      label: "Inventory Turnover",
      color: "secondary",
      info: "Shows how fast your stock sells and gets refilled. A higher number is better.",
      value: (
        <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
          {data.inventoryTurnoverPct}%
        </span>
      ),
    },
    {
      label: "Reserved Items",
      icon: "lock",
      color: "warning",
      info: "Reserve Mode allows customers to place orders for items that are currently out of stock, but have been made available for future fulfillment.",
      value: (
        <span className="tw:text-xl tw:lg:text-sm tw:font-bold">
          {data.reservedSKUs}
        </span>
      ),
    },
  ];

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:lg:grid-cols-4 tw:gap-3 tw:mb-4 tw:items-start">
      {cards.map((card, idx) => (
        <AppStatsCard
          key={idx}
          label={card.label}
          icon={isMobile ? card.icon : undefined}
          color={card.color}
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
