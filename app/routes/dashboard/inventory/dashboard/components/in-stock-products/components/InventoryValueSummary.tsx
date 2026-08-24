import {
  IndianRupee,
  BadgeIndianRupee,
  TriangleAlert,
  ChevronRight,
} from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { formatCount, useInventoryValueSummary } from "../../../valueSummary";

const InventoryValueSummary = ({
  onNavigate,
}: {
  onNavigate?: (tab: string, view?: string) => void;
}) => {
  const { summary, loading } = useInventoryValueSummary();

  // Counts are formatted here rather than in the card markup below, so each
  // card carries the exact strings it renders.
  const cards = [
    {
      label: "Inventory Value",
      icon: <IndianRupee size={18} />,
      color: "success" as const,
      bucket: summary.inventory,
      info: "Total value of all stock available in the catalog.",
    },
    {
      label: "Sellable Inventory Value",
      icon: <BadgeIndianRupee size={18} />,
      color: "primary" as const,
      bucket: summary.sellable,
      info: "Value of inventory that can be sold to customers.",
      target: { tab: "products", view: "in_stock" },
    },
    {
      label: "Non Sellable Inventory Value",
      icon: <TriangleAlert size={18} />,
      color: "danger" as const,
      bucket: summary.nonSellable,
      info: "Value of inventory that is not currently sellable.",
      target: { tab: "products", view: "non_sellable" },
    },
  ].map((card) => ({
    ...card,
    _productsLabel: `${formatCount(card.bucket.products)} products`,
    _unitsLabel: `${formatCount(card.bucket.quantity)} units`,
  }));

  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3 tw:mb-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <AppStatsCard key={index} label="" icon="package" color="primary">
            <div className="tw:flex tw:items-center tw:justify-center tw:h-8">
              <AppSpinner size="sm" />
            </div>
          </AppStatsCard>
        ))}
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3 tw:mb-4">
      {cards.map((card) => (
        <AppStatsCard
          key={card.label}
          label={card.label}
          icon={card.target ? <ChevronRight size={18} /> : card.icon}
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
          <div>
            <span className="tw:text-xl tw:lg:text-lg tw:font-bold">
              <Amount value={card.bucket.value} />
            </span>
            <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2 tw:text-[11px] tw:text-gray-500">
              <span>{card._productsLabel}</span>
              <span className="tw:text-gray-300">•</span>
              <span>{card._unitsLabel}</span>
            </div>
          </div>
        </AppStatsCard>
      ))}
    </div>
  );
};

export default InventoryValueSummary;
