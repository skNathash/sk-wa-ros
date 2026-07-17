import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type {
  SellerDeal,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";
import GstPayableInfo from "./GstPayableInfo";

interface DesktopViewProps {
  data: Array<any>;
  loading?: boolean;
  callback?: (payload: { action: string; data: any }) => void;
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: { key: string; value: SortValue }) => void;
  loadedCount: number;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const headers: TableHeaderItem[] = [
  {
    label: "S.No",
    key: "sno",
    width: "3%",
    langKey: "sNo",
  },
  {
    label: "Product",
    key: "dealName",
    width: "18%",
    enableSort: true,
    langKey: "product",
  },

  {
    label: "Menu",
    key: "menuName",
    width: "9%",
    langKey: "menu",
  },

  {
    label: "HSN Code",
    key: "quantity",
    width: "6%",
    langKey: "hsnCode",
  },
  {
    label: "GST Rate",
    key: "gstRate",
    langKey: "gstRate",
    width: "5%",
    enableSort: true,
  },
  {
    label: "GST Collected",
    key: "gstCollected",
    langKey: "gstCollected",
    width: "8%",
    isCentered: true,
    enableSort: true,
  },
  {
    label: "GST Inward",
    key: "gstInward",
    langKey: "gstInward",
    width: "8%",
    isCentered: true,
    enableSort: true,
  },
  {
    label: "Net GST Payable",
    key: "netGstPayable",
    langKey: "netGstPayable",
    width: "8%",
    isCentered: true,
    enableSort: true,
  },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  loading = false,
  sortKey,
  sortValue,
  onSort,
  loadedCount,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  callback,
}) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <div>
      <AppTable
        container
        responsive
        fixedLayout
        minWidth="1000px"
        containerStyle={containerStyle}
        stickyHeader
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
          {loading ? <TableSkeletonLoader cols={headers.length} /> : null}

          {data.map((item, index) => {
            return (
              <AppTable.Row key={item._id} className="tw:hover:bg-gray-50">
                <AppTable.Cell>{index + 1}</AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:mb-1">
                    <AppLink
                      href={`/dashboard/inventory/products/view/${item._id}`}
                      asLink
                    >
                      {item.name}
                    </AppLink>
                  </div>

                  <div className="tw:flex tw:gap-1">
                    {item.refId && (
                      <AppBadge variant="light" className="tw:text-slate-500">
                        ID: {item.refId}
                      </AppBadge>
                    )}
                    {item.brandName && (
                      <span
                        className="tw:inline-block tw:cursor-pointer"
                        onClick={() =>
                          callback &&
                          callback({
                            action: "brand",
                            data: { id: item.brandId, name: item.brandName },
                          })
                        }
                      >
                        <AppBadge variant="light" className="tw:text-slate-500">
                          {item.brandName}
                        </AppBadge>
                      </span>
                    )}
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  <div className="tw:flex tw:gap-1 tw:flex-wrap tw:text-xs">
                    <span
                      className="tw:cursor-pointer tw:text-blue-600"
                      onClick={() =>
                        callback &&
                        callback({
                          action: "menu",
                          data: { id: item.menuId, name: item.menuName },
                        })
                      }
                    >
                      {item.menuName}
                    </span>
                    <span>/</span>
                    <span
                      className="tw:cursor-pointer tw:text-blue-600"
                      onClick={() =>
                        callback &&
                        callback({
                          action: "category",
                          data: {
                            id: item.categoryId,
                            name: item.categoryName,
                          },
                        })
                      }
                    >
                      {item.categoryName}
                    </span>
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  <span className="tw:text-xs">{item.hsnCode || "-"}</span>
                </AppTable.Cell>
                <AppTable.Cell>
                  {item.gstRate != null ? `${item.gstRate || "0"}%` : "-"}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <Amount
                    value={item.gstCollected || 0}
                    className="tw:text-green-600 tw:font-bold"
                  />
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <Amount
                    value={item.gstInward || 0}
                    className="tw:text-orange-600 tw:font-bold"
                  />
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:text-center tw:flex tw:items-center tw:justify-center tw:gap-2">
                    <Amount
                      value={item.netGstPayable || 0}
                      className={
                        (item.netGstPayable || 0) > 0
                          ? "tw:text-green-600 tw:font-bold"
                          : (item.netGstPayable || 0) < 0
                            ? "tw:text-red-600 tw:font-bold"
                            : "tw:text-gray-600 tw:font-bold"
                      }
                    />

                    <GstPayableInfo netGst={item.netGstPayable || 0} />
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })}
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
    </div>
  );
};

export default DesktopView;
