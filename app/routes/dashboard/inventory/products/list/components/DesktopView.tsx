import clsx from "clsx";
import { Calendar, Eye, Package, Plus } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import ToggleProductStatus from "~/shared/catalog/components/toggle-product-status/ToggleProductStatus";
import DealScopeBadge from "~/shared/inventory/components/DealScopeBadge";
import PromotionalBadge from "~/shared/inventory/components/PromotionalBadge";
import ReserveBadge from "~/shared/inventory/components/ReserveBadge";
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

// Movement reads as a quality of the stock figure, not a separate fact, so it
// tints a word under the quantity instead of taking a column. "Normal" is the
// baseline and stays unmarked — twenty rows shouldn't read as twenty flags.
const MOVEMENT_TONE: Record<string, string> = {
  "fast moving": "tw:text-emerald-700",
  "slow moving": "tw:text-amber-700",
  "non-moving": "tw:text-rose-600",
};

// Fallback tile tints when a product has no image. Picked by name so a product
// keeps the same colour across renders and pages — the tile becomes a weak
// recognition cue while scanning, not decoration.
const TILE_TINTS = [
  "tw:bg-amber-100 tw:text-amber-800",
  "tw:bg-orange-100 tw:text-orange-800",
  "tw:bg-emerald-100 tw:text-emerald-800",
  "tw:bg-sky-100 tw:text-sky-800",
  "tw:bg-violet-100 tw:text-violet-800",
  "tw:bg-rose-100 tw:text-rose-800",
];

