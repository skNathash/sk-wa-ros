import { MapPin, Phone } from "lucide-react";
import React from "react";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import type { RetailerRow } from "./DesktopView";

interface MobileViewProps {
  loading?: boolean;
  data: RetailerRow[];
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const MobileView: React.FC<MobileViewProps> = ({
  loading,
  data,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  if (loading) {
    return (
      <div className="tw:p-4 tw:flex tw:items-center tw:justify-center">
        <div className="tw:text-sm tw:text-gray-600">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <NoData
        title="No retailers found"
        description="Try adjusting your search or filters."
      />
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:gap-2">
        {data.map((item, index) => {
          const location = [item?.city, item?.district, item?.state]
            .filter(Boolean)
            .join(", ");
          return (
            <AppCard
              key={item?.franchiseId || item?._id || index}
              noOverflow
              className="tw:mb-0"
            >
              <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                <div className="tw:min-w-0">
                  <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:line-clamp-2">
                    {item?.name || item?.shopName || "-"}
                  </div>
                  {item?.franchiseId && (
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                      ID: {item.franchiseId}
                    </div>
                  )}
                </div>
                {item?.mobile && (
                  <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-600 tw:shrink-0">
                    <Phone className="tw:w-3 tw:h-3 tw:text-gray-400" />
                    {item.mobile}
                  </div>
                )}
              </div>

              <div className="tw:mt-2 tw:pt-2 tw:border-t tw:border-gray-100 tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500">
                <MapPin className="tw:w-3 tw:h-3 tw:text-gray-400 tw:shrink-0" />
                <span className="tw:truncate">
                  {location || "-"}
                  {item?.pincode ? ` - ${item.pincode}` : ""}
                </span>
              </div>
            </AppCard>
          );
        })}
      </div>

      {hasMoreData && data.length > 0 && (
        <div className="tw:mt-4 tw:flex tw:justify-center tw:pb-6">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </>
  );
};

export default MobileView;
