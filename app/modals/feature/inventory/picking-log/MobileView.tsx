import React from "react";
import KeyValue from "~/components/core/key-value/KeyValue";
import DateFormat from "~/components/core/date/DateFormat";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppLink from "~/components/core/link/AppLink";
import { Package, User } from "lucide-react";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface PickingLogItem {
  _id: string;
  createdBy: { name: string };
  totalPickedQty: number;
  pickingStartedOn: string; // ISO date
  order?: {
    id: string;
    orderRefNo: string;
    orderedDate: string;
  };
}

interface MobileViewProps {
  data: PickingLogItem[];
  loading?: boolean;
  selectedStockUom?: string;
}

const MobileView: React.FC<MobileViewProps> = ({
  data = [],
  loading,
  selectedStockUom,
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
        No picking logs found
      </div>
    );
  }

  return (
    <div className="tw:space-y-3">
      {data.map((item, idx) => (
        <div
          key={`${item._id || idx}`}
          className="tw:p-4 tw:border tw:border-gray-200 tw:rounded-lg tw:bg-white"
        >
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <KeyValue label="Picked By" size="sm">
              <div className="tw:flex tw:items-center tw:gap-2">
                <User className="tw:w-4 tw:h-4 tw:text-primary" />
                <span>{item.createdBy?.name || "-"}</span>
              </div>
            </KeyValue>

            <KeyValue
              label="Quantity"
              size="sm"
              className="tw:text-green-600 tw:font-bold"
            >
              <div className="tw:flex tw:items-center tw:gap-1">
                <Package className="tw:w-4 tw:h-4" />
                <span>
                  <DisplayQty
                    qty={item.totalPickedQty || 0}
                    isLooseQty={false}
                    uom={selectedStockUom}
                  />
                </span>
              </div>
            </KeyValue>

            <KeyValue label="Date" size="sm">
              {item.pickingStartedOn ? (
                <DateFormat
                  value={item.pickingStartedOn}
                  formatStr="dd MMM yyyy"
                />
              ) : (
                "-"
              )}
            </KeyValue>

            <KeyValue label="Time" size="sm">
              {item.pickingStartedOn ? (
                <DateFormat value={item.pickingStartedOn} formatStr="hh:mm a" />
              ) : (
                "-"
              )}
            </KeyValue>

            <KeyValue label="Order ID" size="sm">
              {item.order ? (
                <AppLink
                  href={`/dashboard/orders/view/${item.order.id}`}
                  asLink
                >
                  {item.order.orderRefNo || "-"}
                </AppLink>
              ) : (
                "-"
              )}
            </KeyValue>

            <KeyValue label="Order Date" size="sm">
              {item.order?.orderedDate ? (
                <>
                  <DateFormat
                    value={item.order.orderedDate}
                    formatStr="dd MMM yyyy"
                  />
                  <div className="tw:text-xs tw:text-gray-500">
                    <DateFormat
                      value={item.order.orderedDate}
                      formatStr="hh:mm a"
                    />
                  </div>
                </>
              ) : (
                "-"
              )}
            </KeyValue>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
