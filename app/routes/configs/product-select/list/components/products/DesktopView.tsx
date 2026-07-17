import { useMemo } from "react";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import { Plus, Trash, MoreVertical } from "lucide-react";
import type { ProductItemType } from "../../helper";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import ImgRender from "~/components/core/img/ImgRender";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppBadge from "~/components/core/badge/AppBadge";
import AppPopover from "~/components/core/popover/AppPopover";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";
import ReserveBadge from "~/shared/inventory/components/ReserveBadge";
import PromotionalBadge from "~/shared/inventory/components/PromotionalBadge";

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

type Props = {
  data: ProductItemType[];
  loading: boolean;
  callback: (args: { action: string; data: ProductItemType }) => void;
  sortKey: string;
  sortValue: string;
  onSort: (key: string) => void;
  feature: string;
  loadedCount?: number;
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount?: number;
  showCheckbox?: boolean;
  selectedIds?: string[];
  disabled?: boolean;
  onToggle?: (checked: boolean, data: ProductItemType) => void;
};

const DesktopView = ({
  data,
  loading,
  callback,
  sortKey,
  sortValue,
  onSort,
  feature,
  loadedCount = 0,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  showCheckbox = false,
  selectedIds = [],
  disabled = false,
  onToggle,
}: Props) => {
  const headers = useMemo(() => {
    const widthMap: Record<string, string> = {
      select: "5%",
      image: "5%",
      name: "25%",
      sellingType: "15%",
      mrp: "10%",
      b2bPrice: "10%",
      inStock: "10%",
      sales: "10%",
      action: "8%",
    };

    const base: TableHeaderItem[] = [];

    if (showCheckbox) {
      base.push({ label: "", key: "select", width: widthMap.select });
    }

    base.push({ label: "Image", key: "image", width: widthMap.image });
    base.push({ label: "Name", key: "name", width: widthMap.name });

    if (feature === "PackUpdate") {
      base.push({
        label: "Sell In",
        key: "sellingType",
        width: widthMap.sellingType,
      });
    }

    // split pricing into separate columns
    base.push({ label: "MRP", key: "mrp", width: widthMap.mrp });
    base.push({
      label: "B2B Price",
      key: "b2bPrice",
      width: widthMap.b2bPrice,
    });
    base.push({ label: "In Stock", key: "inStock", width: widthMap.inStock });
    base.push({ label: "Sales (7d)", key: "sales", width: widthMap.sales });
    base.push({
      label: "Action",
      key: "action",
      width: widthMap.action,
      isCentered: true,
    });

    return base;
  }, [feature]);

  if (!loading && (!data || data.length === 0)) {
    return <NoData />;
  }

  return (
    <AppTable
      container
      responsive
      fixedLayout
      minWidth="1000px"
      containerStyle={containerStyle}
      stickyHeader
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
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
          data.map((item) => {
            const isB2bPriceNotConfigured =
              feature === "PriceUpdate" && !item.isB2bMarginConfigured;

            return (
            <AppTable.Row key={item._id}>
              {/** Select checkbox cell */}
              {showCheckbox ? (
                <AppTable.Cell>
                  <input
                    type="checkbox"
                    checked={!!selectedIds?.includes(item._id)}
                    disabled={
                      (disabled ||
                        !!item.isInCart ||
                        (isB2bPriceNotConfigured)) &&
                      !selectedIds?.includes(item._id)
                    }
                    onChange={(e) =>
                      onToggle && onToggle(e.target.checked, item)
                    }
                    className="tw:w-4 tw:h-4"
                  />
                </AppTable.Cell>
              ) : null}

              <AppTable.Cell>
                <div className="tw:h-12 tw:rounded tw:flex tw:items-center tw:justify-center tw:border tw:border-gray-200 tw:p-1">
                  <ImgRender
                    assetId={item.images?.[0]}
                    alt={item.name}
                    size="100x100"
                    className="tw:object-cover tw:w-full tw:h-full"
                  />
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <AppLink
                      asLink
                      href={`/dashboard/inventory/products/view/${item._id}`}
                    >
                      <div className="tw:text-sm tw:font-medium tw:line-clamp-2">
                        {item.name}
                      </div>
                    </AppLink>
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    ID: {item.id}
                  </div>
                </div>
              </AppTable.Cell>

              {feature === "PackUpdate" && (
                <AppTable.Cell>
                  <AppBadge variant={item.sellingTypeColor || "light"}>
                    <SellingTypeDisplay sellingType={item.sellingType} /> {!item.sellingType && "-"}
                  </AppBadge>
                  <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                    {item.packageQty || 0} units
                  </div>
                </AppTable.Cell>
              )}

              <AppTable.Cell>
                <DisplayPrice price={item.mrp} uom={(item as any).selectedStockUom} />
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:mb-1">
                  <DisplayPrice price={item.b2bPrice} uom={(item as any).selectedStockUom} />
                </div>
                {item.b2bScheme?.status !== "None" &&
                  feature === "PriceUpdate" && (
                    <AppBadge variant={item.b2bScheme?.statusColor}>
                      Scheme: {item.b2bScheme?.status}
                    </AppBadge>
                  )}
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-1">
                  <span
                    className={
                      item.actualMaxQty === 0
                        ? "tw:text-red-600"
                        : "tw:text-green-600"
                    }
                  >
                    {item.actualMaxQty || 0} units
                  </span>
                  {item.isReserve && <ReserveBadge />}
                  {item.isPromotionalDeal && <PromotionalBadge />}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-1">
                  <span className="tw:text-xs tw:font-medium tw:text-slate-700 tw:-mt-0.5">
                    {item.salesAnalytics?.last7Days?.quantity || 0} units
                  </span>
                  <AppPopover
                    triggerContent={
                      <button
                        type="button"
                        className="tw:cursor-pointer tw:text-slate-500 tw:hover:text-slate-700 tw:flex tw:items-center tw:-mt-0.5"
                      >
                        <MoreVertical size={14} />
                      </button>
                    }
                  >
                    <DealSummaryPopover salesAnalytics={item.salesAnalytics} />
                  </AppPopover>
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center">
                {item.isLoading ? (
                  <AppSpinner className="tw:w-4 tw:h-4" />
                ) : item.isInCart ? (
                  <AppButton
                    size="small"
                    color="danger"
                    fill="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      callback({ action: "remove-from-cart", data: item });
                    }}
                  >
                    <Trash size={14} />
                  </AppButton>
                ) : isB2bPriceNotConfigured ? (
                  <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
                    <span className="tw:text-[10px] tw:text-red-500 tw:leading-none tw:text-center">
                      B2B price missing
                    </span>
                    <AppButton
                      size="small"
                      color="dark"
                      fill="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        callback({ action: "config-b2b", data: item });
                      }}
                    >
                      Config
                    </AppButton>
                  </div>
                ) : (
                  <AppButton
                    size="small"
                    color="primary"
                    onClick={(e) => {
                      e.preventDefault();
                      callback({ action: "add-to-cart", data: item });
                    }}
                  >
                    <Plus size={14} />
                  </AppButton>
                )}
              </AppTable.Cell>
            </AppTable.Row>
          );})
        )}
        {showLoadMore && !loading && data.length > 0 && (
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
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
