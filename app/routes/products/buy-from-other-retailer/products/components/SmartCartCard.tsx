import { ArrowRight, ShoppingCart } from "lucide-react";
import clsx from "clsx";

export interface SmartCartCardProps {
  /** Number of SKUs in the smart cart. */
  skuCount?: number;
  /** Total cart value in rupees. */
  totalValue?: number;
  /** Number of sellers the cart is routed across. */
  sellerCount?: number;
  /** Savings amount in rupees compared to the previous week. */
  savings?: number;
  /** Optional click handler for the Load button. */
  onLoad?: () => void;
  /** Optional extra classes for the outer wrapper. */
  className?: string;
}

/**
 * Smart-cart readiness banner used in the network-products browse page.
 * Surfaces the curated cart summary (SKU count, value, seller count and
 * weekly savings) and provides a one-tap Load action.
 */
const SmartCartCard: React.FC<SmartCartCardProps> = ({
  skuCount = 11,
  totalValue = 4820,
  sellerCount = 3,
  savings = 340,
  onLoad,
  className,
}) => {
  if (1) {
    return null;
  }
  return (
    <div
      className={clsx(
        "tw:@container tw:rounded-2xl tw:bg-primary tw:p-3 tw:shadow-sm tw:text-primary-foreground",
        className,
      )}
    >
      {/* Wraps in narrow containers (side pane / small screens): the Load
          button drops to its own full-width row below the text. */}
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-2">
        {/* Icon plate */}
        <div className="tw:flex tw:shrink-0 tw:size-9 tw:items-center tw:justify-center tw:rounded-lg tw:bg-white/15">
          <ShoppingCart className="tw:size-4.5 tw:text-primary-foreground" />
        </div>

        {/* Text content */}
        <div className="tw:flex-1 tw:min-w-0 tw:basis-40">
          <p
            className="tw:text-[9px] tw:uppercase tw:tracking-widest tw:text-primary-foreground/80 tw:font-semibold"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Smart Cart Ready
          </p>
          <h3 className="tw:text-sm tw:@md:text-base tw:font-bold tw:leading-tight tw:text-primary-foreground">
            {skuCount} SKUs <span className="tw:mx-0.5">•</span> ₹
            {totalValue.toLocaleString("en-IN")}{" "}
            <span className="tw:mx-0.5">•</span> {sellerCount} sellers
          </h3>
          <p className="tw:mt-0.5 tw:text-[11px] tw:leading-snug tw:text-primary-foreground/90 tw:truncate">
            save ₹{savings.toLocaleString("en-IN")} vs last week
          </p>
        </div>

        {/* Load button */}
        <button
          type="button"
          onClick={onLoad}
          className="tw:shrink-0 tw:inline-flex tw:items-center tw:justify-center tw:gap-1 tw:rounded-full tw:bg-white/15 tw:px-3 tw:py-1 tw:text-xs tw:font-medium tw:text-primary-foreground tw:hover:bg-white/25 tw:transition-colors tw:@max-md:w-full"
        >
          Load
          <ArrowRight className="tw:size-3.5" />
        </button>
      </div>
    </div>
  );
};

export default SmartCartCard;
