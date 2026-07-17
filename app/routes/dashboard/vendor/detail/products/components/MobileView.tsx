import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import Divider from "~/components/core/divider/Divider";
import NoData from "~/components/core/no-data/NoData";
import KeyValue from "~/components/core/key-value/KeyValue";
import { Skeleton } from "~/components/ui/skeleton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

type Props = {
  data: any[];
  loading: boolean;
  loadMore?: () => void;
  loadingMore?: boolean;
  totalCount?: number;
  loadedCount?: number;
  hasMoreData?: boolean;
  callback?: (a: { action: string; data: any }) => void;
};

const MobileView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  callback,
}: Props) => {
  const { t } = useTranslation(["common"]);

  // Loading state
  if (loading) {
    return (
      <div className="tw:flex tw:flex-col tw:gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={`skeleton-${idx}`}
            className="tw:border tw:border-gray-200 tw:rounded-md tw:bg-white tw:p-4"
          >
            <Skeleton className="tw:h-4 tw:w-3/4 tw:mb-3" />
            <Skeleton className="tw:h-3 tw:w-1/2 tw:mb-2" />
            <Skeleton className="tw:h-3 tw:w-2/3 tw:mb-2" />
            <Skeleton className="tw:h-3 tw:w-1/3 tw:mb-2" />
            <Skeleton className="tw:h-3 tw:w-1/4 tw:mb-3" />
            <Divider />
            <div className="tw:flex tw:items-center tw:justify-between tw:mt-3">
              <Skeleton className="tw:h-6 tw:w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return <NoData />;
  }

  // Data state
  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-x-4">
      {data.map((item, idx) => (
        <AppCard key={item._id || idx} noPadding>
          <div className="tw:px-4 tw:pt-4 tw:h-14">
            <div className="tw:font-semibold tw:text-sm tw:mb-2 tw:line-clamp-2">
              {item.name || "--"}
            </div>
          </div>

          <div className="tw:px-4 tw:py-2">
            <div className="tw:grid tw:grid-cols-3 tw:gap-2">
              <KeyValue label={t("id")} size="sm">
                {item.dealId || "--"}
              </KeyValue>
              <KeyValue label={t("brand")} size="sm">
                <div className="tw:line-clamp-1">
                  {item.applicableBrand?.brandName ? (
                    <button
                      type="button"
                      className="tw:text-primary tw-underline tw-text-sm tw:inline-block tw:text-left"
                      onClick={() =>
                        callback?.({
                          action: "brand",
                          data: {
                            id: item.applicableBrand?.brandId,
                            name: item.applicableBrand?.brandName,
                          },
                        })
                      }
                    >
                      {item.applicableBrand?.brandName}
                    </button>
                  ) : (
                    "--"
                  )}
                </div>
              </KeyValue>
              <KeyValue label={t("category")} size="sm">
                <div className="tw:line-clamp-1">
                  {item.applicableCategory?.categoryName ? (
                    <button
                      type="button"
                      className="tw:text-primary tw-underline tw-text-sm tw:inline-block tw:text-left"
                      onClick={() =>
                        callback?.({
                          action: "category",
                          data: {
                            id: item.applicableCategory?.categoryId,
                            name: item.applicableCategory?.categoryName,
                          },
                        })
                      }
                    >
                      {item.applicableCategory?.categoryName}
                    </button>
                  ) : (
                    "--"
                  )}
                </div>
              </KeyValue>
            </div>
          </div>

          <Divider className="tw:my-1!" />

          <div className="tw:px-4 tw:py-3 tw:flex tw:items-center tw:justify-between">
            <div className="tw:text-sm tw:text-gray-700">
              <span className="tw:font-semibold">{t("stock")}:</span>{" "}
              {item.stock !== undefined ? `${item.stock} ${t("units")}` : "--"}
            </div>

            <div className="tw:text-xl tw:font-bold">
              <Amount
                value={item.b2cPrice}
                className="tw:text-xl tw:font-bold"
              />
            </div>
          </div>
        </AppCard>
      ))}

      {hasMoreData && !loading && data.length > 0 && loadMore && (
        <div className="tw:text-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={!!loadingMore}
            totalCount={totalCount ?? 0}
            loadedCount={loadedCount ?? 0}
          />
        </div>
      )}
    </div>
  );
};

export default MobileView;
