import React from "react";
import { Calendar, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import Divider from "~/components/core/divider/Divider";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
  callback?: (args: { action: string; data: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
  callback,
}) => {
  const { t } = useTranslation(["common"]);

  // Loading state
  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-x-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <AppCard key={`skeleton-${idx}`} noPadding={true}>
            <div className="tw:px-4 tw:py-3 tw:flex tw:items-start tw:animate-pulse">
              <div className="tw:w-2/3">
                <div className="tw:flex tw:items-center tw:gap-1">
                  <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-24 tw:mb-2"></div>
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-16"></div>
                </div>
                <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-20"></div>
                </div>
              </div>
              <div>
                <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-16 tw:mb-1"></div>
                <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-20"></div>
              </div>
            </div>
            <Divider className="tw:!my-0" />
            <div className="tw:px-4 tw:py-3">
              <div className="tw:flex tw:items-center">
                <div className="tw:w-2/3">
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-16 tw:mb-1"></div>
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-24"></div>
                </div>
                <div>
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-12 tw:mb-1"></div>
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-16"></div>
                </div>
              </div>
              <div className="tw:mt-3 tw:flex tw:items-center">
                <div className="tw:w-2/3">
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-20 tw:mb-1"></div>
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-24"></div>
                </div>
                <div>
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-12 tw:mb-1"></div>
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-16"></div>
                </div>
              </div>
            </div>
            <Divider className="tw:!my-0" />
            <div className="tw:px-4 tw:py-3 tw:flex tw:gap-4 tw:items-center tw:justify-end">
              <div className="tw:h-8 tw:bg-gray-200 tw:rounded tw:w-20"></div>
              <div className="tw:h-8 tw:bg-gray-200 tw:rounded tw:w-8"></div>
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }
  // Data state
  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-x-3">
        {data.map((item) => (
          <AppCard key={item._id || item.orderId} noPadding={true}>
            <div className="tw:px-4 tw:py-3 tw:flex tw:items-start">
              <div className="tw:w-[68%]">
                <div className="tw:flex tw:items-center tw:gap-1">
                  <AppLink
                    asLink
                    href={`/dashboard/orders/view/${item._id}`}
                    className="tw:text-blue-600"
                  >
                    <span className="tw:text-blue-600 tw:font-medium tw:text-base">
                      {item.orderRefNo}
                    </span>
                  </AppLink>
                  <AppBadge
                    variant={item._typeColor}
                    className="tw:text-xs tw:ml-1"
                  >
                    {item.orderType}
                  </AppBadge>
                </div>

                <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
                  <Calendar size={16} className="tw:text-slate-400" />
                  <div className="tw:text-xs tw:text-gray-500">
                    <DateFormat value={item.orderDate} />
                  </div>
                </div>
              </div>

              <div>
                <div className="tw:text-xs tw:text-gray-500">
                  {t("totalValue")}
                </div>
                <Amount
                  value={item.itemTotalValue}
                  decimalPlaces={2}
                  className="tw:text-base tw:font-semibold"
                />
              </div>
            </div>

            <Divider className="tw:!my-0" />

            <div className="tw:px-4 tw:py-3">
              <div className="tw:flex tw:items-center">
                <div className="tw:w-[68%]">
                  <div className="tw:text-xs tw:text-gray-500">
                    {t("customer")}
                  </div>
                  <div className="tw:mt-1">
                    <div className="tw:text-sm">
                      {item.customerName ? (
                        <AppLink
                          asLink
                          href={`/dashboard/network/view/b2c/${item.customerId}`}
                          className="tw:text-blue-600"
                        >
                          {item.customerName}
                        </AppLink>
                      ) : (
                        <div>
                          <AppBadge variant="secondary">
                            {t("walkin-customer")}
                          </AppBadge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="tw:text-xs tw:text-gray-500">
                    {t("quantity")}
                  </div>
                  <div>
                    <span className="tw:text-sm tw:font-semibold">
                      {item.quantity} {t("units")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="tw:mt-3 tw:flex tw:items-center">
                <div className="tw:w-[68%]">
                  <div className="tw:text-xs tw:text-gray-500">
                    {t("unitPrice")}
                  </div>
                  <div className="tw:text-sm tw:font-semibold">
                    <Amount value={item.price} />
                  </div>
                </div>

                <div>
                  <div className="tw:text-xs tw:text-gray-500">
                    {t("status")}
                  </div>
                  <div className="tw:mt-1">
                    <AppBadge variant={item._statusColor || "default"}>
                      {item._statusLbl || item.status}
                    </AppBadge>
                  </div>
                </div>
              </div>
            </div>

            <Divider className="tw:!my-0" />

            <div className="tw:px-4 tw:py-3 tw:flex tw:gap-4 tw:items-center tw:justify-end">
              <AppButton
                color="light"
                fill="outline"
                size="small"
                className="tw:!px-8"
                onClick={() =>
                  callback && callback({ action: "view-order", data: item })
                }
              >
                <Eye />
                {t("view")}
              </AppButton>
            </div>
          </AppCard>
        ))}
      </div>
      {showLoadMore && !loading && data.length > 0 && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={loadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
        />
      )}
    </>
  );
};

export default MobileView;
