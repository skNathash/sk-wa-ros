import { Calendar, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";
import InvoiceDownload from "~/shared/orders/invoice-download/InvoiceDownload";

interface ItemProps {
  item: any;
  callback: (args: { action: string; data: any }) => void;
}

const Item = ({ item, callback }: ItemProps) => {
  const { t } = useTranslation(["common"]);
  const shippedDate =
    item?.shippedOn || item?.invoices?.[0]?.shippingDetails?.shippedOn;

  const handleMarkDelivered = () => {
    callback({ action: "mark-delivered", data: item });
  };

  return (
    <AppCard noPadding className="tw:mb-0">
      {/* Header: order ID + badge left, ordered date + action right */}
      <div className="tw:flex tw:items-start tw:justify-between tw:px-3 tw:py-2.5">
        <div>
          <div className="tw:flex tw:items-center tw:gap-1.5">
            <AppLink
              href={`/dashboard/orders/view/${item.orderId}`}
              asLink
              showLinkColor
              className="tw:font-semibold tw:text-sm"
            >
              {item.orderRefNo}
            </AppLink>
            <AppBadge variant={item._typeColor}>{item.orderType}</AppBadge>
          </div>
          <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-0.5">
            <Calendar size={12} />
            <DateFormat
              value={item.orderedDate}
              formatStr="dd MMM yyyy, hh:mm a"
            />
          </div>
        </div>
        {item.status === "Shipped" &&
          item.invoices?.[0]?.shippingDetails?.shipmentType === "selfship" && (
            <AppButton
              size="small"
              onClick={handleMarkDelivered}
              className="tw:shrink-0"
            >
              <CheckCircle size={14} />
              {t("markAsDelivered")}
            </AppButton>
          )}
      </div>
      <Divider className="tw:my-0!" />

      {/* Body */}
      <div className="tw:px-3 tw:py-2 tw:space-y-2">
        {/* Customer / Retailer */}
        <KeyValue
          label={t(item.orderType === "B2C" ? "customer" : "retailer")}
          size="sm"
        >
          {item._customerLink ? (
            <AppLink
              href={item._customerLink}
              asLink
              showLinkColor
              className="tw:font-medium tw:text-sm"
            >
              {item.customerInfo?.name}
            </AppLink>
          ) : (
            <span className="tw:font-medium tw:text-sm">
              {item.customerInfo?.name}
            </span>
          )}
        </KeyValue>

        <KeyValue label={t("invoiceNumber")} size="sm">
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="tw:font-medium tw:text-sm">
              {item?.invoices?.[0]?.invoiceNumber || "--"}
            </span>
            {(item?.invoices?.[0]?.invoiceDocumentId ||
              item?.invoices?.[0]?.invoiceNumber) && (
              <InvoiceDownload
                invoiceNo={item?.invoices?.[0]?.invoiceNumber}
                invoiceDocumentId={item?.invoices?.[0]?.invoiceDocumentId}
              />
            )}
          </div>
        </KeyValue>

        {/* Assigned person + vehicle + order value */}
        <div className="tw:grid tw:grid-cols-3 tw:gap-x-3">
          <KeyValue
            label={t("assignedTo")}
            size="sm"
            valueClassName="tw:font-medium tw:text-sm"
          >
            {item?.invoices?.[0]?.shippingDetails?.name || "--"}
          </KeyValue>
          <KeyValue
            label={t("vehicle")}
            size="sm"
            valueClassName="tw:font-medium tw:text-sm"
          >
            {item?.invoices?.[0]?.shippingDetails?.vehicleInfo?.vehicleNo ||
              "--"}
          </KeyValue>
          <KeyValue
            label={item.isKcStore ? t("coinsRedeemed") : t("orderValue")}
            size="sm"
            valueClassName="tw:font-semibold tw:text-red-800 tw:text-sm"
          >
            <Amount
              value={
                item.isKcStore ? item.coinsRedeemedValue : item._payableAmt
              }
            />
          </KeyValue>
        </div>

        {/* Route info + Shipped on */}
        {(item?.routeInfo || shippedDate) && (
          <div className="tw:grid tw:grid-cols-2 tw:gap-x-3 tw:pt-1.5 tw:border-t tw:border-gray-100">
            {item?.routeInfo && (
              <KeyValue
                label={t("route")}
                size="sm"
                valueClassName="tw:font-medium tw:text-sm"
              >
                {item.routeInfo?.description ||
                  item.routeInfo?.routeCode ||
                  "-"}
                {item.routeInfo?.deliveryDate && (
                  <div className="tw:text-xs tw:text-gray-500">
                    <DateFormat
                      value={item.routeInfo.deliveryDate}
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
