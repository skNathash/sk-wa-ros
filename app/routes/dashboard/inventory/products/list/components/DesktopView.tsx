import clsx from "clsx";
import {
  Calendar,
  Eye,
  EyeIcon,
  Package,
  Plus,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppPopover from "~/components/core/popover/AppPopover";
import Rbac from "~/components/core/rbac/Rbac";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import ToggleProductStatus from "~/shared/catalog/components/toggle-product-status/ToggleProductStatus";
import PromotionalBadge from "~/shared/inventory/components/PromotionalBadge";
import ReserveBadge from "~/shared/inventory/components/ReserveBadge";
import DealScopeBadge from "~/shared/inventory/components/DealScopeBadge";
import type {
  SellerDeal,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";
import SubscribedBy from "./SubscribedBy";

const rbacRoles = {
  addStock: ["INVENTORY.ADD-STOCK"],
  view: ["INVENTORY.VIEW-INVENTORY"],
};

interface DesktopViewProps {
  data: Array<SellerDeal & { _animate?: boolean }>;
  callback: (a: { action: string; data: SellerDeal }) => void;
  loading?: boolean;
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: { key: string; value: SortValue }) => void;
  loadedCount: number;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  animate?: boolean;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  callback,
  loading = false,
  sortKey,
  sortValue,
  onSort,
  loadedCount,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
}) => {
  const { t } = useTranslation(["common"]);

  const headers: TableHeaderItem[] = [
    {
      label: t("product"),
      key: "dealName",
      width: "24%",
      enableSort: true,
    },

    {
      label: t("stockStatus"),
      key: "quantity",
      width: "10%",
    },
    {
      label: t("inventoryValue"),
      key: "inventoryValue",
      width: "9%",
      enableSort: true,
    },
    {
      label: t("openPO"),
      key: "openPoAnalytics.totalOpenPos",
      width: "8%",
      isCentered: true,
      enableSort: true,
    },
    { label: t("activity"), key: "activity", width: "10%" },
    { label: t("location"), key: "location", width: "10%" },
    { label: t("status"), key: "status", width: "6%" },
    { label: t("action"), key: "action" },
  ];

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <div>
      <AppTable
        container
        responsive
        fixedLayout
        minWidth="1400px"
        containerStyle={containerStyle}
        stickyHeader
        condensed
      >
        <AppTable.Header>
          <TableHeader
            headers={headers}
            onSort={onSort}
            sortKey={sortKey}
            sortValue={sortValue}
          />
        </AppTable.Header>

        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={20} />
          ) : data.length === 0 ? (
            <AppTable.Row>
              <AppTable.Cell colSpan={headers.length}>
                <NoData />
              </AppTable.Cell>
            </AppTable.Row>
          ) : (
            data.map((item, index) => {
              return (
                <AppTable.Row
                  key={`${item._id}-${index}`}
                  className={clsx("tw:hover:bg-gray-50", {
                    "highlight-animate": item._animate,
                  })}
                >
                  {/* Product Column */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:items-center tw:gap-3">
                      <div className="tw:w-14 tw:h-14 tw:bg-gray-200 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:overflow-hidden tw:relative">
                        {item.consumerOffer?.enabled ? (
                          <div className="tw:absolute tw:left-1 tw:top-1">
                            <ConsumerOfferBadge />
                          </div>
                        ) : null}
                        {item.images && item.images.length > 0 ? (
                          <ImgRender
                            assetId={item.images[0]}
                            className="tw:w-full tw:h-full tw:object-cover tw:rounded-lg"
                            alt={item.name}
                          />
                        ) : (
                          <Package className="tw:w-6 tw:h-6 tw:text-gray-500" />
                        )}
                        {item.isPromotionalDeal && (
                          <div className="tw:absolute tw:bottom-1 tw:right-1">
                            <PromotionalBadge />
                          </div>
                        )}
                      </div>
                      <div className="tw:flex tw:flex-col tw:flex-1">
                        <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                          <AppLink
                            href={`/dashboard/inventory/products/view/${item._id}`}
                            className="tw:font-medium tw:text-blue-600 tw:line-clamp-2 tw:flex tw:items-center tw:gap-1"
                            asLink
                            title={item.name}
                          >
                            {item.name}
                          </AppLink>
                          <DealScopeBadge isLocalDeal={item.isLocalDeal} />
                        </div>
                        <span className="tw:text-slate-600 tw:text-xs">
                          {item.brand?.name}
                        </span>
                        <span className="tw:text-slate-500 tw:text-xs">
                          ID: {item.id}
                        </span>
                        <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                          <span className="tw:text-slate-800 tw:text-xs">
                            HSN: {item.hsn || "--"}
                          </span>
                          <span className="tw:text-slate-800 tw:text-xs">
                            GST: {item.gst}%
                          </span>
                        </div>

                        {item?.subscribedBy?.type === "Customer" ? (
                          <SubscribedBy
                            subscribedBy={(item as any).subscribedBy}
                            popoverSide="left"
                          />
                        ) : null}
                      </div>
                    </div>
                  </AppTable.Cell>
                  {/* Stock Status Column */}
                  <AppTable.Cell>
                    <div
                      className="tw:flex tw:flex-col tw:gap-1"
                      title={t("stock")}
                    >
                      <div className="tw:flex tw:items-center tw:gap-1.5">
                        <span
                          className={`tw:text-sm tw:font-medium tw:leading-none ${
                            (item.actualMaxQty ?? 0) === 0
                              ? "tw:text-red-500"
                              : "tw:text-slate-800"
                          }`}
                        >
                          <DisplayQty
                            qty={Number(item.actualMaxQty) || 0}
                            isLooseQty={false}
                            uom={(item as any).selectedStockUom}
                          />
                        </span>
                        {item.isReserve && <ReserveBadge />}
                      </div>
                      {(!(item as any).selectedStockUom ||
                        String((item as any).selectedStockUom).toLowerCase() ===
                          "unit") && (
                        <div className="tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:leading-none">
                          <span className="tw:text-gray-500 tw:font-semibold tw:uppercase tw:tracking-wide">
                            <SellingTypeDisplay
                              sellingType={item.sellingType || "Unit"}
                            />
                          </span>
                          <CaseQtyPopover
                            packageQty={item.packageQty || 0}
                            sellingType={item.sellingType || "Unit"}
                          />
                        </div>
                      )}
                    </div>
                  </AppTable.Cell>
                  {/* Inventory Value Column */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:flex-col tw:gap-1 tw:mb-1">
                      <Amount
                        value={item.inventoryValue || 0}
                        className="tw:font-semibold tw:text-gray-900 tw:text-sm"
                      />
                      <div className="tw:text-gray-500 tw:text-xs">
                        {t("purPrice")}:{" "}
                        <Amount value={item.purchasePrice} showSymbol={false} />
                      </div>
                    </div>
                    <AppBadge
                      variant={item._movementTypeColor || "light"}
                      className="tw:w-fit tw:flex tw:items-center tw:gap-1"
                    >
                      <TrendingUp />
                      {item.movementType || t("normal")}
                    </AppBadge>
                  </AppTable.Cell>
                  {/* PO Status Column */}
                  <AppTable.Cell className="tw:text-center">
                    {item.openPoAnalytics?.totalOpenPos > 0 ? (
                      <button
                        className="tw:cursor-pointer tw:hover:bg-gray-100 tw:rounded tw:px-2 tw:py-1"
                        onClick={() =>
                          callback({ action: "open-po", data: item })
                        }
                      >
                        <AppBadge variant="light">
                          {item.openPoAnalytics.totalOpenPos} {t("order")}
                          {item.openPoAnalytics.totalOpenPos > 1 ? "s" : ""}
                        </AppBadge>
                      </button>
                    ) : (
                      <span className="tw:text-gray-400">{t("none")}</span>
                    )}
                  </AppTable.Cell>
                  {/* Activity Column */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <ShoppingCart className="tw:w-4 tw:h-4 tw:text-gray-500" />
                      <div className="tw:text-slate-500 tw:text-xs tw:flex tw:flex-col">
                        <div className="tw:flex tw:gap-1 tw:items-center">
                          {item.salesAnalytics?.last7Days?.quantity || 0} units
                          <AppPopover
                            triggerContent={
                              <button className="tw:cursor-pointer">
                                <EyeIcon size={14} />
                              </button>
                            }
                            side="right"
                            align="center"
                          >
                            <DealSummaryPopover
                              salesAnalytics={item.salesAnalytics}
                            />
                          </AppPopover>
                        </div>
                        <div>{t("last7dSales")}</div>
                      </div>
                    </div>

                    {/* Near Expiry Block */}
                    {item._raw?.nearExpiry?.desc ? (
                      <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
                        <Calendar className="tw:w-4 tw:h-4 tw:text-orange-500" />
                        <span className="tw:text-slate-500 tw:text-xs">
                          {item._raw.nearExpiry.desc}
                        </span>
                      </div>
                    ) : null}
                  </AppTable.Cell>

                  {/* Location Column */}
                  <AppTable.Cell>
                    <LocationsBlock locations={item.locations} />
                  </AppTable.Cell>

                  {/* Status Column */}
                  <AppTable.Cell>
                    <AppBadge
                      variant={item.status === "Active" ? "success" : "danger"}
                    >
                      {item.status}
                    </AppBadge>
                  </AppTable.Cell>
                  {/* Action Column */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:items-center tw:gap-2">
                      {item.isKCStoreEnabled ? (
                        <AppBadge
                          variant="primary"
                          className="tw:text-xs tw:px-2 tw:py-1 tw:whitespace-nowrap"
                        >
                          KC Store
                        </AppBadge>
                      ) : (
                        <Rbac roles={rbacRoles.addStock}>
                          <AppButton
                            size="small"
                            fill="outline"
                            color="light"
                            onClick={() =>
                              callback({ action: "add-stock", data: item })
                            }
                          >
                            <Plus className="tw:w-3 tw:h-3" />
                            {t("addStock")}
                          </AppButton>
                        </Rbac>
                      )}
                      <Rbac roles={rbacRoles.view}>
                        <AppButton
                          size="small"
                          fill="outline"
                          color="light"
                          onClick={() =>
                            callback({ action: "view", data: item })
                          }
                        >
                          <Eye className="tw:w-4 tw:h-4" />
                          {t("view")}
                        </AppButton>
                      </Rbac>
                      {/* Toggle status button placed after view button - hidden for KC Store */}
                      {!item.isKCStoreEnabled ? (
                        <ToggleProductStatus
                          dealId={item._raw?._id}
                          status={String(item.status)}
                          size="small"
                          callback={(res) => {
                            if (res?.action === "submit") {
                              callback({
                                action: "status-updated",
                                data: {
                                  ...item,
                                  status:
                                    item.status === "Active"
                                      ? "Inactive"
                                      : "Active",
                                },
                              });
                            }
                          }}
                        />
                      ) : null}
                    </div>
                  </AppTable.Cell>
                </AppTable.Row>
              );
            })
          )}
          {showLoadMore && !loading && data.length > 0 ? (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center tw:py-4"
              >
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={totalCount}
                  loadedCount={loadedCount}
                />
              </AppTable.Cell>
            </AppTable.Row>
          ) : null}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
