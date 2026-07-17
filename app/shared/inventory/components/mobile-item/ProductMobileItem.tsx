import { MoreVertical, Package, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import AppPopover from "~/components/core/popover/AppPopover";
import Rbac from "~/components/core/rbac/Rbac";
import AuthService from "~/services/AuthService";
import AppBadge from "~/components/core/badge/AppBadge";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import ProductMobileItemPopover from "./ProductMobileItemPopover";
import DealScopeBadge from "~/shared/inventory/components/DealScopeBadge";
import type { SellerDeal } from "~/types/CommonTypes";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import ReserveBadge from "~/shared/inventory/components/ReserveBadge";
import PromotionalBadge from "~/shared/inventory/components/PromotionalBadge";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

const rbacRoles = {
  addStock: ["INVENTORY.ADD-STOCK"],
  view: ["INVENTORY.VIEW-INVENTORY"],
};

const ProductMobileItem = ({
  data,
  callback,
  imgheightClass = "tw:h-32 tw:w-32",
}: {
  data: SellerDeal;
  callback: (args: { action: string; data: SellerDeal }) => void;
  imgheightClass?: string;
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppCard className="tw:overflow-hidden tw:relative tw:mb-0" noPadding>
      {/* Status Circle */}
      <div
        className={`tw:absolute tw:top-2 tw:left-2 tw:z-10 tw:w-3 tw:h-3 tw:rounded-full ${
          data.status === "Active" ? "tw:bg-green-500" : "tw:bg-red-500"
        }`}
      />

      {/* Deal Scope Badge - Top Left Absolute */}
      <div className="tw:absolute tw:top-1.5 tw:left-6 tw:z-10">
        <DealScopeBadge isLocalDeal={data.isLocalDeal} size="xs" />
      </div>

      {/* Menu - Top Right */}
      <div className="tw:absolute tw:top-2 tw:right-2 tw:z-10">
        <AppPopover
          triggerContent={
            <div className="tw:bg-white/80 tw:p-1 tw:rounded-full tw:shadow-sm tw:cursor-pointer">
              <MoreVertical size={16} className="tw:text-gray-600" />
            </div>
          }
        >
          <ProductMobileItemPopover data={data} />
        </AppPopover>
      </div>

      <AppLink
        asLink
        href={`/dashboard/inventory/products/view/${data._id}`}
        className="tw:bg-white tw:p-1 tw:relative tw:flex tw:items-center tw:justify-center"
      >
        {data.consumerOffer?.enabled ? (
          <div className="tw:absolute tw:left-1 tw:bottom-1">
            <ConsumerOfferBadge />
          </div>
        ) : null}

        {data.images && data.images.length > 0 ? (
          <ImgRender
            assetId={
              data.images && data.images.length > 0 ? data.images[0] : undefined
            }
            alt={data.name}
            className={`${imgheightClass} tw:object-cover`}
          />
        ) : (
          <Package className={`${imgheightClass} tw:text-gray-200`} />
        )}

        {data.isPromotionalDeal && (
          <div className="tw:absolute tw:bottom-1 tw:right-1">
            <PromotionalBadge />
          </div>
        )}
      </AppLink>

      <div className="tw:p-2">
        <div className="tw:h-10">
          <AppLink
            asLink
            href={`/dashboard/inventory/products/view/${data._id}`}
            className="tw:text-xs tw:font-semibold tw:line-clamp-2 tw:text-gray-700 tw:hover:tw:text-blue-600"
          >
            {data.name}
          </AppLink>
        </div>

        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-center">
          <div
            className="tw:flex-1 tw:min-w-0 tw:flex tw:flex-col tw:gap-1"
            title={t("stock")}
          >
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <span
                className={`tw:text-xs tw:font-medium tw:leading-none ${
                  (data.actualMaxQty ?? 0) === 0
                    ? "tw:text-red-500"
                    : "tw:text-slate-800"
                }`}
              >
                <DisplayQty
                  qty={Number(data.actualMaxQty) || 0}
                  isLooseQty={false}
                  uom={(data as any).selectedStockUom}
                />
              </span>
              {data.isReserve && <ReserveBadge />}
            </div>
            {(!(data as any).selectedStockUom ||
              String((data as any).selectedStockUom).toLowerCase() ===
                "unit") && (
              <div className="tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:leading-none">
                <span className="tw:text-gray-500 tw:font-semibold tw:uppercase tw:tracking-wide">
                  <SellingTypeDisplay sellingType={data.sellingType || "Unit"} />
                </span>
                <CaseQtyPopover
                  packageQty={data.packageQty || 0}
                  sellingType={data.sellingType || "Unit"}
                />
              </div>
            )}
          </div>

          <div className="tw:flex tw:items-center tw:gap-2 tw:shrink-0">
            {data.isKCStoreEnabled ? (
              <div className="tw:bg-blue-500 tw:text-white tw:text-[10px] tw:px-2 tw:py-1 tw:rounded-full tw:font-semibold tw:whitespace-nowrap">
                Coin Store
              </div>
            ) : (
              <Rbac
                roles={rbacRoles.addStock}
                forceDisplay={AuthService.isMasterLogin()}
              >
                <AppButton
                  onClick={(e) => {
                    e.stopPropagation();
                    callback({ action: "add-stock", data: data });
                  }}
                  color="primary"
                  size="small"
                >
                  <Plus className="tw:w-4 tw:h-4" />
                </AppButton>
              </Rbac>
            )}
          </div>
        </div>
      </div>
    </AppCard>
  );
};
export default ProductMobileItem;
