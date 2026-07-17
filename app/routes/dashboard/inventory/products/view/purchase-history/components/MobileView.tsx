import React from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import Divider from "~/components/core/divider/Divider";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return <div className="tw:text-center tw:py-4">{t("loading")}</div>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="tw:text-center tw:text-gray-400">
        {t("noDataFound") || t("noDataAvailable")}
      </div>
    );
  }
  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {data.map((item, idx) => {
          const poId = item.orderId || item.po?.id || "--";
          const vendorName = item.vendorName || item.vendor?.name || "--";
          const unitPrice = item.purchasePrice ?? item._dealPrice ?? 0;
          const quantity = item.quantity ?? item._dealQty ?? 0;
          const deliveryDate = item.receivedDate || item.expectedDeliveryDate;

          return (
            <AppCard
              key={item._id || poId || idx}
              noPadding
              className="tw:mb-0"
            >
              {/* Header: PO ID and Status */}
              <div className="tw:px-4 tw:py-3 tw:flex tw:items-start">
                <div className="tw:w-[70%]">
                  <div className="tw:flex tw:flex-col tw:gap-1">
                    <AppLink
                      asLink
                      href={`/dashboard/purchase-order/view/${item._id}`}
                      className="tw:text-blue-500 tw:font-semibold tw:text-lg"
                    >
                      {poId}
                    </AppLink>
                    {/* Date with icon */}
                    <div className="tw:flex tw:items-center tw:gap-2 tw:text-gray-400 tw:text-xs">
                      <Calendar size={14} />
                      <span>
                        {item.createdAt ? (
                          <DateFormat
                            value={item.createdAt}
                            formatStr="dd MMM yyyy, hh:mm a"
                          />
                        ) : (
                          "--"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="tw:flex tw:flex-col">
                  <span className="tw:text-[10px] tw:text-gray-400 tw:uppercase tw:font-medium">
                    {t("status")}
                  </span>
                  <AppBadge variant={item._statusColor}>
                    {item._statusLbl || item.status || "--"}
                  </AppBadge>
                </div>
              </div>

              <Divider className="tw:my-0!" />

              {/* Body */}
              <div className="tw:px-4 tw:py-3">
                {/* Vendor - Full Row */}
                <div className="tw:mb-4">
                  <KeyValue label={t("vendor")} size="sm">
                    <AppLink
                      asLink
                      href={`/dashboard/vendor/view/${item.vendorId}`}
                      className="tw:text-blue-500 tw:font-medium"
                    >
                      {vendorName}
                    </AppLink>
                  </KeyValue>
                </div>

                <div className="tw:flex tw:items-center">
                  <div className="tw:w-[50%]">
                    {/* Quantity */}
                    <KeyValue label={t("quantity")} size="sm">
                      <span className="tw:font-bold tw:text-gray-800">
                        {quantity}{" "}
                        <span className="tw:font-normal">{t("units")}</span>
                      </span>
                    </KeyValue>
                  </div>

                  <div className="tw:w-[50%]">
                    {/* Unit Price */}
                    <KeyValue label={t("unitPrice")} size="sm">
                      <span className="tw:font-bold tw:text-gray-800">
                        <Amount value={unitPrice} />
                      </span>
                    </KeyValue>
                  </div>
                </div>

                <div className="tw:mt-3 tw:flex tw:items-center">
                  <div className="tw:w-[50%]">
                    {/* Total */}
                    <KeyValue label={t("total")} size="sm">
                      <Amount
                        value={unitPrice * quantity}
                        className="tw:text-green-600 tw:font-bold"
                      />
                    </KeyValue>
                  </div>

                  <div className="tw:w-[50%]">
                    {/* Delivery Date */}
                    <KeyValue label={t("deliveryDate")} size="sm">
                      <span className="tw:font-bold tw:text-gray-800">
                        {deliveryDate ? (
                          <DateFormat
                            value={deliveryDate}
                            formatStr="dd MMM yyyy"
                          />
                        ) : (
                          "--"
                        )}
                      </span>
                    </KeyValue>
                  </div>
                </div>
              </div>
            </AppCard>
          );
        })}
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
