import { Bell, Phone } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";
import { useTranslation } from "react-i18next";

type Props = {
  data: any[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  callback?: (payload: { action: string; data: any }) => void;
};

const MobileView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  callback,
}: Props) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
        <AppSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3 tw:pb-4">
        {data.map((item, idx) => (
          <AppCard key={idx} noPadding>
            <div className="tw:flex tw:justify-between tw:gap-2 tw:px-4 tw:py-3">
              <div>
                <div className="tw:flex-1 tw:min-w-0">
                  <AppLink
                    asLink
                    href={item.userRedirectionLink}
                    className="tw:mb-1 tw:line-clamp-1"
                  >
                    <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate tw:flex tw:items-center tw:gap-1">
                      {item.userInfo?.name || "-"}{" "}
                      {item.userCategory && (
                        <AppBadge
                          variant={
                            item.userCategory === "B2C"
                              ? "primary"
                              : "secondary"
                          }
                        >
                          {item.userCategory}
                        </AppBadge>
                      )}
                    </div>
                  </AppLink>
                  {item.userInfo?.mobile && (
                    <AppLink
                      asLink
                      href={`tel:${item.userInfo.mobile}`}
                      className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-0.5"
                    >
                      <Phone size={12} />
                      {item.userInfo.mobile}
                    </AppLink>
                  )}
                </div>
              </div>
              <div>
                {item.isOverdue ? (
                  <AppBadge variant="danger" className="tw:text-xs">
                    Overdue
                  </AppBadge>
                ) : item.isDueToday ? (
                  <AppBadge variant="warning" className="tw:text-xs">
                    Due Today
                  </AppBadge>
                ) : null}

                <div>
                  <DateFormat
                    value={item.validityEndDate}
                    formatStr="dd MMM yyyy"
                    className="tw:text-xs tw:text-gray-700"
                  />
                </div>
              </div>
            </div>

            <Divider className="tw:!my-0" />

            <div className="tw:flex tw:justify-between tw:gap-2 tw:px-4 tw:py-3">
              <div className="tw:grid tw:grid-cols-2  tw:gap-2 tw:flex-1">
                <KeyValue label={t("dueAmount")} size="sm">
                  <Amount
                    value={item.totalPayableAmount}
                    decimalPlaces={2}
                    className="tw:text-red-600 tw:font-semibold"
                  />
                </KeyValue>
                <KeyValue label={t("creditLimit")} size="sm">
                  <Amount
                    value={item.creditLimit}
                    decimalPlaces={2}
                    className="tw:text-green-600 tw:font-semibold"
                  />
                </KeyValue>
              </div>
              <div>
                <AppButton
                  size="small"
                  color="light"
                  fill="outline"
                  expand="block"
                  className="tw:text-xs"
                  onClick={() =>
                    callback &&
                    callback({ action: "send-reminder", data: item })
                  }
                >
                  <Bell size={14} />
                  {t("sendReminder")}
                </AppButton>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
      {hasMoreData && !loading && data.length > 0 && (
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
