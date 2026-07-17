import { LockOpen, Phone } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import UserBadgeForItem from "~/shared/store/badge/UserBadgeForItem";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
  callback?: (action: { action: string; data: any }) => void;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
}

const MobileView: React.FC<MobileViewProps> = ({
  data = [],
  loading = false,
  callback,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
}) => {
  if (loading) {
    return (
      <div className="tw:p-4">
        <div className="tw:text-center">Loading...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:p-4">
        <div className="tw:text-center">No data found</div>
      </div>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mx-4">
        {data.map((item, idx) => (
          <div
            key={item._id || idx}
            className="tw:bg-white tw:border tw:border-gray-300 tw:rounded tw:p-3"
          >
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:w-12 tw:h-12 tw:bg-gray-100 tw:rounded-md">
                <ImgRender
                  assetId={item.shopImg}
                  className="tw:object-cover tw:rounded-md"
                />
              </div>
              <div className="tw:flex-1">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div className="tw:font-medium tw:text-base tw:md:text-sm">
                    {item.name}
                  </div>
                  <div className="tw:mt-1">
                    <UserBadgeForItem networkType={item.networkType} />
                  </div>
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center">
                  <span>ID: {item.franchiseId}</span>
                  {item.mobile ? (
                    <span
                      className="tw:inline-flex tw:items-center tw:ml-2"
                      aria-label="mobile"
                    >
                      <Phone className="tw:w-3 tw:h-3 tw:mr-1 tw:text-gray-500" />
                      <span className="tw:text-xs tw:text-gray-500">
                        {item.mobile}
                      </span>
                    </span>
                  ) : null}
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  {item.formattedAddress || ""}
                </div>
                {item.createdAt ? (
                  <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                    Registered on:{" "}
                    <DateFormat
                      value={item.createdAt}
                      formatStr="dd MMM yyyy"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="tw:flex tw:gap-2 tw:mt-3 tw:justify-end">
              <AppButton
                size="small"
                onClick={() =>
                  callback?.({ action: "accessStore", data: item })
                }
              >
                <LockOpen />
                Access Store
              </AppButton>
            </div>
          </div>
        ))}
      </div>
      <div className="tw:text-center">
        <LoadMoreButton
          loadMore={() => loadMore && loadMore()}
          loading={loadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
        />
      </div>
    </>
  );
};

export default MobileView;
