import React from "react";
import { Calendar, MapPin, Navigation, Phone } from "lucide-react";
import UserBadgeType from "~/shared/store/badge/UserBadgeType";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import { useTranslation } from "react-i18next";
import DateFormat from "~/components/core/date/DateFormat";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppLink from "~/components/core/link/AppLink";
import StoreLinkPopover from "./StoreLinkPopover";

interface MobileViewProps {
  data: any[];
  callback: (action: { action: string; data: any }) => void;
  loading: boolean;
  showLoadMore: boolean;
  loadedCount: number;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  callback,
  loading = false,
  showLoadMore = false,
  loadedCount = 0,
  loadingMore = false,
  loadMore,
  totalCount = 0,
}) => {
  const { t } = useTranslation();

  if (loading && (!data || data.length === 0)) {
    return (
      <div className="tw:text-center tw:py-6">
        <AppSpinner />
      </div>
    );
  }

  if (!data || data.length === 0)
    return (
      <div className="tw:w-full tw:text-center tw:py-6">
        <div className="tw:text-lg tw:font-semibold tw:text-gray-800">
          No retailers found
        </div>
        <div className="tw:text-sm tw:text-gray-500 tw:mt-1">
          Try adjusting filters or search to broaden results
        </div>
      </div>
    );

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        {data.map((item, idx) => (
          <AppCard key={idx} className="tw:mb-0">
            <div className="tw:mb-4">
              <div className="tw:flex tw:items-center tw:gap-2">
                <div>
                  <button
                    onClick={() =>
                      callback({ action: "viewImages", data: item })
                    }
                  >
                    <ImgRender
                      assetId={item.shopImg}
                      className="tw:w-10 tw:h-10 tw:rounded-full"
                    />
                  </button>
                </div>
                <div className="tw:flex-1 tw:flex tw:items-center tw:justify-between">
                  <div>
                    <div className="tw:font-medium tw:mb-1 tw:line-clamp-1 tw:text-sm">
                      <AppLink
                        href={`/products/buy-from-other-retailer/retailer/${item._id}`}
                        showLinkColor
                        asLink
                      >
                        {item.name}
                      </AppLink>
                    </div>
                    <UserBadgeType type={item.displayType?.name} />
                  </div>
                  <div>
                    <AppLink
                      href={`/products/buy-from-other-retailer/retailer/${item._id}`}
                      asLink
                    >
                      <AppButton size="small">{t("browse")}</AppButton>
                    </AppLink>
                  </div>
                </div>
              </div>

              <div className="tw:flex tw:gap-2 tw:flex-wrap">
                <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-1">
                  <Calendar size={10} className="tw:text-gray-500 tw:mt-0.5" />
                  <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                </div>

                <div className="tw:mt-1">
                  <StoreLinkPopover mobile={item.mobile} />
                </div>

                <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-1">
                  ID:
                  <span className="tw:text-gray-500">
                    {item.franchiseId || "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="tw:bg-gray-50 tw:rounded-md tw:p-2 tw:mt-2 tw:flex tw:items-center tw:justify-between tw:mb-4">
              <KeyValue label={t("inventory")} size="sm">
                {item.analytics?.totalSubscribedInStockDeals ?? "0"}{" "}
                <span className="tw:text-xs tw:text-gray-500">
                  {t("products")}
                </span>{" "}
              </KeyValue>
              <KeyValue label={t("distance")} size="sm">
                <div className="tw:flex tw:gap-1 tw:items-center">
                  <Navigation size={12} className="tw:text-gray-500" />{" "}
                  {item.distanceToFranchiseKm || 0} {t("km")}
                </div>
              </KeyValue>
            </div>

            <div className="tw:flex tw:gap-2 tw:mt-2 tw:mb-1">
              <MapPin size={14} className="tw:text-gray-400 tw:mt-0.5" />
              <span className="tw:text-gray-400 tw:text-xs tw:line-clamp-2 tw:flex-1">
                {item.addressLine1}{" "}
                {item.addressLine2 ? `, ${item.addressLine2}` : ""}
              </span>
            </div>
            <div className="tw:text-xs tw:text-gray-500">
              {t("pincode")}: {item.pincode || "-"}
            </div>
          </AppCard>
        ))}
      </div>

      {showLoadMore && (
        <div className="tw-mt-4 tw-flex tw-justify-center">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount || 0}
            loadedCount={loadedCount || 0}
          />
        </div>
      )}
    </>
  );
};

export default MobileView;
