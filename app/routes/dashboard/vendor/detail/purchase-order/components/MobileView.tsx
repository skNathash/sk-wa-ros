import { ArrowRight, Box, Calendar, Eye, IndianRupee } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";

const MobileView = ({
  data,
  callback,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
}: {
  data: any[];
  callback: (a: { action: string; data: any }) => void;
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
}) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
        <AppSpinner />
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item, idx) => (
        <AppCard key={idx} noPadding className="tw:mb-0">
          <div className="tw:flex tw:justify-between tw:items-center tw:p-4">
            <div className="tw:flex-1">
              <AppLink
                asLink
                href={`/dashboard/purchase-order/view/${item._id}`}
                showLinkColor
                className="tw:font-semibold"
              >
                {item.orderId}
              </AppLink>
              <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                <DateFormat value={item.createdAt} />
              </div>
            </div>

            <div>
              <AppLink
                asLink
                href={`/dashboard/purchase-order/view/${item._id}`}
                noUnderline
              >
                <AppButton size="small" fill="outline">
                  <Eye />
                  {t("view")}
                </AppButton>
              </AppLink>
            </div>
          </div>
          <Divider className="tw:my-0!" />

          <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:p-4">
            <KeyValue label={t("orderSummary")} size="sm">
              <span className="tw:font-medium">
                {item.items?.length} {t("products")}
              </span>
              <div className="tw:text-xs tw:text-gray-500">
                ({item._totalQuantity} {t("totalUnits")})
              </div>
            </KeyValue>

            <KeyValue label={t("totalValue")} size="sm">
              <Amount value={item._totalValue} className="tw:font-medium" />
            </KeyValue>

            <KeyValue label={t("status")} size="sm">
              <AppBadge variant={item._statusColor as any}>
                {item._statusLabel}
              </AppBadge>
            </KeyValue>
          </div>
        </AppCard>
      ))}
      {showLoadMore && !loading && data.length > 0 && (
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
