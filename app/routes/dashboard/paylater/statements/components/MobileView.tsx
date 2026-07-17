import { Phone, User } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

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
    <div>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {data.map((row) => (
          <div
            key={row._id}
            className="tw:border tw:border-gray-200 tw:rounded tw:p-4 tw:bg-white"
          >
            <div className="tw:flex tw:justify-between tw:items-center">
              <div>
                <DateFormat
                  value={row.date ?? ""}
                  formatStr="dd MMM yyyy"
                  className="tw:text-sm tw:text-slate-600"
                />
                <div className="tw:text-xs tw:text-slate-500">
                  <DateFormat value={row.date ?? ""} formatStr="hh:mm a" />
                </div>
              </div>
              <AppLink
                asLink
                href={`/dashboard/orders/view/${row.orderDetails?.orderId}`}
                className="tw:text-sm"
              >
                <code>{row.sourceReference || "-"}</code>
              </AppLink>
            </div>

            <Divider />

            <div>
              <div className="tw:flex tw:items-center tw:gap-1">
                <User size={16} className="tw:text-gray-600" />
                <div className="tw:text-base tw:font-semibold">
                  <AppLink asLink href={row.user?.redirectionLink ?? "#"}>
                    {row.user?.name || "-"}
                  </AppLink>
                </div>
                <AppBadge
                  variant={row.user?.type === "B2C" ? "primary" : "secondary"}
                >
                  {row.user?.type || "-"}
                </AppBadge>
              </div>
              {row.user?.mobile && (
                <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                  <Phone size={12} className="tw:text-gray-500" />
                  <AppLink asLink href={`tel:${row.user?.mobile}`}>
                    {row.user?.mobile}
                  </AppLink>
                </div>
              )}
            </div>

            <Divider />

            <div className="tw:text-sm tw:md:text-xs tw:font-medium tw:mb-2">
              Description
            </div>
            <div className="tw:bg-gray-50 tw:p-2 tw:rounded-md">
              <div className="tw:text-sm tw:md:text-xs tw:text-slate-600">
                {row.description || "-"}
              </div>
            </div>

            <Divider />

            <div className="tw:space-y-2">
              <div className="tw:flex tw:justify-between tw:items-center tw:text-sm">
                <span className="tw:text-slate-500">Amount Debit</span>
                <span className="tw:font-semibold tw:text-red-600 tw:text-base">
                  <Amount value={row.rawAmount ?? 0} decimalPlaces={2} />
                </span>
              </div>

              <div className="tw:flex tw:justify-between tw:items-center tw:text-sm tw:bg-green-50 tw:p-2 tw:rounded-md tw:text-green-600 tw:font-semibold">
                <span>Available Limit</span>
                <Amount value={row.rawBalance ?? 0} decimalPlaces={2} />
              </div>
            </div>
          </div>
        ))}
      </div>
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
