import clsx from "clsx";
import {
  ChevronRight,
  Layers,
  Store,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import { getPackSize } from "../helper";

export interface SubscribePricingPanelProps {
  /** Formatted subscribe deal (see InventorySubscribeService.formatDealResponse). */
  deal: any;
  /** Opens the subscribe catalog filtered by the taxonomy chip that was tapped. */
  onFilter?: (type: "brand" | "category" | "menu" | "company") => void;
  className?: string;
}

/** One stat tile — label on top, the headline figure, then a context line. */
const Tile = ({
  label,
  children,
  footer,
  className,
}: {
  label: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={clsx(
      "tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3",
      className,
    )}
  >
    <span className="app-section-label tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
      {label}
    </span>

    <div className="tw:mt-1.5 tw:text-2xl tw:font-bold tw:leading-none tw:text-slate-900">
      {children}
    </div>

    {footer && (
      <div className="tw:mt-1.5 tw:text-[11px] tw:leading-snug tw:text-slate-500">
        {footer}
      </div>
    )}
  </div>
);

/** One taxonomy pill in the band under the tiles — tapping it re-opens the
 *  catalog scoped to that brand / category / menu / company. */
const FilterChip = ({
  icon: Icon,
  label,
  tone = "default",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tone?: "default" | "company";
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "tw:inline-flex tw:max-w-full tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-full tw:border tw:py-1 tw:pl-2.5 tw:pr-1.5 tw:text-xs tw:font-semibold tw:transition-colors",
      tone === "company"
        ? "tw:border-orange-200 tw:bg-orange-50 tw:text-orange-700 tw:hover:bg-orange-100"
        : "tw:border-slate-200 tw:bg-white tw:text-slate-700 tw:hover:border-primary tw:hover:text-primary",
    )}
  >
    <Icon size={13} className="tw:shrink-0" />
    <span className="tw:truncate">{label}</span>
    <ChevronRight size={13} className="tw:shrink-0 tw:opacity-60" />
  </button>
);

/**
 * Pricing panel for the subscribe detail page — the mirror of the seller's own
 * item page (ProductPricingPanel), reading the buying side instead: the MRP the
 * product can be sold at and how many sellers already stock it. The band
 * underneath carries the taxonomy the product belongs to, each chip re-opening
 * the catalog filtered by it.
 */
const SubscribePricingPanel = ({
  deal,
  onFilter,
  className,
}: SubscribePricingPanelProps) => {
  if (!deal?._id) return null;

  const mrp = deal.mrp || 0;
  const packSize = getPackSize(deal);
  const subscribers = deal.totalSubscribed || 0;

  return (
    <section className={className}>
      <div className="tw:grid tw:grid-cols-2 tw:gap-2">
        <Tile
          label="MRP"
          footer={packSize ? `Pack of ${packSize}` : "Printed retail price"}
        >
          <Amount value={mrp} />
        </Tile>

        <Tile
          label="Retailers subscribed"
          footer={
            subscribers > 0
              ? "already subscribed to this product"
              : "be the first to subscribe"
          }
        >
          {subscribers}
        </Tile>
      </div>

      {/* Taxonomy band — where the product sits in the catalog, each chip
          re-opening search scoped to it. Pill-shaped and self-sized, the way
          WhatsApp carries its filter row. */}
      <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
        {deal.brand?.name && (
          <FilterChip
            icon={Tag}
            label={deal.brand.name}
            onClick={() => onFilter?.("brand")}
          />
        )}

        {deal.category?.name && (
          <FilterChip
            icon={Layers}
            label={deal.category.name}
            onClick={() => onFilter?.("category")}
          />
        )}

        {deal.menu?.name && (
          <FilterChip
            icon={Users}
            label={deal.menu.name}
            onClick={() => onFilter?.("menu")}
          />
        )}

        {deal.companyName && (
          <FilterChip
            icon={Store}
            label={deal.companyName}
            tone="company"
            onClick={() => onFilter?.("company")}
          />
        )}
      </div>
    </section>
  );
};

export default SubscribePricingPanel;
