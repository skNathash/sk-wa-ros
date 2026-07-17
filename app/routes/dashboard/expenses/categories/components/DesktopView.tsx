import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppBadge from "~/components/core/badge/AppBadge";
import { Edit, Eye, Trash2 } from "lucide-react";

interface DesktopViewProps {
  data: any[];
  loading?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
  showLoadMore?: boolean;
  callback: (a: { action: string; data?: any }) => void;
  // id of the item currently undergoing status toggle (used to show loading)
  togglingId?: string | null;
}

const headers = [
  { label: "Sl No", key: "slno", width: "60px", isCentered: true },
  { label: "Category Name", key: "name", width: "240px" },
  { label: "Description", key: "description", width: "340px" },
  { label: "Status", key: "status", width: "120px", isCentered: true },
  { label: "Action", key: "action", width: "160px", isCentered: true },
];

import { useCallback } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

const DesktopView: React.FC<DesktopViewProps> = ({
  data = [],
  loading,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
  showLoadMore = false,
  callback,
  togglingId = null,
}) => {
  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
        <AppSpinner />
      </div>
    );
  }

  // Do not show table when there's no data and not loading
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  const handleAction = useCallback(
    (action: string, itemData: any) => {
      callback({ action: action || "", data: itemData });
    },
    [callback]
  );

  const handleLoadMore = useCallback(() => {
    loadMore && loadMore();
  }, [loadMore]);

  return (
    <AppTable minWidth="700px" container>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>

      <AppTable.Body>
        {loading ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              Loading...
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item: any, idx: number) => (
            <AppTable.Row key={item._id || item.id || idx}>
              <AppTable.Cell className="tw:text-center">
                {idx + 1}
              </AppTable.Cell>
              <AppTable.Cell>{item.name}</AppTable.Cell>
              <AppTable.Cell>{item.description || "-"}</AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <AppBadge variant={item.statusColor}>
                  {item.statusLabel}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
                  {!item.isGlobal && (
                    <AppButton
                      fill="outline"
                      size="small"
                      color="light"
                      onClick={() => {
                        handleAction("edit", item);
                      }}
                    >
                      <Edit size={12} />
                      Edit
                    </AppButton>
                  )}

                  {!item.isGlobal && (
                    <AppButton
                      size="small"
                      color={item.isActive ? "danger" : "success"}
                      onClick={() => {
                        handleAction(
                          item.isActive ? "mark-deactive" : "mark-active",
                          item
                        );
                      }}
                      isLoading={
                        Boolean(togglingId) &&
                        togglingId === (item._id || item.id)
                      }
                      fill={item.isActive ? "outline" : "solid"}
                    >
                      {item.isActive ? "Mark as deactive" : "Mark As Active"}
                    </AppButton>
                  )}
                  <AppButton
                    fill="outline"
                    size="small"
                    onClick={() => handleAction("view-subcategories", item)}
                  >
                    <Eye size={12} />
                    View
                  </AppButton>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}

        {showLoadMore && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell
              colSpan={headers.length}
              className="tw:text-center tw:py-4"
            >
              <LoadMoreButton
                loadMore={handleLoadMore}
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
