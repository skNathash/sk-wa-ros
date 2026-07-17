import {
  CheckCircle,
  Copy,
  ExternalLink,
  EyeIcon,
  Info,
  PackageSearch,
  Plus,
  Settings,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { CLUB_URL } from "~/constants";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import DealScopeBadge from "~/shared/inventory/components/DealScopeBadge";
import ToggleProductStatus from "~/shared/catalog/components/toggle-product-status/ToggleProductStatus";
import type { SellerDeal } from "~/types/CommonTypes";

interface InventoryProductCardProps {
  className?: string;
  data: SellerDeal;
  onEdit?: () => void;
  onStatusChange?: (status: string) => void;
  consumerOfferId?: string;
  consumerOfferStatus?: string;
  onEnableOfferClick?: () => void;
  onViewBins?: () => void;
  showViewBins?: boolean;
  onUnitConfigClick?: () => void;
  onClone?: () => void;
  cloneLoading?: boolean;
}

const InventoryProductCard: React.FC<InventoryProductCardProps> = ({
  className,
  data,
  onEdit,
  onStatusChange,
  consumerOfferId,
  consumerOfferStatus,
  onEnableOfferClick,
  onViewBins,
  showViewBins,
  onUnitConfigClick,
  onClone,
  cloneLoading,
}) => {
  const appNav = useAppNav();

  const [status, setStatus] = useState<string>(String(data.status || ""));

  useEffect(() => {
    setStatus(String(data.status || ""));
  }, [data.status]);

  const handleViewRequest = () => {
    appNav.to(
      `/dashboard/inventory/subscribe/approval-history/products/view/${consumerOfferId}`,
    );
  };

  const handleOpenClubStore = () => {
    const mobile = AuthService.getLoggedInUser()?.mobile;
    if (!mobile || !data._id) return;
    CommonService.openInNewWindow(
      `${CLUB_URL}/${mobile}/products/view?id=${data._id}`,
    );
  };

  return (
    <div className={`tw:mb-4 ${className}`}>
      <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:gap-2">
        {/* Left column: name and badges */}
        <div className="tw:flex-1">
          {/* Header: name (left) and toggle (right) - toggle will appear in the corner */}
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-start tw:justify-between tw:gap-2">
            <span className="tw:w-full tw:md:w-auto tw:md:text-2xl tw:text-xl tw:font-semibold">
              {data.name || "-"}
              <button
                type="button"
                onClick={handleOpenClubStore}
                title="View in Club Store"
                aria-label="View in Club Store"
                className="tw:text-primary tw:cursor-pointer tw:hover:opacity-70 tw:inline-flex tw:align-middle tw:ml-1"
              >
                <ExternalLink size={18} />
              </button>
            </span>

            {!data.isKCStoreEnabled && (
              <div className="tw:items-center tw:gap-2 tw:hidden tw:md:flex">
                <ToggleProductStatus
                  dealId={data._raw?._id}
                  status={status}
                  size="small"
                  callback={(res) => {
                    if (res?.action === "submit") {
                      // Compute next status and update local state
                      const nextStatus =
                        String(status || "").toLowerCase() === "active"
                          ? "Inactive"
                          : "Active";
                      setStatus(nextStatus);
                      // Notify parent/layout about the status change so it can
                      // update any dependent UI (like InfoBlock).
                      if (typeof onStatusChange === "function") {
                        onStatusChange(nextStatus);
                      }
                    }
                  }}
                />
                {showViewBins && (
                  <AppButton
                    size="small"
                    color="primary"
                    fill="outline"
                    onClick={onViewBins}
                  >
                    <PackageSearch size={16} />
                    View Bins
                  </AppButton>
                )}
                {onClone && (
                  <AppButton
                    size="small"
                    color="primary"
                    fill="outline"
                    onClick={onClone}
                    isLoading={cloneLoading}
                  >
                    <Copy size={16} />
                    Duplicate
                  </AppButton>
                )}
                {!data.consumerOffer?.enabled && !consumerOfferId ? (
                  <AppButton
                    color="success"
                    fill="solid"
                    size="small"
                    onClick={onEnableOfferClick}
                  >
                    <Plus className="tw:text-white" size={16} />
                    Enable Offer
                  </AppButton>
                ) : null}
              </div>
            )}
          </div>

          {/* Badges row: below the name on mobile, inline on md */}
          <div className="tw:flex tw:md:items-center tw:gap-2 tw:mt-2">
            {data.consumerOffer?.enabled ? (
              <ConsumerOfferBadge size="md" />
            ) : null}

            <AppBadge variant={data._movementTypeColor}>
              {data.movementType}
            </AppBadge>

            <AppBadge
              variant={status === "Active" ? "success" : "danger"}
              className="tw:text-xs"
            >
              {status || "-"}
            </AppBadge>

            <DealScopeBadge isLocalDeal={(data as any).isLocalDeal} size="sm" />
          </div>
        </div>
      </div>

      {consumerOfferStatus === "Created" ? (
        <InfoBlock variant="info" size="sm" bordered className="tw:mt-4">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-2">
            <div className="tw:flex tw:items-center tw:gap-2">
              Offer request is created and waiting for approval by StoreKing
              team.
            </div>
            <AppButton
              size="small"
              color="primary"
              fill="solid"
              onClick={handleViewRequest}
            >
              <EyeIcon size={16} />
              View Request
            </AppButton>
          </div>
        </InfoBlock>
      ) : null}

      {consumerOfferStatus === "Synced" ? (
        <InfoBlock variant="success" size="sm" bordered className="tw:mt-4">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
            <div className="tw:flex tw:items-center tw:gap-2">
              <CheckCircle size={16} />
              Offer request is Approved by StoreKing team. Please subscribe and
              add stock to the product.
            </div>
            <AppButton
              size="small"
              color="success"
              fill="solid"
              onClick={handleViewRequest}
            >
              <Plus size={16} />
              View & Subscribe
            </AppButton>
          </div>
        </InfoBlock>
      ) : null}
    </div>
  );
};

export default InventoryProductCard;
