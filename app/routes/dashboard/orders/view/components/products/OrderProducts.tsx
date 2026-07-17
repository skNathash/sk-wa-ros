import clsx from "clsx";
import {
  ArrowRight,
  Coins,
  Info,
  InfoIcon,
  PencilLine,
  Plus,
  ShoppingCart,
  Tag,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import AppLink from "~/components/core/link/AppLink";
import AppPopover from "~/components/core/popover/AppPopover";
import Rbac from "~/components/core/rbac/Rbac";
import CancellationPopoverContent from "./components/CancellationPopoverContent";
import CancelItemModal from "./modals/CancelItemModal";
import MultipleAddStockModal from "~/shared/catalog/modals/add-stock/MultipleAddStockModal";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import ReserveBadge from "~/shared/inventory/components/ReserveBadge";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

const rbacRoles = {
  cancelOrder: ["SALE-ORDER.CANCEL"],
};

interface OrderProductsProps {
  products: any[];
  statusSummary: any[];
  orderId: string;
  callback: (response: { action: string; data?: any }) => void;
  isKCStore?: boolean;
  isMyOrder?: boolean;
  needPaymentApproval?: boolean;
  orderType?: string;
}

const OrderProducts = ({
  products,
  orderId,
  callback,
  isKCStore = false,
  isMyOrder = false,
  needPaymentApproval = false,
  orderType,
}: OrderProductsProps) => {
  const priceLabel =
    orderType === "B2B"
      ? "B2B Price"
      : orderType === "B2C"
        ? "B2C Price"
        : null;
  const { t } = useTranslation(["common"]);

  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // determine if any product requires low stock action
  // skip low-stock logic for KC stores
  const hasLowStock =
    isMyOrder && !isKCStore && products && products.some((p) => p.showAddStock);

  const [cancelItemModal, setCancelItemModal] = useState<{
    show: boolean;
    product: any;
  }>({
    show: false,
    product: null,
  });

  const [multiAddModal, setMultiAddModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const handleCancelProduct = (product: any) => {
    setCancelItemModal({
      show: true,
      product,
    });
  };

  const handleCancelItemModalCallback = (data: any) => {
    setCancelItemModal({
      show: false,
      product: null,
    });

    if (data.action === "submit") {
      callback({ action: "cancelItem", data: data.data });
    }
  };

  if (!products || products.length === 0) {
    return (
      <AppCard className="tw:mb-4">
        <div className="tw:text-center tw:text-gray-500">
          {t("noDataFound")}
        </div>
      </AppCard>
    );
  }

  return (
    <>
      <AppCard
        noContentPadding
        title={
          <div className="tw:flex tw:justify-between tw:items-center tw:gap-2 tw:w-full">
            <div className="tw:flex-1 card-title">
              {t("orderedItems")} ({products.length})
            </div>
            {hasLowStock && (
              <label className="tw:inline-flex tw:items-center tw:gap-1 tw:text-sm tw:text-gray-600">
                <input
                  type="checkbox"
                  checked={onlyLowStock}
                  onChange={(e) => setOnlyLowStock(e.target.checked)}
                  className="tw:h-3 tw:w-3 tw:rounded tw:border tw:border-gray-300"
                />
                <span className="tw:text-xs">{t("lowStock")}</span>
              </label>
            )}
          </div>
        }
        icon={<ShoppingCart />}
        iconClassName="tw:text-blue-500"
      >
        {hasLowStock && (
          <div className="tw:px-6 tw:py-2.5 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:bg-orange-50/40">
            <div className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:text-orange-900 tw:min-w-0">
              <InfoIcon size={14} className="tw:text-orange-600 tw:shrink-0" />
              <span className="tw:tabular-nums tw:font-semibold">
                {products.filter((p) => p.showAddStock).length}
              </span>
              <span className="tw:truncate">
                item{products.filter((p) => p.showAddStock).length > 1 ? "s" : ""} need stock
              </span>
            </div>
            <AppButton
              color="primary"
              fill="outline"
              size="small"
              onClick={() =>
                setMultiAddModal({
                  show: true,
                  data: products
                    .filter((p) => p.showAddStock)
                    .map((p) => ({
                      dealId: p.dealId,
                      dealName: p.dealName,
                      mrp: p.mrp,
                      purchasePrice: p.purchasePrice,
                      currentStock: p.dealDetails?.maxQty || 0,
                      requiredStock: p.remainingQty || 0,
                    })),
                })
              }
            >
              <Plus size={14} />
              {t("addMultipleStock")}
            </AppButton>
          </div>
        )}
        {(onlyLowStock && !isKCStore
          ? products.filter((p) => p.showAddStock)
          : products
        ).map((product) => {
          const isOfferOfTheDay =
            product.discountInfo?.discountType === "OfferOfTheDay";
          return (
            <div
              key={product._id}
              className="tw:px-6 tw:py-4 tw:border-b tw:border-gray-200 last:tw:border-b-0"
            >
              {/* Header: image + name/meta + status */}
              <div className="tw:flex tw:gap-3 tw:items-start">
                <div className="tw:w-14 tw:shrink-0 tw:relative">
                  <div className="tw:border tw:border-gray-200 tw:rounded-md tw:p-0.5 tw:relative">
                    <ImgRender
                      assetId={product.images?.[0] || undefined}
                      className="tw:w-full tw:h-full tw:object-cover"
                    />
                    {product.isConsumerOffer && (
                      <div className="tw:absolute tw:left-1 tw:top-0">
                        <ConsumerOfferBadge size="sm" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="tw:flex-1 tw:min-w-0">
                  <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                    <p className="tw:font-medium tw:line-clamp-2 tw:text-sm tw:leading-snug">
                      <AppLink
                        asLink
                        href={`/dashboard/inventory/products/view/${product.dealId}`}
                      >
                        {product.dealName}
                      </AppLink>
                    </p>
                    <AppBadge variant={product._statusColor}>
                      {product._statusLbl}
                    </AppBadge>
                  </div>

                  <div className="tw:mt-1 tw:flex tw:items-center tw:gap-2 tw:flex-wrap tw:text-[11px] tw:text-gray-500">
                    <span>
                      {t("id")}: {product.dealRefId || "--"}
                    </span>
                    {product.packSoldQty > 0 && (
                      <>
                        <span className="tw:text-gray-300">•</span>
                        <span className="tw:text-primary tw:flex tw:items-center tw:gap-1">
                          Sold in {product.packSoldQty} {product.packType}
                          <CaseQtyPopover
                            packageQty={product.packQuantity || 0}
                            sellingType={product.packType || "UNIT"}
                          />
                        </span>
                      </>
                    )}
                    {product.isReserveOrder &&
                      product.status !== "Cancelled" && (
                        <>
                          <span className="tw:text-gray-300">•</span>
                          <ReserveBadge template={2} />
                        </>
                      )}
                    {product.isCustomerRequestedItem && (
                      <>
                        <span className="tw:text-gray-300">•</span>
                        <span className="tw:text-blue-500 tw:flex tw:items-center tw:gap-1">
                          <InfoIcon size={11} />
                          Auto-subscribed
                        </span>
                      </>
                    )}
                    {product.isExcludeReward && (
                      <>
                        <span className="tw:text-gray-300">•</span>
                        <AppPopover
                          triggerContent={
                            <span className="tw:text-amber-600 tw:flex tw:items-center tw:gap-1 tw:cursor-default">
                              <Coins size={11} />
                              No coins reward
                            </span>
                          }
                        >
                          <div className="tw:max-w-[200px] tw:text-xs tw:text-gray-600">
                            {t("coinsExcludedFromReward")}
                          </div>
                        </AppPopover>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Aligned data strip: label-over-value cells. Mobile = 3-col grid, desktop = inline row. */}
              <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:items-end tw:sm:justify-between tw:sm:gap-x-6">
                <div className="tw:grid tw:grid-cols-3 tw:gap-x-4 tw:gap-y-3 tw:sm:flex tw:sm:items-end tw:sm:gap-x-6 tw:sm:gap-y-3 tw:sm:flex-wrap">
                  <div className="tw:flex tw:flex-col tw:min-w-0">
                    <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] tw:text-gray-400">
                      {t("ordered")}
                    </span>
                    <span className="tw:font-semibold tw:text-sm tw:text-gray-900 tw:tabular-nums tw:leading-tight tw:mt-0.5">
                      <DisplayQty
                        qty={product.quantity}
                        isLooseQty={product.isLooseQty}
                        uom={product.selectedStockUom}
                      />
                    </span>
                  </div>

                  {product.remainingQty > 0 && (
                    <div className="tw:flex tw:flex-col tw:min-w-0">
                      <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] tw:text-orange-600">
                        {t("pending")}
                      </span>
                      <span className="tw:font-semibold tw:text-sm tw:text-orange-700 tw:tabular-nums tw:leading-tight tw:mt-0.5">
                        <DisplayQty
                          qty={product.remainingQty}
                          isLooseQty={product.isLooseQty}
                          uom={product.selectedStockUom}
                        />
                      </span>
                    </div>
                  )}

                  {product.cancelledQty > 0 && (
                    <AppPopover
                      triggerContent={
                        <button
                          type="button"
                          className="tw:flex tw:flex-col tw:items-start tw:cursor-pointer hover:tw:opacity-80"
                        >
                          <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] tw:text-red-600">
                            {t("cancelled")}
                          </span>
                          <span className="tw:font-semibold tw:text-sm tw:text-red-700 tw:tabular-nums tw:leading-tight tw:mt-0.5 tw:inline-flex tw:items-center tw:gap-1">
                            <DisplayQty
                              qty={product.cancelledQty}
                              isLooseQty={product.isLooseQty}
                              uom={product.selectedStockUom}
                            />
                            <Info size={11} />
                          </span>
                        </button>
                      }
                    >
                      <CancellationPopoverContent
                        reasons={product.cancellationReasons}
                        isLooseQty={product.isLooseQty}
                        uom={product.selectedStockUom}
                      />
                    </AppPopover>
                  )}

                  <span className="tw:hidden tw:sm:block tw:h-8 tw:w-px tw:bg-gray-200 tw:self-end" aria-hidden />

                  {isOfferOfTheDay ? (
                    <>
                      <div className="tw:flex tw:flex-col tw:min-w-0">
                        <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] tw:text-orange-600 tw:inline-flex tw:items-center tw:gap-1">
                          <Tag size={10} />
                          {t("scheme")}
                        </span>
                        <span className="tw:font-semibold tw:text-sm tw:text-orange-700 tw:tabular-nums tw:leading-tight tw:mt-0.5">
                          <Amount value={product.price} decimalPlaces={2} />
                          {product.selectedStockUom && (
                            <span className="tw:text-[11px] tw:font-medium">/{product.selectedStockUom}</span>
                          )}
                        </span>
                      </div>
                      <div className="tw:flex tw:flex-col tw:min-w-0">
                        <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] tw:text-gray-400">
                          {t("mrp")}
                        </span>
                        <span className="tw:text-sm tw:text-gray-400 tw:line-through tw:tabular-nums tw:leading-tight tw:mt-0.5">
                          <Amount value={product.mrp} decimalPlaces={2} />
                          {product.selectedStockUom && (
                            <span className="tw:text-[11px]">/{product.selectedStockUom}</span>
                          )}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="tw:flex tw:flex-col tw:min-w-0">
                        <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] tw:text-gray-400 tw:inline-flex tw:items-center tw:gap-1">
                          {priceLabel || t("price")}
                          {product.isPriceSlab && (
                            <AppBadge variant="primary" className="tw:text-[9px]">
                              Slab
                            </AppBadge>
                          )}
                        </span>
                        <span className="tw:font-semibold tw:text-sm tw:text-gray-900 tw:tabular-nums tw:leading-tight tw:mt-0.5">
                          <Amount value={product.price} decimalPlaces={2} />
                          {product.selectedStockUom && (
                            <span className="tw:text-[11px] tw:font-medium tw:text-gray-500">
                              /{product.selectedStockUom}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="tw:flex tw:flex-col tw:min-w-0">
                        <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] tw:text-gray-400">
                          {t("mrp")}
                        </span>
                        <span className="tw:font-medium tw:text-sm tw:text-gray-700 tw:tabular-nums tw:leading-tight tw:mt-0.5">
                          <Amount value={product.mrp} decimalPlaces={2} />
                          {product.selectedStockUom && (
                            <span className="tw:text-[11px] tw:text-gray-500">/{product.selectedStockUom}</span>
                          )}
                        </span>
                      </div>
                    </>
                  )}

                  {product.status === "Pending" && (
                    <div className="tw:flex tw:flex-col tw:min-w-0">
                      <span
                        className={clsx(
                          "tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em]",
                          isMyOrder && !isKCStore && product.showAddStock
                            ? "tw:text-red-600"
                            : "tw:text-gray-400",
                        )}
                      >
                        {t("availableStock")}
                      </span>
                      <span
                        className={clsx(
                          "tw:font-semibold tw:text-sm tw:tabular-nums tw:leading-tight tw:mt-0.5",
                          isMyOrder && !isKCStore && product.showAddStock
                            ? "tw:text-red-700"
                            : "tw:text-gray-900",
                        )}
                      >
                        <DisplayQty
                          qty={product.dealDetails?.maxQty}
                          isLooseQty={product.isLooseQty}
                          uom={product.selectedStockUom}
                        />
                      </span>
                    </div>
                  )}
                </div>

                {/* Total — full-width row on mobile (separated by hairline), right column on desktop */}
                <div className="tw:flex tw:items-center tw:justify-between tw:pt-2.5 tw:border-t tw:border-gray-100 tw:sm:pt-0 tw:sm:border-0 tw:sm:block tw:sm:text-right">
                  <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] tw:text-gray-400">
                    {t("totalValue")}
                  </span>
                  <Amount
                    value={product.finalPrice}
                    decimalPlaces={2}
                    className="tw:font-bold tw:text-[17px] tw:text-gray-900 tw:tabular-nums tw:leading-tight tw:sm:block tw:sm:mt-0.5"
                  />
                </div>
              </div>

              {/* Price override note */}
              {product.overridePrice != null && (
                <div className="tw:mt-2 tw:flex tw:items-center tw:gap-1.5 tw:rounded tw:border tw:border-amber-200 tw:bg-amber-50 tw:px-2 tw:py-1 tw:text-[11px] tw:text-amber-800">
                  <PencilLine size={11} className="tw:shrink-0" />
                  <span className="tw:flex tw:flex-wrap tw:items-center tw:gap-1">
                    <span className="tw:font-medium">Price edited:</span>
                    <Amount
                      value={product.dealPrice}
                      decimalPlaces={2}
                      className="tw:text-gray-500 tw:line-through"
                    />
                    <ArrowRight size={10} className="tw:shrink-0" />
                    <Amount
                      value={product.overridePrice}
                      decimalPlaces={2}
                      className="tw:font-semibold"
                    />
                    {product.overridePriceBy?.name && (
                      <span className="tw:text-amber-700">
                        by {product.overridePriceBy.name}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {(() => {
                const showAdd =
                  isMyOrder && !isKCStore && product.showAddStock && product.status !== "Cancelled";
                const showCancel = product._showCancel && !needPaymentApproval;
                if (!showAdd && !showCancel) return null;
                return (
                  <div className="tw:mt-3 tw:pt-3 tw:border-t tw:border-dashed tw:border-gray-200 tw:flex tw:items-center tw:justify-end tw:gap-2 tw:flex-wrap">
                    {showAdd && (
                      <AppButton
                        color="primary"
                        fill="outline"
                        size="small"
                        onClick={() =>
                          callback({
                            action: "addStock",
                            data: product,
                          })
                        }
                      >
                        <Plus size={14} />
                        {t("addStock")}
                      </AppButton>
                    )}
                    {showCancel && (
                      <Rbac roles={rbacRoles.cancelOrder}>
                        <AppButton
                          color="danger"
                          fill="outline"
                          size="small"
                          onClick={() => handleCancelProduct(product)}
                        >
                          <XCircleIcon size={14} />
                          {t("cancelItem")}
                        </AppButton>
                      </Rbac>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}

      </AppCard>

      <CancelItemModal
        show={cancelItemModal.show}
        callback={handleCancelItemModalCallback}
        dealId={cancelItemModal.product?.dealId}
        dealRefId={cancelItemModal.product?.dealRefId}
        quantity={cancelItemModal.product?.remainingQty}
        dealName={cancelItemModal.product?.dealName}
        orderId={orderId}
      />
      {!isKCStore && (
        <MultipleAddStockModal
          show={multiAddModal.show}
          products={multiAddModal.data || []}
          callback={(res: { action: string; data?: any }) => {
            // close modal first
            if (res.action === "close") {
              setMultiAddModal({ show: false, data: null });
              return;
            }

            if (res.action === "submit") {
              // forward submit to parent to update order view
              callback({ action: "addStockMultiple", data: res.data });
              setMultiAddModal({ show: false, data: null });
              return;
            }

            // default: close
            setMultiAddModal({ show: false, data: null });
          }}
        />
      )}
    </>
  );
};

export default OrderProducts;
