import { MoreVertical, Plus, Trash } from "lucide-react";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppPopover from "~/components/core/popover/AppPopover";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";
import PromotionalBadge from "~/shared/inventory/components/PromotionalBadge";
import ReserveBadge from "~/shared/inventory/components/ReserveBadge";
import type { ProductItemType } from "../../helper";

type MobileViewProps = {
  data: ProductItemType;
  callback: ({
    action,
    data,
  }: {
    action: string;
    data: ProductItemType;
  }) => void;
  feature: string;
  showCheckbox?: boolean;
  checked?: boolean;
  disabled?: boolean;
  onToggle?: (checked: boolean, data: ProductItemType) => void;
};

const MobileView = ({
  data,
  callback,
  feature,
  showCheckbox = false,
  checked = false,
  disabled = false,
  onToggle,
}: MobileViewProps) => {
  const isB2bPriceNotConfigured =
    feature === "PriceUpdate" && !data.isB2bMarginConfigured;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    callback({ action: "add-to-cart", data });
  };

  const handleRemoveFromCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    callback({ action: "remove-from-cart", data });
  };

  return (
    <AppCard noPadding className="tw:mb-0 tw:relative">
      {showCheckbox ? (
        <div className="tw:absolute tw:top-2 tw:left-2 tw:z-20 tw:bg-white tw:rounded-sm tw:shadow-sm">
          <input
            type="checkbox"
            checked={checked}
            disabled={
              disabled || isB2bPriceNotConfigured
            }
            onChange={(e) => onToggle && onToggle(e.target.checked, data)}
            className="tw:w-4 tw:h-4 tw:block"
          />
        </div>
      ) : null}
      <AppLink
        href={`/dashboard/inventory/products/view/${data._id}`}
        noUnderline
        asLink
      >
        <div className="tw:p-2 tw:relative">
          <div className="tw:relative tw:w-full tw:h-32 tw:mb-2">
            {data.b2bScheme?.status !== "None" && feature === "PriceUpdate" && (
              <AppBadge
                variant={data.b2bScheme?.statusColor}
                className="tw:absolute tw:bottom-2 tw:right-0"
              >
                Scheme: {data.b2bScheme?.status}
              </AppBadge>
            )}

            <ImgRender
              assetId={data.images[0]}
              alt={data.name}
              className="tw:object-cover tw:h-full tw:w-full"
              size="200x200"
            />
          </div>
          <div>
            <div className="tw:h-10">
              <h3 className="tw:text-xs tw:font-semibold tw:line-clamp-2 tw:mb-2">
                {data.name}
              </h3>
            </div>

            <div
              className={`tw:text-xs tw:mb-1 tw:flex tw:items-center tw:gap-1 ${
                data.actualMaxQty === 0
                  ? "tw:text-red-600"
                  : "tw:text-green-600"
              }`}
            >
              In Stock: {data.actualMaxQty || 0}
              {data.isReserve && <ReserveBadge />}
              {data.isPromotionalDeal && <PromotionalBadge />}
            </div>

            <div
              className="tw:flex tw:items-center tw:gap-1 tw:mb-1"
              onClick={(e) => e.preventDefault()}
            >
              <span className="tw:text-[10px] tw:font-medium tw:text-slate-500">
                Sold (7d): {data.salesAnalytics?.last7Days?.quantity || 0}
              </span>
              <AppPopover
                triggerContent={
                  <button
                    type="button"
                    className="tw:cursor-pointer tw:text-slate-500 tw:hover:text-slate-700 tw:flex tw:items-center tw:-mr-1 tw:p-0.1"
                  >
                    <MoreVertical size={14} />
                  </button>
                }
              >
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <DealSummaryPopover salesAnalytics={data.salesAnalytics} />
                </div>
              </AppPopover>
            </div>

            {feature === "PackUpdate" ? (
              <div className="tw:my-2">
                <div className="tw:text-[9px] tw:font-bold tw:text-slate-400 tw:uppercase tw:tracking-tight tw:mb-0.5">
                  Sell In
                </div>
                <div className="tw:flex tw:items-baseline tw:gap-1.5">
                  <span className="tw:text-xs tw:font-bold tw:text-slate-800">
                    <SellingTypeDisplay sellingType={data.sellingType} /> {!data.sellingType && "-"}
                  </span>
                  <span className="tw:text-[10px] tw:font-medium tw:text-slate-500">
                    ({data.packageQty || 0} Units)
                  </span>
                </div>
              </div>
            ) : null}

            <div className="tw:flex tw:items-center tw:gap-2 tw:justify-between">
              {!isB2bPriceNotConfigured ? (
                <div>
                  <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                    B2B Price
                  </div>
                  <DisplayPrice
                    price={data.b2bPrice || data.mrp}
                    uom={(data as any).selectedStockUom}
                    className="tw:text-sm tw:font-semibold tw:text-primary"
                  />
                  {data.mrp !== data.b2bPrice && (
                    <div className="tw:text-xs tw:text-gray-500 tw:line-through">
                      <DisplayPrice
                        price={data.mrp}
                        uom={(data as any).selectedStockUom}
                        className="tw:text-gray-500"
                      />
                    </div>
                  )}
                </div>
              ) : null}

              <div className={isB2bPriceNotConfigured ? "tw:w-full" : ""}>
                {data.isLoading ? (
                  <AppSpinner className="tw:w-3 tw:h-3" />
                ) : data.isInCart ? (
                  <AppButton
                    size="small"
                    color="danger"
                    fill="outline"
                    onClick={handleRemoveFromCart}
                  >
                    <Trash size={16} />
                  </AppButton>
                ) : feature === "PriceUpdate" && isB2bPriceNotConfigured ? (
                  <div
                    className={
                      isB2bPriceNotConfigured
                        ? "tw:flex tw:flex-col tw:items-stretch tw:gap-1"
                        : "tw:flex tw:flex-col tw:items-end tw:gap-1"
                    }
                  >
                    <span
                      className={
                        isB2bPriceNotConfigured
                          ? "tw:text-[10px] tw:text-red-500 tw:leading-none tw:text-center"
                          : "tw:text-[10px] tw:text-red-500 tw:leading-none"
                      }
                    >
                      B2B price missing
                    </span>
                    <AppButton
                      size="small"
                      color="dark"
                      fill="outline"
                      className={isB2bPriceNotConfigured ? "tw:w-full" : ""}
                      onClick={(e) => {
                        e.preventDefault();
                        callback({ action: "config-b2b", data });
                      }}
                    >
                      Config
                    </AppButton>
                  </div>
                ) : (
                  <AppButton
                    size="small"
                    color="primary"
                    onClick={handleAddToCart}
                  >
                    <Plus size={16} />
                  </AppButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppLink>
    </AppCard>
  );
};

export default MobileView;
