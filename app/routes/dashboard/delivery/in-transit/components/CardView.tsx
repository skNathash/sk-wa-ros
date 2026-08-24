import {
  CalendarClock,
  CheckCircle,
  FileText,
  MapPin,
  Truck,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import useAppNav from "~/hooks/useAppNav";
import DeliveryCardGrid from "~/shared/delivery/components/delivery-card-grid/DeliveryCardGrid";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";

interface CardViewProps {
  data: any[];
  loading: boolean;
  callback?: (args: { action: string; data?: any }) => void;
}

/**
 * Theme-2 in-transit list — the same card on phone and desktop, laid out one up
 * and three up by {@link DeliveryCardGrid}. Each card carries the shipment as
 * it stands on the road: who it is for, what it is worth, who is carrying it on
 * what vehicle, and the invoice / route / shipped-on trail behind it. Self-ship
 * shipments close out from the card itself.
 */
const CardView = ({ data, loading, callback }: CardViewProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  return (
    <DeliveryCardGrid loading={loading} empty={!data || data.length === 0}>
      {data.map((item) => {
        const invoice = item?.invoices?.[0];
        const shipping = invoice?.shippingDetails;
        const shippedDate = item?.shippedOn || shipping?.shippedOn;
        const name = item.customerInfo?.name || "-";
        const mobile = item.customerInfo?.mobile || "";
        const routeLabel =
          item.routeInfo?.description || item.routeInfo?.routeCode || "";
        const vehicleNo = shipping?.vehicleInfo?.vehicleNo || "";

        const canMarkDelivered =
          item.status === "Shipped" && shipping?.shipmentType === "selfship";

        return (
          <div
            key={item._id}
            role="button"
            tabIndex={0}
            className="tw:flex tw:cursor-pointer tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:text-left tw:transition-shadow tw:hover:shadow-md tw:active:bg-slate-50"
            onClick={() => appNav.to(`/dashboard/orders/view/${item.orderId}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                appNav.to(`/dashboard/orders/view/${item.orderId}`);
              }
            }}
          >
            {/* Head — who it is for, and what it is worth. */}
            <div className="tw:flex tw:items-start tw:gap-3 tw:p-3.5">
              <InitialsAvatar name={name} />

              <div className="tw:min-w-0 tw:flex-1">
                <p className="tw:text-sm tw:font-bold tw:text-slate-900 tw:wrap-break-word">
                  {item.orderRefNo}
                </p>
                <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-500">
                  {name}
                  {mobile ? ` · ${mobile}` : ""}
                </p>
              </div>

              <div className="tw:shrink-0 tw:text-right">
                <span
                  className="tw:inline-block tw:rounded-full tw:px-2 tw:py-0.5 tw:text-xs tw:font-bold tw:whitespace-nowrap tw:tabular-nums"
                  style={{
                    backgroundColor: "var(--wa-bubble)",
                    color: "var(--wa-bubble-text)",
                  }}
                >
                  <Amount
                    value={
                      item.isKcStore
                        ? item.coinsRedeemedValue
                        : item._payableAmt
                    }
                  />
                </span>
                <span className="tw:mt-1 tw:block tw:whitespace-nowrap tw:text-[11px] tw:text-slate-400">
                  <DateFormat
                    value={item.orderedDate}
                    formatStr="dd MMM, hh:mm a"
                  />
                </span>
              </div>
            </div>

            {/* Status strip — where the shipment stands right now. */}
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:border-t tw:border-slate-100 tw:px-3.5 tw:py-2">
              <AppBadge
                variant={item._statusColor || "default"}
                className="tw:px-1.5 tw:py-0 tw:text-[10px]"
              >
                {item._statusLbl || item.status}
              </AppBadge>
              <AppBadge
                variant={item._typeColor || "default"}
                className="tw:px-1.5 tw:py-0 tw:text-[10px]"
              >
                {item.orderType}
              </AppBadge>
            </div>

            {/* Facts — one icon-led line each, labelled so a value like a
                bare number or code says what it is on its own. */}
            <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-1.5 tw:bg-slate-50/70 tw:px-3.5 tw:py-2.5 tw:text-xs">
              <div className="tw:flex tw:items-start tw:gap-2">
                <User
                  size={13}
                  className="tw:mt-0.5 tw:shrink-0 tw:text-slate-400"
                />
                <span className="tw:shrink-0 tw:text-slate-500">
                  Delivery by:
                </span>
                <span className="tw:line-clamp-2 tw:font-medium tw:text-slate-700">
                  {shipping?.name || "--"}
                  {shipping?.contact ? ` · ${shipping.contact}` : ""}
                </span>
              </div>

              {vehicleNo && (
                <div className="tw:flex tw:items-start tw:gap-2">
                  <Truck
                    size={13}
                    className="tw:mt-0.5 tw:shrink-0 tw:text-slate-400"
                  />
                  <span className="tw:shrink-0 tw:text-slate-500">
                    Vehicle:
                  </span>
                  <span className="tw:line-clamp-2 tw:text-slate-600">
                    {vehicleNo}
                  </span>
                </div>
              )}

              <div className="tw:flex tw:items-start tw:gap-2">
                <MapPin
                  size={13}
                  className="tw:mt-0.5 tw:shrink-0 tw:text-slate-400"
                />
                <span className="tw:shrink-0 tw:text-slate-500">Route:</span>
                <span className="tw:line-clamp-2 tw:text-slate-600">
                  {routeLabel || "--"}
                  {item.routeInfo?.deliveryDate && (
                    <>
                      {" · "}
                      <DateFormat
                        value={item.routeInfo.deliveryDate}
                        formatStr="dd MMM yyyy"
                      />
                    </>
                  )}
                </span>
              </div>

              {invoice?.invoiceNumber && (
                <div className="tw:flex tw:items-start tw:gap-2">
                  <FileText
                    size={13}
                    className="tw:mt-0.5 tw:shrink-0 tw:text-slate-400"
                  />
                  <span className="tw:shrink-0 tw:text-slate-500">
                    Invoice:
                  </span>
                  <span className="tw:line-clamp-2 tw:text-slate-600">
                    {invoice.invoiceNumber}
                  </span>
                </div>
              )}

              {shippedDate && (
                <div className="tw:flex tw:items-start tw:gap-2">
                  <CalendarClock
                    size={13}
                    className="tw:mt-0.5 tw:shrink-0 tw:text-slate-400"
                  />
                  <span className="tw:shrink-0 tw:text-slate-500">
                    {t("shippedOn")}:
                  </span>
                  <span className="tw:line-clamp-2 tw:text-slate-600">
                    <DateFormat
                      value={shippedDate}
                      formatStr="dd MMM, hh:mm a"
                    />
                  </span>
                </div>
              )}
            </div>

            {/* The move this page exists to make. */}
            {canMarkDelivered && (
              <div
                className="tw:border-t tw:border-slate-100 tw:p-3"
                onClick={(event) => event.stopPropagation()}
              >
                <AppButton
                  size="small"
                  className="tw:w-full"
                  onClick={() =>
                    callback?.({ action: "mark-delivered", data: item })
                  }
                >
                  <CheckCircle size={14} />
                  {t("markAsDelivered")}
                </AppButton>
              </div>
            )}
          </div>
        );
      })}
    </DeliveryCardGrid>
  );
};

export default CardView;