const tintFor = (name: string) => {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return TILE_TINTS[sum % TILE_TINTS.length];
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
      label: t("item"),
      key: "dealName",
      width: "18%",
      enableSort: true,
    },
    {
      label: t("brand"),
      key: "brand",
      width: "10%",
    },
    {
      label: `${t("category")} · ${t("bin")}`,
      key: "category",
      width: "9%",
    },
    {
      label: t("purPrice"),
      key: "purchasePrice",
      width: "9%",
      isRightAligned: true,
    },
    {
      label: t("stock"),
      key: "quantity",
      width: "9%",
      isRightAligned: true,
      enableSort: true,
    },
    {
      label: "7D Sales",
      key: "salesAnalytics.last7Days.quantity",
      width: "7%",
      isRightAligned: true,
      enableSort: true,
    },
    {
      label: t("stockValue"),
      key: "inventoryValue",
      width: "10%",
      isRightAligned: true,
      enableSort: true,
    },
    { label: t("action"), key: "action", width: "25%" },
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
        minWidth="1500px"
        containerStyle={containerStyle}
        stickyHeader
        condensed
      >
        <AppTable.Header>
          <TableHeader
            className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-500"
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
              const stock = Number(item.actualMaxQty) || 0;
              const isOutOfStock = stock === 0;
              const buyPrice = Number(item.purchasePrice) || 0;
              const brandName =
                (item.brand as any)?._displayName || item.brand?.name || "";
              const movementTone =
                MOVEMENT_TONE[(item.movementType || "").toLowerCase()];
              const categoryName =
                item.category?._displayName || item.category?.name || "";
              const hasLocations = (item.locations as any)?.length > 0;
              const initials = (item.name || "").trim().slice(0, 5);
              const openPos = item.openPoAnalytics?.totalOpenPos || 0;
              const last7 = (item as any).salesAnalytics?.last7Days;
              const last7Qty = Number(last7?.quantity) || 0;
              const last7Value = Number(last7?.value) || 0;

              return (
                <AppTable.Row
                  key={`${item._id}-${index}`}
                  className={clsx("tw:group tw:hover:bg-slate-50", {
                    "highlight-animate": item._animate,
                  })}
                >
                  {/* Item — thumb, name, and the identifiers that qualify it. */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:items-center tw:gap-3">
                      <div
                        className={clsx(
                          "tw:relative tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-lg",
                          item.images?.length
                            ? "tw:bg-slate-100"
                            : tintFor(item.name || ""),
                          isOutOfStock && "tw:opacity-70 tw:grayscale",
                        )}
                      >
                        {item.consumerOffer?.enabled ? (
                          <div className="tw:absolute tw:left-0.5 tw:top-0.5">
                            <ConsumerOfferBadge />
                          </div>
                        ) : null}
                        {item.images && item.images.length > 0 ? (
                          <ImgRender
                            assetId={item.images[0]}
                            className="tw:h-full tw:w-full tw:object-cover"
                            alt={item.name}
                          />
                        ) : initials ? (
                          <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-tight">
                            {initials}
                          </span>
                        ) : (
                          <Package className="tw:h-5 tw:w-5 tw:text-slate-400" />
                        )}
                        {item.isPromotionalDeal && (
                          <div className="tw:absolute tw:bottom-0.5 tw:right-0.5">
                            <PromotionalBadge />
                          </div>
                        )}
                      </div>

                      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <AppLink
                            href={`/dashboard/inventory/products/view/${item._id}`}
                            className="tw:line-clamp-1 tw:text-sm tw:font-medium tw:text-slate-800 tw:transition-colors tw:hover:text-primary"
                            asLink
                            noUnderline
                            title={item.name}
                          >
                            {item.name}
                          </AppLink>
                          <DealScopeBadge isLocalDeal={item.isLocalDeal} />
                          {item.status !== "Active" ? (
                            <span
                              className="tw:h-2 tw:w-2 tw:shrink-0 tw:rounded-full tw:bg-red-500"
                              title={String(item.status)}
                              aria-label={String(item.status)}
                            />
                          ) : null}
                        </div>

                        {/* Quietest line — reference detail, not a signal. */}
                        <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:leading-tight tw:text-slate-500">
                          <span>
                            {t("hsn")} {item.hsn || "--"}
                          </span>
                          <span aria-hidden className="tw:text-slate-300">
                            ·
                          </span>
                          <span>
                            {t("gst")} {item.gst || 0}%
                          </span>
                        </div>

                        {item._raw?.nearExpiry?.desc ? (
                          <div className="tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-medium tw:leading-tight tw:text-amber-700">
                            <Calendar size={12} className="tw:shrink-0" />
                            <span className="tw:truncate">
                              {item._raw.nearExpiry.desc}
                            </span>
                          </div>
                        ) : null}

                        {openPos > 0 ? (
                          <button
                            className="tw:w-fit tw:cursor-pointer"
                            onClick={() =>
                              callback({ action: "open-po", data: item })
                            }
                          >
                            <AppBadge variant="light">
                              {openPos} {t("openPO")}
                            </AppBadge>
                          </button>
                        ) : null}

                        {item?.subscribedBy?.type === "Customer" ? (
                          <SubscribedBy
                            subscribedBy={(item as any).subscribedBy}
                            popoverSide="left"
                          />
                        ) : null}
                      </div>
                    </div>
                  </AppTable.Cell>

                  {/* Brand */}
                  <AppTable.Cell>
                    <span className="tw:line-clamp-1 tw:text-xs tw:text-slate-600">
                      {brandName || "--"}
                    </span>
                  </AppTable.Cell>

                  {/* Category · Bin — where it belongs and where it sits. */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-0.5 tw:text-xs tw:text-slate-500">
                      <span className="tw:truncate" title={categoryName}>
                        {categoryName || "--"}
                      </span>
                      {hasLocations ? (
                        <LocationsBlock
                          locations={item.locations}
                          dealId={item.id}
                          small
                        />
                      ) : null}
                    </div>
                  </AppTable.Cell>

                  {/* Buy price */}
                  <AppTable.Cell className="tw:text-right">
                    <Amount
                      value={buyPrice}
                      className="tw:text-sm tw:text-slate-700"
                    />
                  </AppTable.Cell>

                  {/* Stock, with how fast it moves reading under it. */}
                  <AppTable.Cell className="tw:text-right">
                    <div className="tw:flex tw:flex-col tw:items-end tw:gap-0.5">
                      <div className="tw:flex tw:items-center tw:gap-1.5">
                        <span
                          className={clsx(
                            "tw:text-sm tw:font-semibold",
                            isOutOfStock
                              ? "tw:text-rose-600"
                              : "tw:text-slate-900",
                          )}
                        >
                          <DisplayQty
                            qty={stock}
                            isLooseQty={false}
                            uom={(item as any).selectedStockUom}
                          />
                        </span>
                        {item.isReserve && <ReserveBadge />}
                      </div>
                      {movementTone ? (
                        <span
                          className={clsx(
                            "tw:text-[10px] tw:font-medium tw:leading-none",
                            movementTone,
                          )}
                        >
                          {item.movementType}
                        </span>
                      ) : null}
                    </div>
                  </AppTable.Cell>

                  {/* Last 7 days — units sold on top, what they earned under. */}
                  <AppTable.Cell className="tw:text-right">
                    <div className="tw:flex tw:flex-col tw:items-end tw:gap-0.5">
                      <span
                        className={clsx(
                          "tw:text-sm tw:font-medium",
                          last7Qty > 0
                            ? "tw:text-slate-900"
                            : "tw:text-slate-400",
                        )}
                      >
                        <DisplayQty
                          qty={last7Qty}
                          isLooseQty={false}
                          uom={(item as any).selectedStockUom}
                        />
                      </span>
                      {last7Qty > 0 ? (
                        <Amount
                          value={last7Value}
                          decimalPlaces={0}
                          className="tw:text-[11px] tw:leading-none tw:text-slate-500"
                        />
                      ) : null}
                    </div>
                  </AppTable.Cell>

                  {/* Stock value — the row's bottom line. */}
                  <AppTable.Cell className="tw:text-right">
                    <Amount
                      value={item.inventoryValue || 0}
                      decimalPlaces={0}
                      className="tw:text-sm tw:font-semibold tw:text-slate-900"
                    />
                  </AppTable.Cell>

                  {/* Actions — always visible, labelled buttons. */}
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
