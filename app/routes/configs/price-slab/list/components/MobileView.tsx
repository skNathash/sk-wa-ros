import { Edit, Eye } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import SlabGrid from "./SlabGrid";
import AppLink from "~/components/core/link/AppLink";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
  callback?: (args: { action: string; data?: any }) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
}

const MobileView: React.FC<MobileViewProps> = ({
  data = [],
  loading = false,
  callback,
  showLoadMore = true,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
}) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return (
      <div className="tw:p-4">
        <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
          <AppSpinner />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:p-4">
        <div className="tw:text-center">{t("noData") || "No data found"}</div>
      </div>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {data.map((item, idx) => (
          <AppCard key={item._id + "-" + idx}>
            {/* Header Row - Product Info & Status */}
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:font-semibold tw:text-slate-900 tw:text-sm tw:line-clamp-2 tw:mb-2">
                  {item?.configType === "Deal" ? (
                    <AppLink
                      asLink
                      href={`/dashboard/inventory/products/view/${item.referenceInfo?.id}`}
                      showLinkColor
                      className="tw:font-medium"
                    >
                      {item.referenceInfo?.name || "--"}
                    </AppLink>
                  ) : (
                    <>{item.referenceInfo?.name || "--"}</>
                  )}
                </div>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div className="tw:text-[10px] tw:text-slate-500">
                    ID: {item.referenceInfo?.refId}
                  </div>
                  <AppBadge
                    variant={item.isActive ? "success" : "danger"}
                    className="tw:text-[10px] tw:px-1.5 tw:py-0.5 tw:shrink-0"
                  >
                    {item.isActive ? t("active") : t("inactive")}
                  </AppBadge>
                </div>
              </div>
            </div>

            {/* Price Slabs - Compact View */}
            <div className="tw:mb-4">
              <SlabGrid slabs={item.slab || []} />
            </div>

            <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:mb-4">
              <KeyValue label="Created At" size="sm">
                <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={item.createdAt} formatStr="hh:mm a" />
                </div>
              </KeyValue>

              <KeyValue label="Updated At" size="sm">
                {item.modifiedAt ? (
                  <>
                    <DateFormat
                      value={item.modifiedAt}
                      formatStr="dd MMM yyyy"
                    />
                    <div className="tw:text-xs tw:text-gray-500">
                      <DateFormat value={item.modifiedAt} formatStr="hh:mm a" />
                    </div>
                  </>
                ) : (
                  <span className="tw:text-gray-500 tw:text-center">--</span>
                )}
              </KeyValue>
            </div>

            {/* Action Button */}
            <div className="tw:flex tw:justify-between tw:gap-2">
              <AppButton
                size="small"
                fill="outline"
                color="light"
                onClick={() => callback?.({ action: "logs", data: item })}
                className="tw:text-xs tw:px-3 tw:py-1"
              >
                <Eye size={16} />
                View Logs
              </AppButton>
              <AppButton
                size="small"
                fill="outline"
                color="primary"
                onClick={() => callback?.({ action: "edit", data: item })}
                className="tw:text-xs tw:px-3 tw:py-1"
              >
                <Edit size={16} />
                {t("edit")}
              </AppButton>
            </div>
          </AppCard>
        ))}
      </div>

      {showLoadMore && (
        <div className="tw:text-center tw:mt-3">
          <LoadMoreButton
            loadMore={() => loadMore && loadMore()}
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
