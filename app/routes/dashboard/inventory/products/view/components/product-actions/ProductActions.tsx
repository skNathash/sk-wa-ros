import clsx from "clsx";
import { useState } from "react";
import {
  Copy,
  MoreHorizontal,
  PackageSearch,
  Plus,
  Recycle,
  Settings,
  TrendingUp,
} from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppPopover from "~/components/core/popover/AppPopover";
import useAppNav from "~/hooks/useAppNav";
import ToggleProductStatus from "~/shared/catalog/components/toggle-product-status/ToggleProductStatus";

export interface ProductActionsProps {
  deal: any;
  showViewBins?: boolean;
  onViewBins?: () => void;
  onUnitConfigClick?: () => void;
  onClone?: () => void;
  cloneLoading?: boolean;
  onEnableOfferClick?: () => void;
  hasConsumerRequest?: boolean;
  onStatusChange?: (status: string) => void;
  className?: string;
}

const ProductActions = ({
  deal,
  showViewBins,
  onViewBins,
  onUnitConfigClick,
  onClone,
  cloneLoading,
  onEnableOfferClick,
  hasConsumerRequest,
  onStatusChange,
  className,
}: ProductActionsProps) => {
  const appNav = useAppNav();
  const [open, setOpen] = useState(false);

  if (!deal?._id) return null;

  const canEnableOffer =
    !deal.isKCStoreEnabled &&
    !deal.consumerOffer?.enabled &&
    !hasConsumerRequest;

  const handleViewBins = () => {
    setOpen(false);
    onViewBins?.();
  };

  const handleUnitConfig = () => {
    setOpen(false);
    onUnitConfigClick?.();
  };

  const handleClone = () => {
    setOpen(false);
    onClone?.();
  };

  const handlePreOwned = () => {
    setOpen(false);
    appNav.to("/dashboard/inventory/products/pre-owned", {
      dealId: deal._id,
    });
  };

  const handleOffer = () => {
    setOpen(false);
    onEnableOfferClick?.();
  };

  const handleSales = () => {
    setOpen(false);
    appNav.to(`/dashboard/inventory/products/view/${deal._id}/sales-history`);
  };

  const handleStatusChange = (nextStatus: string) => {
    setOpen(false);
    onStatusChange?.(nextStatus);
  };

  const commonProps = {
    size: "small" as const,
    fill: "outline" as const,
    color: "primary" as const,
  };

  const buttons = (
    <>
      {showViewBins && onViewBins && (
        <AppButton {...commonProps} onClick={handleViewBins}>
          <PackageSearch size={16} />
          View bins
        </AppButton>
      )}

      {onUnitConfigClick && (
        <AppButton {...commonProps} onClick={handleUnitConfig}>
          <Settings size={16} />
          Sell in configuration
        </AppButton>
      )}

      {onClone && (
        <AppButton
          {...commonProps}
          onClick={handleClone}
          isLoading={cloneLoading}
        >
          <Copy size={16} />
          Duplicate
        </AppButton>
      )}

      <AppButton {...commonProps} onClick={handlePreOwned}>
        <Recycle size={16} />
        Intake pre-owned unit
      </AppButton>

      {canEnableOffer && onEnableOfferClick && (
        <AppButton
          size="small"
          color="success"
          fill="solid"
          onClick={handleOffer}
        >
          <Plus size={16} />
          Enable offer
        </AppButton>
      )}

      <AppButton {...commonProps} onClick={handleSales}>
        <TrendingUp size={16} />
        See sales
      </AppButton>

      {!deal.isKCStoreEnabled && (
        <ToggleProductStatus
          dealId={deal._raw?._id}
          status={deal.status}
          size="small"
          callback={(res) => {
            if (res?.action === "submit") {
              handleStatusChange(
                String(deal.status || "").toLowerCase() === "active"
                  ? "Inactive"
                  : "Active",
              );
            }
          }}
        />
      )}
    </>
  );

  return (
    <div className={clsx("tw:space-y-2", className)}>
      <h3 className="tw:hidden tw:md:block tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        Quick actions
      </h3>

      {/* Desktop theme-1: action buttons inline below the hero. */}
      <div className="tw:hidden tw:md:flex tw:flex-wrap tw:items-center tw:gap-2">
        {buttons}
      </div>

      {/* Mobile: a single trigger that opens a popover with all actions. */}
      <div className="tw:md:hidden">
        <AppPopover
          align="start"
          side="bottom"
          sideOffset={4}
          noPadding
          contentClassName="tw:w-auto"
          triggerContent={
            <AppButton size="small" fill="outline" color="primary">
              <MoreHorizontal size={16} />
              Actions
            </AppButton>
          }
          open={open}
          onOpenChange={setOpen}
        >
          <div className="tw:flex tw:min-w-[220px] tw:flex-col tw:gap-2 tw:p-2">
            {buttons}
          </div>
        </AppPopover>
      </div>
    </div>
  );
};

export default ProductActions;
