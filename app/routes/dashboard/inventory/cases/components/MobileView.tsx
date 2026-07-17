import { PackageIcon, Edit2 } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import type { SellerDeal } from "~/types/CommonTypes";

type Props = {
  data: SellerDeal[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  callback?: (args: { action: string; data: SellerDeal }) => void;
};

const MobileView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
  callback,
}: Props) => {
  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-7 tw:gap-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <AppCard key={`skeleton-${idx}`} noPadding>
            <div className="tw:p-2">
              <Skeleton className="tw:w-full tw:h-28 tw:mb-2" />
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-7 tw:gap-3">
        {data.map((item) => (
          <AppCard key={item._id} noPadding className="tw:mb-0">
            <AppLink
              href={`/dashboard/inventory/products/view/${item._id}`}
              asLink
              title={item.name}
              className="tw:mb-1 tw:block"
              noUnderline
            >
              <div className="tw:p-2">
                {item?.images?.[0] ? (
                  <div className="tw:h-28">
                    <ImgRender
                      assetId={item.images?.[0]}
                      alt={item.name}
                      className="tw:w-full tw:h-full tw:object-contain"
                      size="200x200"
                    />
                  </div>
                ) : (
                  <div className="tw:h-28 tw:bg-gray-100 tw:flex tw:items-center tw:justify-center">
                    <PackageIcon className="tw:w-6 tw:h-6 tw:text-gray-400" />
                  </div>
                )}
                <div className="tw:h-10 tw:mt-2 tw:mb-1">
                  <div className="tw:font-semibold tw:text-sm tw:line-clamp-2">
                    {item.name}
                  </div>
                </div>

                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  ID: {item.id || "--"}
                </div>

                <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:mb-2">
                  <div className="tw:flex tw:flex-col">
                    <span className="tw:text-[10px] tw:font-medium tw:text-gray-600">
                      Case
                    </span>
                    <span className="tw:text-xs tw:font-semibold tw:text-primary">
                      {item.packageQty || 0} units
                      {item.overrideCaseQtyOnLowStock && (
                        <span className="tw:w-2 tw:h-2 tw:bg-red-500 tw:rounded-full"></span>
                      )}
                    </span>
                  </div>
                  <div className="tw:flex tw:flex-col">
                    <span className="tw:text-[10px] tw:font-medium tw:text-gray-600">
                      Inner Case
                    </span>
                    <span className="tw:text-xs tw:font-semibold tw:text-primary">
                      {item.packageQty || 0} units
                      {item.overrideInnerCaseQtyOnLowStock && (
                        <span className="tw:w-2 tw:h-2 tw:bg-red-500 tw:rounded-full"></span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
                  Sell in:{" "}
                  <AppBadge variant={item.sellingTypeColor || "light"}>
                    {item.sellingType || "UNIT"}
                  </AppBadge>
                </div>

                <div className="tw:text-xs tw:text-green-500 tw:mb-2">
                  In Stock: {item.actualMaxQty || 0} units
                </div>
                <div className="tw:pt-2 tw:border-t tw:border-gray-100">
                  <AppButton
                    size="small"
                    fill="outline"
                    color="primary"
                    className="tw:w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      callback?.({ action: "edit", data: item });
                    }}
                  >
                    <Edit2 size={14} className="tw:mr-2" />
                    Edit
                  </AppButton>
                </div>
              </div>
            </AppLink>
          </AppCard>
        ))}
      </div>
      {showLoadMore && !loading && (
        <div className="tw:mt-4">
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
