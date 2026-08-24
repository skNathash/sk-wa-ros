import React, { useCallback } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Ban, Check, Edit, Eye } from "lucide-react";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
  callback: (a: { action: string; data?: any }) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
  togglingId?: string | null;
}

// Stable, theme-friendly accent per category (matches the expense-records palette).
const CARD_COLORS = [
  "#075e54", // teal
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ef4444", // red
  "#0ea5e9", // sky
];

const colorFor = (key = "") => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
};

const MobileView: React.FC<MobileViewProps> = ({
  data = [],
  loading = false,
  callback,
  showLoadMore = true,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
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
    // Skeleton grid that mirrors the real card layout.
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
        {[0, 1, 2, 3].map((s) => (
          <div key={s} className="expense-cat-card" aria-hidden>
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="skeleton-loader tw:h-10 tw:w-10 tw:rounded-lg" />
              <div className="tw:flex-1 tw:space-y-2">
                <div className="skeleton-loader tw:h-4 tw:w-1/2 tw:rounded" />
                <div className="skeleton-loader tw:h-3 tw:w-3/4 tw:rounded" />
              </div>
              <div className="skeleton-loader tw:h-5 tw:w-16 tw:rounded-full" />
            </div>
            <div className="expense-cat-actions">
              <div className="skeleton-loader tw:h-8 tw:w-20 tw:rounded" />
              <div className="skeleton-loader tw:h-8 tw:w-24 tw:rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
        {data.map((item, idx) => {
          const color = colorFor(item.name || "");
          const initial = (item.name || "?").charAt(0).toUpperCase();
          const isToggling =
            Boolean(togglingId) && togglingId === (item._id || item.id);

          return (
            <div
              key={item._id || item.id || idx}
              className="expense-cat-card"
              style={{ borderLeftColor: color }}
            >
              <div className="tw:flex tw:items-start tw:gap-3">
                <div
                  className="expense-cat-avatar"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${color} 14%, #fff)`,
                    color,
                  }}
                >
                  {initial}
                </div>

                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <span className="expense-cat-title tw:truncate">
                      {item.name}
                    </span>
                    {item.isGlobal && (
                      <span className="expense-cat-tag">Global</span>
                    )}
                  </div>
                  <div className="expense-cat-desc tw:line-clamp-2">
                    {item.description || "No description"}
                  </div>
                </div>

                <AppBadge variant={item.statusColor}>
                  {item.statusLabel}
                </AppBadge>
              </div>

              <div className="expense-cat-actions">
                <AppButton
                  size="small"
                  fill="outline"
                  color="light"
                  aria-label={`View ${item.name}`}
                  onClick={() => handleAction("view-subcategories", item)}
                >
                  <Eye size={14} />
                  View
                </AppButton>

                {!item.isGlobal && (
                  <AppButton
                    size="small"
                    fill="outline"
                    color="secondary"
                    aria-label={`Edit ${item.name}`}
                    onClick={() => handleAction("edit", item)}
                  >
                    <Edit size={14} />
                    Edit
                  </AppButton>
                )}

                {!item.isGlobal && (
                  <AppButton
                    size="small"
                    color={item.isActive ? "danger" : "success"}
                    fill={item.isActive ? "outline" : "solid"}
                    isLoading={isToggling}
                    aria-pressed={!!item.isActive}
                    onClick={() =>
                      handleAction(
                        item.isActive ? "mark-deactive" : "mark-active",
                        item
                      )
                    }
                  >
                    {item.isActive ? <Ban size={14} /> : <Check size={14} />}
                    {item.isActive ? "Deactivate" : "Activate"}
                  </AppButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showLoadMore && (
        <div className="tw:text-center tw:mt-4">
          <LoadMoreButton
            loadMore={handleLoadMore}
            loading={loadingMore || false}
            totalCount={totalCount || 0}
            loadedCount={loadedCount || data.length}
          />
        </div>
      )}
    </>
  );
};

export default MobileView;
