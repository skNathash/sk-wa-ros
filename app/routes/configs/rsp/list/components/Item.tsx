import { Tag, BarChart2, Edit3, Eye } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import KeyValue from "~/components/core/key-value/KeyValue";
import DateFormat from "~/components/core/date/DateFormat";
import CommonService from "~/services/CommonService";
import clsx from "clsx";
import AppLink from "~/components/core/link/AppLink";

interface ItemProps {
  data: any;
  callback?: (action: { action: string; data?: any }) => void;
  type?: "network" | "customer";
}

const Item = ({ data, callback, type }: ItemProps) => {
  const handleEdit = () => {
    callback?.({ action: "edit", data });
  };

  const handleView = () => {
    callback?.({ action: "view", data });
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getDiscountPercentage = () => {
    if (data.isFixedPrice) {
      return null; // No percentage for fixed price
    }
    // Calculate percentage discount from MRP
    if (data.mrp && data.sellingPrice) {
      const discount = ((data.mrp - data.sellingPrice) / data.mrp) * 100;
      return discount > 0 ? discount.toFixed(1) : null;
    }
    return null;
  };

  const getNetworkDiscountPercentage = () => {
    if (data.isFixedPrice) {
      return null; // No percentage for fixed price
    }
    // Calculate percentage discount from MRP
    if (data.mrp && data.networkPrice) {
      const discount = ((data.mrp - data.networkPrice) / data.mrp) * 100;
      return discount > 0 ? discount.toFixed(1) : null;
    }
    return null;
  };

  const handleViewDeal = () => {
    callback?.({ action: "viewDeal", data });
  };

  return (
    <AppCard>
      <div className="tw:flex tw:justify-between tw:items-start tw:mb-4">
        <div className="tw:flex-1">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
            <div className="tw:font-semibold">
              <AppLink onClick={handleViewDeal}>{data.deal?.name}</AppLink>
            </div>
            <AppBadge variant={getStatusVariant(data.status)}>
              {data.status || "Unknown"}
            </AppBadge>
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
            {data.category?.name || data.deal?.category?.name} /{" "}
            {data.brand?.name || data.deal?.brand?.name}
          </div>
          <div className="tw:flex tw:gap-4 tw:flex-wrap">
            <KeyValue label="ID" size="sm" horizontal>
              {data.deal?.id}
            </KeyValue>

            <KeyValue label="MRP" size="sm" horizontal>
              <Amount
                value={data.mrp}
                className="tw:text-red-500 tw:font-semibold"
              />
            </KeyValue>

            <KeyValue label="Purchase Price" size="sm" horizontal>
              <Amount
                value={data.b2bPrice}
                decimalPlaces={2}
                className="tw:text-primary tw:font-semibold"
              />
            </KeyValue>
          </div>
        </div>
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
        <div>
          <div className="tw:mb-2 tw:text-base tw:flex tw:items-center tw:gap-2">
            <Tag className="tw-w-4 tw-h-4" />
            Price Information
          </div>

          <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:mb-2 tw:mt-2">
            <KeyValue
              label={data.isFixedPrice ? "Fixed Price" : "Discount"}
              size="sm"
              className="tw:text-red-600 tw:font-bold tw:bg-yellow-100 tw:p-1 tw:rounded-md"
            >
              {data.isFixedPrice ? (
                <Amount value={data.fixedPrice} decimalPlaces={2} />
              ) : (
                CommonService.roundedByDecimalPlace(data.discount, 2) + "%"
              )}
            </KeyValue>

            <KeyValue
              label="Selling Price"
              size="sm"
              className="tw:text-green-600 tw:font-bold tw:bg-green-100 tw:p-1 tw:rounded-md"
            >
              <div className="tw:flex tw:items-center tw:gap-2">
                <Amount value={data.sellingPrice} decimalPlaces={2} />
              </div>
            </KeyValue>

            <KeyValue
              label="Profit"
              size="sm"
              className={clsx("tw:bg-gray-50 tw:p-1 tw:rounded-md", {
                "tw:text-green-600 tw:font-bold tw:!bg-green-100":
                  data.profit >= 0,
                "tw:text-red-600 tw:font-bold tw:!bg-red-100": data.profit < 0,
              })}
            >
              <Amount value={data.profit} />
            </KeyValue>
          </div>
        </div>

        <div>
          <div className="tw:mb-2 tw:text-base tw:flex tw:items-center tw:gap-2">
            <BarChart2 className="tw-w-4 tw-h-4" />
            Sales Performance
          </div>
          <div className="tw:grid tw:grid-cols-4 tw:gap-2">
            <div className="tw:bg-gray-50 tw:p-2 tw:rounded-md">
              <KeyValue label="Last 7 Days" size="sm">
                {data._stock?.salesData?.sevenday?._qty || 0}
              </KeyValue>
            </div>

            <div className="tw:bg-gray-50 tw:p-2 tw:rounded-md">
              <KeyValue label="Last 15 Days" size="sm">
                {data._stock?.salesData?.fifteenday?._qty || 0}{" "}
                {data._stock?.uom}
              </KeyValue>
            </div>

            <div className="tw:bg-gray-50 tw:p-2 tw:rounded-md">
              <KeyValue label="Last 30 Days" size="sm">
                {data._stock?.salesData?.thirtyday?._qty || 0}{" "}
                {data._stock?.uom}
              </KeyValue>
            </div>

            <div className="tw:bg-gray-50 tw:p-2 tw:rounded-md">
              <KeyValue label="Last 90 Days" size="sm">
                {data._stock?.salesData?.ninetyday?._qty || 0}{" "}
                {data._stock?.uom}
              </KeyValue>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons and Last Modified - Bottom Right */}
      <div className="tw:flex tw:justify-between tw:items-center tw:mt-4">
        <div className="tw:text-xs tw:text-gray-500 tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:gap-x-2">
          Last modified:{" "}
          <DateFormat
            value={data.modifiedAt}
            formatStr="dd MMM yyyy, hh:mm a"
          />
        </div>
        <div className="tw:flex tw:gap-2">
          <AppButton
            size="small"
            fill="outline"
            onClick={handleView}
            className="tw:min-w-[80px]"
          >
            <Eye className="tw-w-4 tw-h-4" />
            View
          </AppButton>
          <AppButton
            size="small"
            onClick={handleEdit}
            className="tw:min-w-[80px]"
          >
            <Edit3 className="tw-w-4 tw-h-4" />
            Edit
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default Item;
