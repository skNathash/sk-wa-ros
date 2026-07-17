import { Eye, Package, ShoppingCart, TrendingUp, Plus } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppPopover from "~/components/core/popover/AppPopover";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";
import type {
  SellerDeal,
  TableHeaderItem,
  SortValue,
} from "~/types/CommonTypes";

interface DesktopViewProps {
  data: SellerDeal[];
  callback: (a: { action: string; data: SellerDeal }) => void;
  loading?: boolean;
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: { key: string; value: SortValue }) => void;
}

const headers: TableHeaderItem[] = [
  {
    label: "Product",
    key: "name",
    width: "22%",
    langKey: "product",
    enableSort: true,
  },
  {
    label: "Brand",
    key: "brand",
    width: "12%",
    langKey: "brand",
    enableSort: true,
  },
  {
    label: "Category",
    key: "category",
    width: "12%",
    langKey: "category",
    enableSort: true,
  },
  {
    label: "Stock",
    key: "stock",
    width: "10%",
    langKey: "stock",
    enableSort: true,
  },
  {
    label: "Inventory Value",
    key: "inventoryValue",
    width: "12%",
    enableSort: true,
    langKey: "inventoryValue",
  },
  {
    label: "Shelf Life",
    key: "shelfLife",
    width: "10%",
    langKey: "shelfLife",
    enableSort: true,
  },
  {
    label: "Last Sale",
    key: "lastSale",
    width: "10%",
    langKey: "lastSale",
    enableSort: true,
  },
  { label: "Actions", key: "actions", width: "15%", langKey: "actions" },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  callback,
  loading = false,
  sortKey,
  sortValue,
  onSort,
}) => {
  return (
    <AppTable container responsive fixedLayout minWidth="1400px">
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
          <TableSkeletonLoader cols={headers.length} />
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item) => {
            return (
              <AppTable.Row key={item._id} className="tw:hover:bg-gray-50">
                {/* Product */}
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-3">
                    <div className="tw:w-14 tw:h-14 tw:bg-gray-200 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <ImgRender
                          assetId={item.images[0]}
                          className="tw:w-full tw:h-full tw:object-cover tw:rounded-lg"
                          alt={item.name}
                        />
                      ) : (
                        <Package className="tw:w-6 tw:h-6 tw:text-gray-500" />
                      )}
                    </div>
                    <div className="tw:flex tw:flex-col tw:flex-1">
                      <AppLink
                        href={`/dashboard/inventory/products/view/${item._id}`}
                        className="tw:font-medium tw:text-blue-600 tw:text-sm tw:line-clamp-2"
                        asLink
                      >
                        {item.name}
                      </AppLink>
                      <span className="tw:text-slate-500 tw:text-xs">
                        {item.id}
                      </span>
                    </div>
                  </div>
                </AppTable.Cell>
                {/* Brand */}
                <AppTable.Cell>
                  <span className="tw:text-slate-600 tw:text-sm">
                    {item.brand?.name || "-"}
                  </span>
                </AppTable.Cell>
                {/* Category */}
                <AppTable.Cell>
                  <span className="tw:text-slate-600 tw:text-sm">
                    {item.category?.name || "-"}
                  </span>
                </AppTable.Cell>
                {/* Stock */}
                <AppTable.Cell>
                  <span
                    className={`tw:text-sm tw:font-medium ${
                      item.maxQty <= 0 ? "tw:text-red-600" : "tw:text-gray-900"
                    }`}
                  >
                    {item.maxQty}{" "}
                    <span className="tw:text-gray-500 tw:text-xs">units</span>
                  </span>
                </AppTable.Cell>
                {/* Inventory Value */}
                <AppTable.Cell>
                  <Amount
                    value={item.inventoryValue || 0}
                    className="tw:font-semibold tw:text-gray-900 tw:text-sm"
                  />
                  <div className="tw:text-gray-500 tw:text-xs">
                    MRP: <Amount value={item.mrp} showSymbol={false} />
                  </div>
                </AppTable.Cell>
                {/* Shelf Life */}
                <AppTable.Cell>
                  {item.shelfLifeInfo?.remainingShelfLifeDays !== null ? (
                    <div className="tw:flex tw:flex-col tw:gap-1">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <span
                          className={`tw:text-sm tw:font-medium ${
                            item.shelfLifeInfo?.isNearExpiry
                              ? "tw:text-red-600"
                              : "tw:text-green-600"
                          }`}
                        >
                          {item.shelfLifeInfo?.remainingShelfLifeDays || 0} days
                          left
                        </span>
                      </div>
                      {item.shelfLifeInfo?.expiryDate && (
                        <span className="tw:text-gray-500 tw:text-xs">
                          Expires:{" "}
                          {new Date(
                            item.shelfLifeInfo.expiryDate
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="tw:text-slate-600 tw:text-sm">-</span>
                  )}
                </AppTable.Cell>
                {/* Last Sale */}
                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col tw:gap-1">
                    <div className="tw:flex tw:gap-1 tw:items-center">
                      {item.salesAnalytics?.last7Days?.quantity || 0} units
                      <AppPopover
                        triggerContent={
                          <button className="tw:cursor-pointer">
                            <Eye size={14} />
                          </button>
                        }
                      >
                        <DealSummaryPopover
                          salesAnalytics={item.salesAnalytics}
                        />
                      </AppPopover>
                    </div>
                    <div className="tw:text-gray-500 tw:text-xs">
                      Last 7d sales
                    </div>
                  </div>
                </AppTable.Cell>
                {/* Actions */}
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    {/* <AppButton
                      size="small"
                      fill="outline"
                      color="light"
                      onClick={() => callback({ action: "basket", data: item })}
                    >
                      <ShoppingCart className="tw:w-3 tw:h-3" />
                      Basket
                    </AppButton> */}
                    <AppButton
                      size="small"
                      fill="outline"
                      color="light"
                      onClick={() =>
                        callback({ action: "add-stock", data: item })
                      }
                    >
                      <Plus className="tw:w-3 tw:h-3" />
                      Add Stock
                    </AppButton>
                    <AppButton
                      size="small"
                      fill="outline"
                      color="light"
                      onClick={() => callback({ action: "view", data: item })}
                    >
                      <Eye className="tw:w-4 tw:h-4" />
                      Details
                    </AppButton>
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
