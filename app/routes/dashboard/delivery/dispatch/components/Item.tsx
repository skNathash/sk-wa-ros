import React from "react";
import { Send, Key, Calendar } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";

type ItemProps = {
  data: any;
  callback?: (args: { action: string; data?: any }) => void;
};

const Item: React.FC<ItemProps> = ({ data, callback }) => {
  const { t } = useTranslation(["common"]);
  const shippedDate =
    data?.shippedOn || data?.invoices?.[0]?.shippingDetails?.shippedOn;

  return (
    <AppCard noPadding className="tw:mb-0">
      {/* Header: order ID + badge left, ordered date + action right */}
      <div className="tw:flex tw:items-start tw:justify-between tw:px-3 tw:py-2.5">
        <div>
          <div className="tw:flex tw:items-center tw:gap-1.5">
            <AppLink
              href={`/dashboard/orders/view/${data.orderId}`}
              asLink
              showLinkColor
              className="tw:font-semibold tw:text-sm"
            >
              {data.orderRefNo}
            </AppLink>
            <AppBadge variant={data._typeColor}>{data.orderType}</AppBadge>
          </div>
          <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-0.5">
            <Calendar size={12} />
            <DateFormat
              value={data.orderedDate}
              formatStr="dd MMM yyyy, hh:mm a"
            />
          </div>
        </div>
        <div className="tw:shrink-0">
          {data.status === "Invoiced" && (
            <AppButton
              size="small"
              color="dark"
              onClick={() => callback?.({ action: "assign", data })}
            >
              <Send size={14} />
              {t("assignForDelivery")}
            </AppButton>
          )}
          {data.status === "Pending Shipment" &&
            !data.invoices?.[0]?.shippingDetails?.isApproved && (
              <AppButton
                size="small"
                fill="outline"
                onClick={() => callback?.({ action: "verify-otp", data })}
              >
                <Key size={14} />
                {t("verifyOtp")}
              </AppButton>
            )}
        </div>
      </div>
      <Divider className="tw:my-0!" />

      {/* Body */}
      <div className="tw:px-3 tw:py-2 tw:space-y-2">
        {/* Customer / Retailer */}
        <KeyValue
          label={t(data.orderType === "B2C" ? "customer" : "retailer")}
          size="sm"
        >
          {data._customerLink ? (
            <AppLink
              href={data._customerLink}
              asLink
              showLinkColor
              className="tw:font-medium tw:text-sm"
            >
              {data.customerInfo?.name}
            </AppLink>
          ) : (
            <span className="tw:font-medium tw:text-sm">
              {data.customerInfo?.name}
            </span>
          )}
        </KeyValue>

        {/* Assigned delivery person */}
        {(data?.invoices?.[0]?.shippingDetails?.name ||
          data?.invoices?.[0]?.shippingDetails?.contact) && (
          <div className="tw:grid tw:grid-cols-2 tw:gap-x-3">
            <KeyValue
              label={t("assignedTo")}
              size="sm"
              valueClassName="tw:font-medium tw:text-sm"
            >
              {data?.invoices?.[0]?.shippingDetails?.name || "--"}
            </KeyValue>
            <KeyValue
              label={t("contact")}
              size="sm"
              valueClassName="tw:font-medium tw:text-sm"
            >
              {data?.invoices?.[0]?.shippingDetails?.contact || "--"}
            </KeyValue>
          </div>
        )}

        {/* Route info + Shipped on */}
        {(data?.routeInfo || shippedDate) && (
          <div className="tw:grid tw:grid-cols-2 tw:gap-x-3 tw:pt-1.5 tw:border-t tw:border-gray-100">
            {data?.routeInfo && (
              <KeyValue
                label={t("route")}
                size="sm"
                valueClassName="tw:font-medium tw:text-sm"
              >
                {data.routeInfo?.description ||
                  data.routeInfo?.routeCode ||
                  "-"}
                {data.routeInfo?.deliveryDate && (
                  <div className="tw:text-xs tw:text-gray-500">
                    <DateFormat
                      value={data.routeInfo.deliveryDate}
                      formatStr="dd MMM yyyy"
                    />
                  </div>
                )}
              </KeyValue>
            )}
            {shippedDate && (
              <KeyValue
                label={t("shippedOn")}
                size="sm"
                valueClassName="tw:font-medium tw:text-sm"
              >
                <DateFormat value={shippedDate} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={shippedDate} formatStr="hh:mm a" />
                </div>
              </KeyValue>
            )}
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default Item;
