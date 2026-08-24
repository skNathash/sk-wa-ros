import React, { useCallback } from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { Ban, Check, Edit, Eye } from "lucide-react";

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
  { label: "Category Name", key: "name", width: "260px" },
  { label: "Description", key: "description", width: "320px" },
  { label: "Status", key: "status", width: "120px", isCentered: true },
  { label: "Action", key: "action", width: "260px", isCentered: true },
];

// Stable, theme-friendly accent per category (matches the mobile cards).
const CARD_COLORS = [
  "#075e54",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#0ea5e9",
];

const colorFor = (key = "") => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
};

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
  const handleAction = useCallback(
    (action: string, itemData: any) => {
      callback({ action: action || "", data: itemData });
    },
    [callback]
  );

  const handleLoadMore = useCallback(() => {
    loadMore && loadMore();
  }, [loadMore]);

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-full tw:py-10">
        <AppSpinner />
      </div>
    );
  }

  // Do not show table when there's no data and not loading
  if (data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable minWidth="820px" container>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>

      <AppTable.Body>
        {data.map((item: any, idx: number) => {
          const color = colorFor(item.name || "");
          const initial = (item.name || "?").charAt(0).toUpperCase();

          return (
            <AppTable.Row key={item._id || item.id || idx}>
              <AppTable.Cell className="tw:text-center">
                {idx + 1}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2.5">
                  <div
                    className="expense-cat-avatar-sm"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${color} 14%, #fff)`,
                      color,
                    }}
                  >
                    {initial}
                  </div>
                  <span className="tw:font-medium tw:text-gray-900">
                    {item.name}
                  </span>
                  {item.isGlobal && (
                    <span className="expense-cat-tag">Global</span>
                  )}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <span className="tw:text-gray-600">
                  {item.description || "-"}
                </span>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <AppBadge variant={item.statusColor}>
                  {item.statusLabel}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
                  <AppButton
                    fill="outline"
                    size="small"
                    color="light"
                    onClick={() => handleAction("view-subcategories", item)}
                  >
                    <Eye size={12} />
                    View
                  </AppButton>

                  {!item.isGlobal && (
                    <AppButton
                      fill="outline"
                      size="small"
                      color="secondary"
                      onClick={() => handleAction("edit", item)}
                    >
                      <Edit size={12} />
                      Edit
                    </AppButton>
                  )}

                  {!item.isGlobal && (
                    <AppButton
                      size="small"
                      color={item.isActive ? "danger" : "success"}
                      fill={item.isActive ? "outline" : "solid"}
                      isLoading={
                        Boolean(togglingId) &&
                        togglingId === (item._id || item.id)
                      }
                      onClick={() =>
                        handleAction(
                          item.isActive ? "mark-deactive" : "mark-active",
                          item
                        )
                      }
                    >
                      {item.isActive ? <Ban size={12} /> : <Check size={12} />}
                      {item.isActive ? "Deactivate" : "Activate"}
                    </AppButton>
                  )}
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          );
        })}

        {showLoadMore && data.length > 0 && (
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
