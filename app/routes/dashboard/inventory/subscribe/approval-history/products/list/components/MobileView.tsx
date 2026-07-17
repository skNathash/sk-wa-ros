import { Package, ChevronUp, ChevronDown, FileText } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import DealLinked from "../../../components/DealLinked";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";

interface MobileViewProps {
  data: Record<string, any>[];
  callback: (a: { action: string; data: Record<string, any> }) => void;
  loading?: boolean;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  callback,
  loading = false,
}) => {
  const { t } = useTranslation(["common"]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  if (loading) {
    return (
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200"
          >
            <div className="tw:animate-pulse">
              <div className="tw:flex tw:items-start tw:mb-4">
                <div className="tw:w-16 tw:h-16 tw:bg-gray-200 tw:rounded tw:mr-4"></div>
                <div className="tw:flex-1">
                  <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:mb-2"></div>
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:mb-2"></div>
                  <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/2"></div>
                </div>
              </div>
              <div className="tw:space-y-3">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div
                    key={j}
                    className="tw:flex tw:justify-between tw:items-center"
                  >
                    <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/4"></div>
                    <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/3"></div>
                  </div>
                ))}
              </div>
              <div className="tw:mt-4 tw:h-8 tw:bg-gray-200 tw:rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && (!data || data.length === 0)) {
    return <NoData />;
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item) => {
        const itemId = item._id || item.id;
        const isExpanded = expandedItems[itemId] === true; // Default to false (closed)

        return (
          <div
            key={itemId}
            className="tw:bg-white tw:rounded-lg tw:border tw:border-gray-200"
          >
            {/* Product Header Section */}
            <div className="tw:flex tw:items-start tw:p-4 tw:pb-4">
              {/* Product Image */}
              <div className="tw:w-16 tw:h-16 tw:bg-gray-100 tw:rounded tw:flex tw:items-center tw:justify-center tw:mr-4 tw:overflow-hidden tw:flex-shrink-0">
                {item.images && item.images.length > 0 ? (
                  <ImgRender
                    assetId={item.images[0]}
                    className="tw:w-full tw:h-full tw:object-cover tw:rounded"
                    alt={item.productName}
                  />
                ) : (
                  <Package className="tw:w-8 tw:h-8 tw:text-gray-400" />
                )}
              </div>

              {/* Product Text Details */}
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:md:h-14">
                  <div className="tw:font-semibold tw:text-base tw:text-gray-900 tw:mb-2 tw:line-clamp-2">
                    {item.productName}
                  </div>
                </div>
                <div className="tw:flex tw:gap-2 tw:flex-wrap tw:items-center tw:mb-1">
                  <AppBadge variant="light" className="tw:text-slate-600">
                    {item?.orgData?.newBrand || item.brand?.name || "-"}
                  </AppBadge>
                  <AppBadge variant="light" className="tw:text-slate-600">
                    {item.category?.name || "-"}
                  </AppBadge>
                </div>
                <div className="tw:flex tw:gap-2 tw:flex-wrap tw:items-center">
                  {item?.orgData?.isConsumerOffer && <ConsumerOfferBadge />}
                  <AppBadge variant={item.statusColor} className="tw:text-xs">
                    {item.statusLabel || t("pending")}
                  </AppBadge>
                  <DealLinked
                    isLinkedExisting={item.isLinkedExisting}
                    isLinkedNew={item.isLinkedNew}
                  />
                </div>
              </div>
            </div>

            {/* Approval Detail Section - Collapsible */}
            <div>
              <div className="tw:px-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(itemId);
                  }}
                  className="tw:w-full tw:flex tw:items-center tw:justify-between tw:mb-0 tw:cursor-pointer tw:py-2"
                >
                  <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                    Approval Detail
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={18} className="tw:text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="tw:text-gray-500" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="tw:bg-blue-50 tw:p-4 tw:space-y-3">
                  {/* Date */}
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <span className="tw:text-sm tw:text-gray-700">
                      {t("date")}
                    </span>
                    <span className="tw:text-sm tw:text-gray-900">
                      <DateFormat
                        value={item.createdAt}
                        formatStr="dd MMM yyyy, HH:mm"
                      />
                    </span>
                  </div>

                  {/* Admin Notes */}
                  <div className="tw:flex tw:justify-between tw:items-start">
                    <span className="tw:text-sm tw:text-gray-700">
                      {t("adminNotes")}
                    </span>
                    <span className="tw:text-sm tw:text-gray-600 tw:text-right tw:max-w-[60%]">
                      {item.remarks || "-"}
                    </span>
                  </div>

                  {/* Reviewed By */}
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <span className="tw:text-sm tw:text-gray-700">
                      {t("reviewedBy")}
                    </span>
                    <span className="tw:text-sm tw:text-gray-900">
                      {item.updatedByName || "-"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button Section */}
            <div className="tw:pt-3 tw:px-4 tw:pb-4 tw:border-t tw:border-gray-100">
              <AppButton
                color="primary"
                size="small"
                className="tw:w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  callback({ action: "view", data: item });
                }}
              >
                <FileText size={14} />
                {t("view")} {t("summary")}
              </AppButton>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileView;
