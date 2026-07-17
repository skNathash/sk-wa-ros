import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import type { SortProps, TableHeaderItem } from "~/types/CommonTypes";

interface DesktopViewProps {
  loading?: boolean;
  data: any[];
  callback: (a: { action: string; data: any }) => void;
  onSort: (a: SortProps) => void;
  sortKey: string;
  sortValue: "asc" | "desc" | undefined;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const headers: TableHeaderItem[] = [
  {
    label: "Name",
    key: "name",
    width: "25%",
    langKey: "name",
  },
  {
    label: "Category",
    key: "applicableCategories",
    width: "18%",
    langKey: "category",
  },
  {
    label: "Brand",
    key: "applicableBrands",
    width: "15%",
    langKey: "brand",
  },
  {
    label: "Stock",
    key: "stock",
    width: "8%",
    langKey: "stock",
  },
  {
    label: "Price",
    key: "price",
    width: "12%",
    langKey: "price",
  },
  {
    label: "Actions",
    key: "action",
    width: "10%",
    langKey: "actions",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  callback,
  onSort,
  sortKey,
  sortValue,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      containerStyle={containerStyle}
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
          <TableSkeletonLoader cols={6} rows={30} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>
                <div className="tw:line-clamp-3">{row.name || "--"}</div>
                <div className="tw:text-xs tw:text-gray-500">
                  ID: {row.dealId || "--"}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.applicableCategory?.categoryName ? (
                  <button
                    type="button"
                    className="tw:text-primary tw-underline tw-text-sm"
                    onClick={() =>
                      callback({
                        action: "category",
                        data: {
                          id: row.applicableCategory?.categoryId,
                          name: row.applicableCategory?.categoryName,
                        },
                      })
                    }
                  >
                    {row.applicableCategory?.categoryName}
                  </button>
                ) : (
                  "--"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                {row.applicableBrand?.brandName ? (
                  <button
                    type="button"
                    className="tw:text-primary tw-underline tw-text-sm"
                    onClick={() =>
                      callback({
                        action: "brand",
                        data: {
                          id: row.applicableBrand?.brandId,
                          name: row.applicableBrand?.brandName,
                        },
                      })
                    }
                  >
                    {row.applicableBrand?.brandName}
                  </button>
                ) : (
                  "--"
                )}
              </AppTable.Cell>
              <AppTable.Cell>{row.stock || "--"}</AppTable.Cell>
              <AppTable.Cell>
                <Amount value={row.price} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>{row.action || "--"}</AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={6} className="tw:text-center">
              {t("noDataFound")}
            </AppTable.Cell>
          </AppTable.Row>
        )}
        {hasMoreData && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell colSpan={6} className="tw:text-center">
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
