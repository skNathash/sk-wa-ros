import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import NoData from "~/components/core/no-data/NoData";
import KeyValue from "~/components/core/key-value/KeyValue";
import { Skeleton } from "~/components/ui/skeleton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import ImgRender from "~/components/core/img/ImgRender";
import PoAddToCart from "~/shared/purchase-order/components/po-add-to-cart/PoAddToCart";

type Props = {
  vendorId: string;
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
  vendorId,
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
      <div className="app-bleed-x tw:divide-y tw:divide-border tw:rounded-none tw:bg-white">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={`skeleton-${idx}`}
            className="tw:flex tw:items-center tw:gap-3 tw:p-3"
          >
            <Skeleton className="tw:h-12 tw:w-12 tw:shrink-0 tw:rounded-lg" />
            <div className="tw:min-w-0 tw:flex-1 tw:space-y-1.5">
              <Skeleton className="tw:h-4 tw:w-3/4" />
              <Skeleton className="tw:h-3 tw:w-1/3" />
            </div>
            <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-1.5">
              <Skeleton className="tw:h-4 tw:w-12" />
              <Skeleton className="tw:h-7 tw:w-14 tw:rounded-full" />
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

  if (1) {
    return (
      <>
        {/* `app-bleed-x` pulls the list out of the page gutter on theme-2
            mobile so rows run edge to edge as one flush block. */}
        <div className="app-bleed-x tw:divide-y tw:divide-border tw:rounded-none tw:bg-white">
          {data.map((item, idx) => {
            const stock = Number(
              item.loggedInUserStock?.availableQuantity ?? 0,
            );
            const hasDiscount = Number(item.discount) > 0;

            return (
              <div
                key={item._id || item.dealId || idx}
                className="tw:flex tw:items-center tw:gap-3 tw:p-3"
              >
                <div className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-lg tw:bg-muted">
                  <ImgRender
                    assetId={item.image}
                    alt={item.name}
                    className="tw:h-full tw:w-full tw:object-cover"
                  />
                </div>

                <div className="tw:min-w-0 tw:flex-1">
                  <h3 className="tw:text-sm tw:font-semibold tw:leading-snug tw:text-foreground tw:line-clamp-2">
                    {item.name || "--"}
                  </h3>
                  <p className="tw:mt-0.5 tw:text-[11px] tw:leading-4 tw:text-muted-foreground">
                    {`${stock} ${t("inStock", "in stock")}`}
                    {item.lastPurchaseDate ? (
                      <>
                        {" · "}
                        {t("lastBuy", "last buy")}{" "}
                        <DateFormat
                          value={item.lastPurchaseDate}
                          formatStr="dd MMM yyyy"
                        />
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-1.5">
                  <div className="tw:flex tw:items-baseline tw:gap-1.5">
                    <Amount
                      value={item.price}
                      className="tw:text-sm tw:font-bold tw:text-foreground"
                    />
                    {hasDiscount ? (
                      <Amount
                        value={item.mrp}
                        className="tw:text-[11px] tw:text-muted-foreground tw:line-through"
                      />
                    ) : null}
                  </div>
                  <PoAddToCart
                    vendorId={vendorId}
                    dealId={item.dealId || item.dealRefId}
                    type="catalog"
                    buttonClassName="tw:rounded-full tw:px-2.5"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {hasMoreData && !loading && data.length > 0 && loadMore ? (
          <div className="tw:mt-2 tw:text-center">
            <LoadMoreButton
              loadMore={loadMore}
              loading={!!loadingMore}
              totalCount={totalCount ?? 0}
              loadedCount={loadedCount ?? 0}
            />
          </div>
        ) : null}
      </>
    );
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
