import React from "react";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import DateFormat from "~/components/core/date/DateFormat";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

interface BlockedInfoItem {
  blockedAt?: string; // ISO date
  customerInfo?: { name?: string } | null;
  orderType?: string;
  orderId?: string | number;
  orderRefId?: string | number;
  quantity?: number;
}

interface MobileViewProps {
  data: BlockedInfoItem[];
  loading?: boolean;
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  deal?: { sellInLooseQty?: boolean } | null;
}

const MobileView: React.FC<MobileViewProps> = ({
  data = [],
  loading,
  hasMore,
  isLoading,
  onLoadMore,
  deal = null,
}) => {
  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-24">
        <AppSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:text-center tw:text-gray-500">
        No blocked qty found
      </div>
    );
  }

  return (
    <div className="tw:space-y-2">
      {data.map((item, idx) => (
        <div
          key={`${item.orderId ?? item.orderRefId ?? idx}`}
          className="tw:p-4 tw:border-1 tw:border-gray-200 tw:rounded-lg"
        >
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            <KeyValue label="Order ID" size="sm">
              {item.orderRefId ?? "--"}
            </KeyValue>
            <KeyValue
              label="Qty"
              size="sm"
              className="tw:text-red-500 tw:font-bold"
            >
              <DisplayQty
                qty={item.quantity ?? 0}
                isLooseQty={!!deal?.sellInLooseQty}
              />
            </KeyValue>

            <KeyValue label="Type" size="sm">
              {item.orderType ?? "-"}
            </KeyValue>
            <KeyValue label="Date" size="sm">
              {item.blockedAt ? <DateFormat value={item.blockedAt} /> : "-"}
            </KeyValue>

            <KeyValue label="Customer" size="sm">
              {item.customerInfo?.name ?? "-"}
            </KeyValue>
          </div>
        </div>
      ))}

      {hasMore ? (
        <div className="tw:flex tw:justify-center tw:mt-2">
          <AppButton
            size="small"
            onClick={onLoadMore}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </AppButton>
        </div>
      ) : null}
    </div>
  );
};

export default MobileView;
