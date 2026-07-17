import { Copy, Trash2 } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type { TableHeaderItem } from "~/types/CommonTypes";

interface DesktopViewProps {
  loading: boolean;
  data: Array<Record<string, any>>;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  callback: (a: { action: string; data?: any }) => void;
  status: string;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  loadMore,
  loadingMore,
  totalCount = 0,
  loadedCount = 0,
  hasMoreData = false,
  callback,
  status,
}) => {
  const { t } = useTranslation(["common"]);

  const headers: TableHeaderItem[] = useMemo(() => {
    const baseHeaders: TableHeaderItem[] = [
      { label: "#", key: "slNo", width: "5%" },
      { label: "Barcode", key: "barcode", width: "45%" },
      { label: "Created On", key: "createdAt", width: "20%" },
      { label: "Status", key: "status", width: "15%" },
    ];
    if (status === "PENDING") {
      baseHeaders.push({ label: "Action", key: "action", width: "20%" });
    }
    return baseHeaders;
  }, [status]);

  if (loading) {
    return (
      <AppTable container stickyHeader responsive bordered size="sm">
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          <TableSkeletonLoader cols={headers.length} rows={8} />
        </AppTable.Body>
      </AppTable>
    );
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <div>
      <AppTable
        container
        minWidth="900px"
        containerStyle={containerStyle}
        stickyHeader
        condensed
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>

        <AppTable.Body>
          {data.map((item, idx) => (
            <AppTable.Row key={item._id || idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div className="tw:break-all">
                    <code className="tw:!font-mono">
                      {item.barcode || "--"}
                    </code>
                  </div>
                  <div>
                    <button
                      className="tw:cursor-pointer tw:inline-block tw:mt-1"
                      onClick={() =>
                        callback({ action: "copyBarcode", data: item })
                      }
                    >
                      <Copy size={14} className="tw:text-gray-500" />
                    </button>
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-1">
                  <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                  <DateFormat
                    value={item.createdAt}
                    formatStr="hh:mm a"
                    className="tw:text-xs tw:text-gray-500"
                  />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={item?.statusColor || "danger"}>
                  {item.status || "Invalid"}
                </AppBadge>
              </AppTable.Cell>
              {status === "PENDING" && (
                <AppTable.Cell>
                  <div className="tw:flex tw:gap-2">
                    {item?.showCreate ? (
                      <AppButton
                        onClick={() =>
                          callback({ action: "createProduct", data: item })
                        }
                        size="small"
                        color="primary"
                        fill="solid"
                        className="tw:mr-2"
                      >
                        {t("createProduct")}
                      </AppButton>
                    ) : null}

                    {item?.showRemove ? (
                      <AppButton
                        onClick={() =>
                          callback({ action: "remove", data: item })
                        }
                        size="small"
                        color="danger"
                        fill="outline"
                      >
                        <Trash2 />
                      </AppButton>
                    ) : null}
                  </div>
                </AppTable.Cell>
              )}
            </AppTable.Row>
          ))}

          {data.length > 0 ? (
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
