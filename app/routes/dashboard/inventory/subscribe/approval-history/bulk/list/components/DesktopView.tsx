import React from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type {
  SortProps,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";
import DateFormat from "~/components/core/date/DateFormat";
import { Eye } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

interface DesktopViewProps {
  data: Record<string, any>[];
  callback: (a: { action: string; data: Record<string, any> }) => void;
  loading?: boolean;
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: SortProps) => void;
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  callback,
  loading = false,
  sortKey,
  sortValue,
  onSort,
  showLoadMore,
  loadingMore,
  loadMore,
  totalCount,
}) => {
  const { t } = useTranslation(["common"]);

  const headers: TableHeaderItem[] = [
    { label: t("date"), key: "createdAt", width: "15%", enableSort: true },
    { label: t("filename"), key: "fileName", width: "25%", enableSort: true },
    {
      label: t("totalItems"),
      key: "count",
      width: "12%",
      enableSort: true,
    },
    {
      label: t("result"),
      key: "result",
      width: "18%",
      enableSort: false,
      isCentered: true,
    },
    { label: t("status"), key: "finalStatus", width: "13%", enableSort: true },
    { label: t("actions"), key: "actions", width: "20%", enableSort: false },
  ];

  const containerStyle = {
    maxHeight: "calc(100vh - 200px)",
  };

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      container
      responsive
      fixedLayout
      minWidth="1200px"
      size="sm"
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
                {/* Date Column */}
                <AppTable.Cell>
                  <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                  <div className="tw:text-xs tw:text-slate-500 tw:mt-1">
                    <DateFormat value={item.createdAt} formatStr="hh:mm a" />
                  </div>
                </AppTable.Cell>

                {/* Filename Column */}
                <AppTable.Cell>{item.fileName || "N/A"}</AppTable.Cell>

                {/* Total Items Column */}
                <AppTable.Cell>
                  {item.count || 0}{" "}
                  <span className="tw:text-gray-500">
                    {item.count == 1 ? t("item") : t("items")}
                  </span>
                </AppTable.Cell>

                {/* Result Column */}
                <AppTable.Cell>
                  <div className="tw:flex tw:gap-2 tw:text-wrap">
                    <AppBadge variant="success">
                      {item.statusImported || 0} {t("approved")}
                    </AppBadge>
                    <AppBadge variant="danger">
                      {item.statusRejected || 0} {t("rejected")}
                    </AppBadge>
                  </div>
                </AppTable.Cell>

                {/* Status Column */}
                <AppTable.Cell>
                  <AppBadge
                    variant={item._statusColor || "light"}
                    className="tw:text-xs"
                  >
                    {item.finalStatus || "Pending"}
                  </AppBadge>
                </AppTable.Cell>

                {/* Actions Column */}
                <AppTable.Cell>
                  <AppButton
                    size="small"
                    fill="outline"
                    color="light"
                    onClick={() => callback({ action: "view", data: item })}
                  >
                    <Eye className="tw:w-4 tw:h-4" />
                    {t("view")}
                  </AppButton>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
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
                loadedCount={data.length}
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
