import {
  Calendar,
  Briefcase,
  Clock,
  CreditCard,
  Box,
  ArrowRight,
} from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import Amount from "~/components/core/amount/Amount";
import PurchaseOrderService from "~/services/PurchaseOrderService";

type Props = {
  data: any;
  callback: (a: { action: string; data: any }) => void;
  tab?: string; // Added for compatibility
};

const MobileView = ({ data, callback }: Props) => {
  const formattedData = PurchaseOrderService.formatPurchaseOrderData(data);

  return (
    <div
      onClick={() => callback({ action: "view", data })}
      className="tw:cursor-pointer"
    >
      <AppCard>
        {/* Block 1: PO ID and Date */}
        <div className="tw:flex tw:justify-between tw:items-start tw:mb-3">
          <div>
            <div className="tw:text-sm tw:font-semibold tw:text-gray-700 tw:mb-1">
              <AppLink onClick={(e) => e.stopPropagation()}>{data._id}</AppLink>
            </div>
            <div className="tw:text-sm tw:text-gray-500 tw:flex tw:items-center tw:gap-2">
              <Calendar />
              <DateFormat
                value={data.createdAt}
                formatStr="dd MMM yyyy hh:mm a"
              />
            </div>
          </div>
          <AppBadge variant={formattedData._statusColor as any}>
            {formattedData._statusLabel}
          </AppBadge>
        </div>

        {/* Block 2: Vendor Information */}
        <div className="tw:mb-3">
          <div className="tw:text-xs tw:font-semibold tw:text-gray-600 tw:mb-1">
            Vendor Details
          </div>
          <div
            className="tw:text-sm tw:font-medium tw:mb-1 tw:line-clamp-1"
            title={data.vendorDetails?.name}
          >
            {data.vendorDetails?.name || "N/A"}
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-2">
            <Briefcase />
            <span>{data.vendorDetails?.id || "N/A"}</span>
          </div>
        </div>

        {/* Block 3: Order Summary */}
        <div className="tw:mb-3">
          <div className="tw:text-xs tw:font-semibold tw:text-gray-600 tw:mb-1">
            Order Summary
          </div>
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:flex tw:items-center tw:gap-2">
              <Box className="tw:text-gray-400" />
              <span className="tw:text-sm tw:font-medium">
                {formattedData._totalItems} items
              </span>
              <span className="tw:text-xs tw:text-gray-500">
                (Qty: {formattedData._totalQuantity})
              </span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <CreditCard className="tw:text-gray-400" />
              <Amount value={data.totalValue || 0} />
            </div>
          </div>
        </div>

        {/* Block 4: Action Buttons */}
        <div className="tw:flex tw:gap-2">
          <AppButton
            size="small"
            color="primary"
            noShadow={true}
            onClick={(e) => {
              e.stopPropagation();
              callback({ action: "view", data });
            }}
            className="tw:flex-1"
            fill="outline"
          >
            View Details
            <ArrowRight className="tw:ml-2" />
          </AppButton>

          {data.status === "Approved" && (
            <AppButton
              size="small"
              color="success"
              noShadow={true}
              onClick={(e) => {
                e.stopPropagation();
                callback({ action: "receive", data });
              }}
              className="tw:flex-1"
            >
              Receive Stock
            </AppButton>
          )}

          {data.status === "Draft" && (
            <AppButton
              size="small"
              color="warning"
              noShadow={true}
              onClick={(e) => {
                e.stopPropagation();
                callback({ action: "edit", data });
              }}
              className="tw:flex-1"
            >
              Edit PO
            </AppButton>
          )}
        </div>
      </AppCard>
    </div>
  );
};

export default MobileView;
