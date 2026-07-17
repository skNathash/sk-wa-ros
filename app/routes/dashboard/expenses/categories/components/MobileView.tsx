import React, { useCallback } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Edit, Trash2, Eye } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";

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
  if (loading) {
    // lightweight skeleton grid for mobile
    return (
      <div className="tw:p-4 tw:space-y-3">
        {[0, 1, 2].map((s) => (
          <div
            key={s}
            className="tw:bg-white tw:border tw:border-gray-200 tw:rounded tw:p-3 tw:animate-pulse"
            aria-hidden
          >
            <div className="tw:flex tw:items-center tw:justify-between">
              <div className="tw:flex-1">
                <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-3/4" />
                <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/2 tw:mt-2" />
              </div>
            </div>

            <div className="tw:mt-3 tw:flex tw:justify-end tw:gap-2">
              <div className="tw:h-8 tw:w-16 tw:bg-gray-200 tw:rounded" />
              <div className="tw:h-8 tw:w-16 tw:bg-gray-200 tw:rounded" />
              <div className="tw:h-8 tw:w-20 tw:bg-gray-200 tw:rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
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
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        {data.map((item, idx) => (
          <AppCard key={idx} className="tw:mb-0">
            <div className="tw:flex tw:justify-between tw:items-center tw:gap-3">
              <div>
                <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:line-clamp-1 tw:mb-1">
                  {item.name}
                </div>
                {item.description ? (
                  <div className="tw:text-xs tw:text-gray-500 tw:line-clamp-1">
                    {item.description}
                  </div>
                ) : null}
              </div>
              <div className="tw:flex tw:flex-col tw:items-center">
                <div className="tw:mb-2">
                  <AppBadge variant={item.statusColor}>
                    {item.statusLabel}
                  </AppBadge>
                </div>

                {!item.isGlobal && (
                  <AppButton
                    size="small"
                    color="secondary"
                    fill="outline"
                    aria-label={`Edit ${item.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction("edit", item);
                    }}
                  >
                    <Edit size={14} />
                    Edit
                  </AppButton>
                )}
                <AppButton
                  size="small"
                  color="light"
                  fill="outline"
                  aria-label={`View ${item.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction("view-subcategories", item);
                  }}
                >
                  <Eye size={14} />
                  View
                </AppButton>

                {!item.isGlobal && (
                  <AppButton
                    size="small"
                    color={item.isActive ? "danger" : "success"}
                    onClick={(e) => {
                      e.stopPropagation();
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
                    aria-pressed={!!item.isActive}
                  >
                    {item.isActive ? "Deactivate" : "Activate"}
                  </AppButton>
                )}
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      <div className="tw:text-center tw:mt-4">
        <LoadMoreButton
          loadMore={handleLoadMore}
          loading={loadingMore || false}
          totalCount={totalCount || 0}
          loadedCount={loadedCount || data.length}
        />
      </div>
    </>
  );
};

export default MobileView;
