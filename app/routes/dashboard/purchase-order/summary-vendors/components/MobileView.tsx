import clsx from "clsx";
import { Building2, Phone } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

type Props = {
  data: Array<any>;
  groupByType?: string;
  showLoadMore?: boolean;
  loadMore?: () => void;
  loadingMore?: boolean;
  totalCount?: number;
  loadedCount?: number;
};

const MobileView: React.FC<Props> = ({
  data,
  groupByType,
  showLoadMore = false,
  loadMore,
  loadingMore = false,
  totalCount = 0,
  loadedCount = 0,
}) => {
  const { t } = useTranslation(["common"]);

  const isReceivedView = groupByType === "received";

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((vendor, idx) => (
        <AppCard key={idx} noPadding className="tw:mb-0">
          <div className="tw:px-4 tw:py-4 tw:border-b tw:border-gray-200">
            <div className="tw:font-medium tw:text-base tw:text-gray-900">
              <div className="tw:text-xs tw:text-gray-500">{t("vendor")}</div>
              {vendor?.isSellerOrder ? (
                <div className="tw:font-semibold tw:block tw:line-clamp-2">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <Building2 size={16} />
                    {vendor?.vendorInfo?.name ?? ""}
                  </div>
                </div>
              ) : (
                <AppLink
                  href={`/dashboard/vendor/view/${vendor.vendorInfo?.id}/purchase-order?tab=purchase-order`}
                  className="tw:font-semibold tw:block tw:line-clamp-2"
                  asLink
                >
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <Building2 size={16} />
                    {vendor?.vendorInfo?.name ?? ""}
                  </div>
                </AppLink>
              )}

              <div className="tw:flex tw:gap-2 tw:items-center tw:mt-1">
                <div className="tw:text-xs tw:text-gray-500">
                  {t("id")} : {vendor?.vendorInfo?.vendorId ?? "-"}
                </div>
                {vendor?.vendorInfo?.mobile && (
                  <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                    <Phone size={12} />
                    {vendor?.vendorInfo?.mobile}
                  </div>
                )}
                {vendor?._vendorType && (
                  <VendorTypeBadge
                    type={vendor._vendorType}
                    color={vendor._vendorTypeColor}
                    description={vendor._vendorTypeInfo}
                    className="tw:text-[10px]"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="tw:px-4 tw:py-4">
            <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:items-center">
              <KeyValue
                label={isReceivedView ? t("receivedPo") : t("openPo")}
                size="sm"
              >
                <div
                  className={clsx("tw-font-medium", {
                    "tw-text-green-600":
                      isReceivedView && (vendor?.receivedPOCount ?? 0) > 0,
                    "tw-text-red-600":
                      !isReceivedView && (vendor?.notReceivedPOCount ?? 0) > 0,
                    "tw-text-gray-400": isReceivedView
                      ? (vendor?.receivedPOCount ?? 0) === 0
                      : (vendor?.notReceivedPOCount ?? 0) === 0,
                  })}
                >
                  {isReceivedView
                    ? (vendor?.receivedPOCount ?? 0)
                    : (vendor?.notReceivedPOCount ?? 0)}
                </div>
              </KeyValue>

              <KeyValue
                label={isReceivedView ? t("receivedPoValue") : t("openPoValue")}
                size="sm"
              >
                <Amount
                  value={
                    isReceivedView
                      ? vendor?.receivedPOValue || 0
                      : vendor?.notReceivedPOValue || 0
                  }
                  decimalPlaces={2}
                  className={clsx({
                    "tw-text-green-600":
                      isReceivedView && (vendor?.receivedPOValue ?? 0) > 0,
                    "tw-text-red-600":
                      !isReceivedView && (vendor?.notReceivedPOValue ?? 0) > 0,
                    "tw-text-gray-400": isReceivedView
                      ? (vendor?.receivedPOValue ?? 0) === 0
                      : (vendor?.notReceivedPOValue ?? 0) === 0,
                  })}
                />
              </KeyValue>
            </div>
          </div>
        </AppCard>
      ))}
      {showLoadMore && data.length > 0 && loadMore && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={loadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
        />
      )}
    </div>
  );
};

export default MobileView;
