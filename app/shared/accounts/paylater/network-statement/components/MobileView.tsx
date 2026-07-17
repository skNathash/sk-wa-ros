import React from "react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import AppLink from "~/components/core/link/AppLink";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { useTranslation } from "react-i18next";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  callback?: (payload: { action: string; data: any }) => void;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading,
  callback,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
        <AppSpinner />
      </div>
    );
  }

  if (!data || !data.length) {
    return <NoData />;
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((row) => (
        <AppCard key={row._id} noPadding className="tw:mb-0">
          <div className="tw:p-4">
            <div className="tw:grid tw:grid-cols-2 tw:gap-4">
              <KeyValue label={t("orderId")} size="sm">
                <AppLink
                  asLink
                  href={`/dashboard/orders/view/${row.orderDetails?.orderId}`}
                  showLinkColor={true}
                >
                  {row.sourceReference ?? "-"}
                </AppLink>
              </KeyValue>

              <KeyValue label={t("orderDate")} size="sm">
                <DateFormat value={row.date ?? ""} formatStr="dd MMM yyyy" />
                <DateFormat
                  value={row.date ?? ""}
                  formatStr="hh:mm aa"
                  className="tw:ml-1 tw:text-slate-500 tw:text-xs"
                />
              </KeyValue>
            </div>
          </div>

          <Divider className="tw:!my-0" />

          <div className="tw:p-4">
            <div className="tw:grid tw:grid-cols-2 tw:gap-4">
              <KeyValue label={t("amountDebit")} size="sm">
                <span className="tw:font-semibold tw:text-red-600">
                  <Amount value={row.rawAmount ?? 0} decimalPlaces={2} />
                </span>
              </KeyValue>

              <KeyValue label={t("availableLimit")} size="sm">
                <Amount
                  value={row.rawBalance ?? 0}
                  decimalPlaces={2}
                  className="tw:text-green-600 tw:font-semibold"
                />
              </KeyValue>
            </div>
          </div>

          <Divider className="tw:!my-0" />

          <div className="tw:p-4">
            <KeyValue label={t("description")} size="sm">
              <div className="tw:text-slate-600">{row.description || "-"}</div>
            </KeyValue>
          </div>
        </AppCard>
      ))}

      {hasMoreData && !loading && data.length > 0 && (
        <div className="tw:text-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </div>
  );
};

export default MobileView;
