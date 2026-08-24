import clsx from "clsx";
import {
  Copy,
  PackageSearch,
  Plus,
  Recycle,
  Settings,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import ToggleProductStatus from "~/shared/catalog/components/toggle-product-status/ToggleProductStatus";
import CategoryDeals from "../category-deals/CategoryDeals";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

export interface ProductSidePaneProps {
  /** The product on screen (formatted seller deal). */
  deal: any;
  /** Duplicate the product into the catalog cart. */
  onClone?: () => void;
  cloneLoading?: boolean;
  /** Open the unit-configuration modal. */
  onUnitConfigClick?: () => void;
  /** Scroll the overview down to the bin block. */
  onViewBins?: () => void;
  /** Bins only exist on the overview tab. */
  showViewBins?: boolean;
  /** Open the consumer-offer config modal. */
  onEnableOfferClick?: () => void;
  /** A consumer-offer request already exists — hides the enable action. */
  hasConsumerRequest?: boolean;
  /** Product status changed from the pane's toggle. */
  onStatusChange?: (status: string) => void;
  className?: string;
}

interface ActionRowProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  loading?: boolean;
}

/** One quick-action row — icon + label on a full-width bordered tile. */
const ActionRow = ({ icon: Icon, label, onClick, loading }: ActionRowProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-2.5 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-3 tw:py-2.5 tw:text-left tw:text-sm tw:font-medium tw:text-slate-700 tw:transition-colors tw:hover:bg-slate-50 tw:disabled:opacity-60"
  >
    {loading ? (
      <AppSpinner size="sm" className="tw:shrink-0" />
    ) : (
      <Icon size={16} className="tw:shrink-0 tw:text-slate-400" />
    )}
    <span className="tw:truncate">{label}</span>
  </button>
);

/**
 * Side-pane contents for the product detail views in theme-2 desktop: the
 * product's category peers ("Similar in category") followed by the quick
 * actions that otherwise live in the mobile footer bar.
 */
const ProductSidePane = ({
  deal,
  onClone,
  cloneLoading,
  onUnitConfigClick,
  onViewBins,
  showViewBins,
  onEnableOfferClick,
  hasConsumerRequest,
  onStatusChange,
  className,
}: ProductSidePaneProps) => {
  const appNav = useAppNav();

  if (!deal?._id) return null;

  const categoryName = deal.category?._displayName || deal.category?.name || "";
  const canEnableOffer =
    !deal.isKCStoreEnabled &&
    !deal.consumerOffer?.enabled &&
    !hasConsumerRequest;

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + the product's category as scope. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <PaneTitle title="Product" />
        {/* Scope label removed — the pane header carries the title alone.
        {categoryName && (
          <span className="tw:truncate tw:text-sm tw:text-slate-400">
            {categoryName}
          </span>
        )}
        */}
      </div>

      {/* Other products from the same category. */}
      <CategoryDeals
        categoryId={deal.category?._id || ""}
        excludeDealId={deal._id}
      />

      {/* Quick actions — the same set the mobile footer bar carries. */}
      <section className="tw:px-1">
        <h3 className="tw:mb-2 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
          Quick actions
        </h3>

        <div className="tw:flex tw:flex-col tw:gap-2">
          {showViewBins && onViewBins && (
            <ActionRow
              icon={PackageSearch}
              label="View bins"
              onClick={onViewBins}
            />
          )}

          {onUnitConfigClick && (
            <ActionRow
              icon={Settings}
              label="Sell in configuration"
              onClick={onUnitConfigClick}
            />
          )}

          {onClone && (
            <ActionRow
              icon={Copy}
              label="Duplicate product"
              onClick={onClone}
              loading={cloneLoading}
            />
          )}

          {/* List a second-hand unit of this product as its own deal. */}
          <ActionRow
            icon={Recycle}
            label="Intake pre-owned unit"
            onClick={() =>
              appNav.to("/dashboard/inventory/products/pre-owned", {
                dealId: deal._id,
              })
            }
          />

          {/* {canEnableOffer && onEnableOfferClick && (
            <ActionRow
              icon={Plus}
              label="Enable consumer offer"
              onClick={onEnableOfferClick}
            />
          )} */}

          <ActionRow
            icon={TrendingUp}
            label="See sales"
            onClick={() =>
              appNav.to(
                `/dashboard/inventory/products/view/${deal._id}/sales-history`,
              )
            }
          />

          {/* Activate / deactivate — owns its own confirm dialog. */}
          {!deal.isKCStoreEnabled && (
            <ToggleProductStatus
              dealId={deal._raw?._id}
              status={deal.status}
              size="small"
              className="tw:w-full"
              callback={(res: { action: string; data?: any }) => {
                if (res?.action === "submit") {
                  onStatusChange?.(
                    String(deal.status || "").toLowerCase() === "active"
                      ? "Inactive"
                      : "Active",
                  );
                }
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductSidePane;
