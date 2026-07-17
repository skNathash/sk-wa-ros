import clsx from "clsx";
import ImgRender from "~/components/core/img/ImgRender";
import Amount from "~/components/core/amount/Amount";
import { useTranslation } from "react-i18next";
import DateFormat from "~/components/core/date/DateFormat";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import { PencilLine, RefreshCw } from "lucide-react";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import Rbac from "~/components/core/rbac/Rbac";
import DisplayProfit from "~/shared/others/components/DisplayProfit";

const MobileView = ({
  data = [],
  loading = false,
  callback,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
  highlightDealId = "",
}: {
  data: any[];
  loading: boolean;
  callback: (args: { action: string; data?: any }) => void;
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
  loadedCount: number;
  highlightDealId?: string;
}) => {
  const { t } = useTranslation(["common"]);
  if (loading) {
    return (
      <div className="tw:p-4 tw:text-center tw:flex tw:items-center tw:justify-center tw:min-h-64">
        <div className="tw:text-gray-500 tw:font-medium">Loading...</div>
      </div>
    );
  }
  if (!data.length) {
    return (
      <div className="tw:p-4 tw:text-center tw:flex tw:items-center tw:justify-center tw:min-h-64">
        <div className="tw:text-gray-500 tw:font-medium">No Data</div>
      </div>
    );
  }
  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:md:grid-cols-3 tw:gap-2">
        {data.map((item) => (
          <AppCard
            key={item.id}
            className={clsx(
              "tw:flex tw:flex-col",
              highlightDealId === item._id && "highlight-animate",
            )}
            noPadding
          >
            <div className="tw:p-3">
              {/* Top Row: Image + Name/ID */}
              <div className="tw:flex tw:gap-2 tw:items-start">
                <div className="tw:w-11 tw:h-11 tw:bg-gray-50 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0 tw:border tw:border-gray-100">
                  <ImgRender
                    assetId={item.images?.[0]}
                    className="tw:object-contain tw:w-9 tw:h-9"
                    alt={item.name}
                    size="100"
                  />
                </div>
                <div className="tw:flex tw:flex-1 tw:justify-between tw:gap-2">
                  <div className="tw:flex tw:flex-col tw:gap-1">
                    <AppLink
                      href={`/dashboard/inventory/products/view/${item._id}`}
                      asLink
                    >
                      <div className="tw:font-medium tw:text-xs tw:text-gray-900 tw:line-clamp-3 tw:leading-tight">
                        {item.name}
                      </div>
                    </AppLink>

                    <div className="tw:flex tw:items-center tw:gap-2">
                      <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                        ID: {item.id ?? "-"}
                      </div>
                      <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                        Stock: {item.maxQty ?? 0}
                      </div>
                    </div>
                  </div>

                  <Rbac roles={["CONFIGS.PRICE-SCHEME-UPDATE"]}>
                    <AppButton
                      size="small"
                      color="primary"
                      fill="outline"
                      onClick={(e: any) => {
                        callback({ action: "edit", data: item });
                      }}
                    >
                      <PencilLine size={14} />
                    </AppButton>
                  </Rbac>
                </div>
              </div>

              {/* Offer & Pricing Summary */}
              <div className="tw:mt-1 tw:pt-1.5 tw:border-t tw:border-dashed tw:border-gray-200">
                <div className="tw:flex tw:items-center tw:justify-between tw:mb-1.5">
                  <div>
                    <span className="tw:text-[10px] tw:font-semibold tw:text-gray-400 tw:uppercase tw:tracking-tight">
                      Scheme Price
                    </span>
                    <div className="tw:font-bold tw:text-lg tw:text-green-600 tw:leading-none tw:mt-0.5">
                      {item.b2bScheme?.offerPrice != null ? (
                        <Amount value={item.b2bScheme.offerPrice} />
                      ) : (
                        <span className="tw:text-gray-300">-</span>
                      )}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                      {item.b2bScheme?.isTaxInclusive
                        ? t("afterTax")
                        : t("beforeTax")}
                    </div>
                  </div>
                  {item.b2bScheme?.offerDiscount != null && (
                    <div className="tw:bg-red-50 tw:text-red-600 tw:px-1.5 tw:py-0.5 tw:rounded-md tw:text-xs tw:font-semibold">
                      Discount: -{item.b2bScheme.offerDiscount}%
                    </div>
                  )}
                </div>

                <div className="tw:grid tw:grid-cols-4 tw:gap-1.5 tw:bg-gray-50 tw:p-1.5 tw:rounded-lg">
                  <div className="tw:flex tw:flex-col">
                    <span className="tw:text-[9px] tw:text-gray-400 tw:uppercase tw:font-semibold">
                      B2B
                    </span>
                    <span className="tw:text-xs tw:font-semibold tw:text-gray-700 tw:truncate">
                      <Amount
                        value={
                          item.b2bPrice ?? item.basePrice ?? item.price ?? 0
                        }
                      />
                    </span>
                  </div>
                  <div className="tw:flex tw:flex-col tw:border-l tw:border-gray-200 tw:pl-1.5">
                    <span className="tw:text-[9px] tw:text-gray-400 tw:uppercase tw:font-semibold">
                      MRP
                    </span>
                    <span className="tw:text-xs tw:font-semibold tw:text-gray-700 tw:truncate">
                      <Amount value={item.mrp ?? 0} />
                    </span>
                  </div>
                  <div className="tw:flex tw:flex-col tw:border-l tw:border-gray-200 tw:pl-1.5">
                    <span className="tw:text-[9px] tw:text-gray-400 tw:uppercase tw:font-semibold">
                      Pur. Price
                    </span>
                    <span className="tw:text-xs tw:font-semibold tw:text-gray-700 tw:truncate">
                      <Amount value={item.purchasePrice ?? 0} />
                    </span>
                  </div>
                  {item.b2bScheme?.status !== "Completed" && (
                    <div className="tw:flex tw:flex-col tw:border-l tw:border-gray-200 tw:pl-1.5">
                      <span className="tw:text-[9px] tw:text-gray-400 tw:uppercase tw:font-semibold">
                        Profit
                      </span>
                      <span className="tw:text-xs tw:font-semibold tw:truncate">
                        <DisplayProfit
                          price={item.purchasePrice ?? 0}
                          offerPrice={item.b2bScheme?.offerPrice ?? 0}
                        />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Validity Period Section */}
              {(item.b2bScheme?.offerStartDate ||
                item.b2bScheme?.offerEndDate) && (
                <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:text-[10px]">
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <div className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-blue-500"></div>
                    <span className="tw:text-gray-500 tw:font-medium">
                      {item.b2bScheme?.offerStartDate && (
                        <DateFormat
                          value={item.b2bScheme.offerStartDate}
                          formatStr="dd MMM yyyy"
                        />
                      )}
                      {item.b2bScheme?.offerStartDate &&
                        item.b2bScheme?.offerEndDate &&
                        " - "}
                      {item.b2bScheme?.offerEndDate && (
                        <DateFormat
                          value={item.b2bScheme.offerEndDate}
                          formatStr="dd MMM yyyy"
                        />
                      )}
                    </span>
                  </div>
                  <AppBadge variant={item.b2bScheme?.statusColor}>
                    {item.b2bScheme?.status}
                  </AppBadge>
                </div>
              )}
            </div>
          </AppCard>
        ))}
      </div>
      {showLoadMore && !loading && data.length > 0 && (
        <div className="tw:text-center tw:mt-3">
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
