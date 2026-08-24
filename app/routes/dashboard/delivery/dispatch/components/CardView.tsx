import {
  Key,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import useAppNav from "~/hooks/useAppNav";
import DeliveryCardGrid from "~/shared/delivery/components/delivery-card-grid/DeliveryCardGrid";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";

interface CardViewProps {
  data: any[];
  loading: boolean;
  callback?: (args: { action: string; data?: any }) => void;
}

/**
 * Theme-2 dispatch list card.
 *
 * Compact order row that matches the dispatch desk reference: a solid brand
 * avatar, order ref + customer + B2C badge on one line, location/distance/
 * items/weight metadata, an optional italic packing note, and a right-hand
 * status / amount / time column. Tapping the card body opens the order; the
 * action strip stops propagation so assign / verify-otp can work.
 */
const CardView = ({ data, loading, callback }: CardViewProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  return (
    <DeliveryCardGrid loading={loading} empty={!data || data.length === 0}>
      {data.map((item) => {
        const shipping = item?.invoices?.[0]?.shippingDetails;
        const name = item.customerInfo?.name || "-";
        const mobile = item.customerInfo?.mobile || "";
        const orderLink = `/dashboard/orders/view/${item.orderId}`;
        const isB2b = item.orderType === "B2B";
        const partyId = isB2b
          ? item.customerInfo?.franchiseId
          : item.customerInfo?.customerId;
        const partyLink = partyId
          ? `/dashboard/network/view/${isB2b ? "b2b" : "b2c"}/${partyId}`
          : "";

        const address = item.customerInfo?.address;
        const place = [
          address?.town || address?.city,
          address?.district,
          address?.state,
        ]
          .filter(Boolean)
          .join(", ");

        const distance =
          item.distanceKm ?? shipping?.distanceKm ?? item.routeInfo?.distanceKm;
        const itemCount =
          item.itemCount ??
          item.totalItems ??
          item.items?.length ??
          item.orderItems?.length;
        const weight = item.totalWeight ?? item.weight;
        const note = item.packingNote || item.orderNote || item.note;
        const amount = item.orderAmount ?? item.payableAmount ?? item.amount;

        const canAssign = item.status === "Invoiced";
        const canVerifyOtp =
          item.status === "Pending Shipment" && !shipping?.isApproved;

        const orderLabel = item.orderRefNo
          ? `${String(item.orderRefNo).startsWith("#") ? "" : "#"}${item.orderRefNo}`
          : "-";

        const metaParts = [
          place,
          distance != null ? `${Number(distance).toFixed(1)} km` : null,
          itemCount != null ? `${itemCount} items` : null,
          weight != null ? `${Number(weight).toFixed(1)} kg` : null,
        ].filter((part): part is string => Boolean(part));

        return (
          <div
            key={item._id}
            role="button"
            tabIndex={0}
            className="tw:flex tw:cursor-pointer tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:text-left tw:transition-shadow tw:hover:shadow-md tw:active:bg-slate-50"
            onClick={() => appNav.to(orderLink)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                appNav.to(orderLink);
              }
            }}
          >
            {/* Header strip — order ref on the left, status pill on the right. */}
            <div className="tw:flex tw:items-center tw:gap-2 tw:border-b tw:border-slate-100 tw:bg-slate-50/70 tw:px-3 tw:py-2">
              <AppLink
                href={orderLink}
                asLink
                noUnderline
                showLinkColor={false}
                className="tw:min-w-0 tw:flex-1 tw:text-sm tw:font-bold tw:break-all tw:text-slate-800"
                onClick={(event: any) => event.stopPropagation()}
              >
                {orderLabel}
              </AppLink>

              <span className="tw:shrink-0 tw:rounded-full tw:bg-white tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:whitespace-nowrap tw:text-slate-600 tw:ring-1 tw:ring-slate-200">
                {item._statusLbl || item.status}
              </span>
            </div>

            {/* Party block — avatar + customer + address + phone. */}
            <div className="tw:flex tw:items-start tw:gap-3 tw:p-3">
              <InitialsAvatar
                name={name}
                size={44}
                className="tw:rounded-xl tw:text-base tw:!bg-indigo-500"
              />

              <div
                className="tw:min-w-0 tw:flex-1"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="tw:flex tw:min-w-0 tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:gap-y-0.5">
                  {partyLink ? (
                    <AppLink
                      href={partyLink}
                      asLink
                      noUnderline
                      showLinkColor={false}
                      className="tw:text-sm tw:font-semibold tw:text-slate-700"
                    >
                      {name}
                    </AppLink>
                  ) : (
                    <span className="tw:text-sm tw:font-semibold tw:text-slate-700">
                      {name}
                    </span>
                  )}

                  <span className="tw:inline-flex tw:items-center tw:rounded-md tw:bg-blue-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:whitespace-nowrap tw:text-blue-700">
                    {item.orderType}
                  </span>
                </div>

                {metaParts.length > 0 && (
                  <p className="tw:mt-1 tw:text-[11px] tw:text-slate-500">
                    {metaParts.join(" · ")}
                  </p>
                )}

                {note && (
                  <p className="tw:mt-1 tw:text-[11px] tw:italic tw:text-emerald-600">
                    “{note}”
                  </p>
                )}

                {mobile && (
                  <p className="tw:mt-1 tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-slate-500">
                    <Phone size={11} className="tw:shrink-0 tw:text-slate-400" />
                    {mobile}
                  </p>
                )}
              </div>
            </div>

            {/* Amount + ordered time. */}
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-t tw:border-slate-100 tw:px-3 tw:py-2">
              {amount != null ? (
                <Amount
                  value={amount}
                  decimalPlaces={0}
                  className="tw:text-sm tw:font-bold tw:text-slate-800"
                />
              ) : (
                <span />
              )}

              <span className="tw:whitespace-nowrap tw:text-[11px] tw:text-slate-400">
                <DateFormat value={item.orderedDate} formatStr="dd MMM, h:mm a" />
              </span>
            </div>

            {/* Verified badge strip — only when a rider is already approved. */}
            {shipping?.isApproved && (
              <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:border-t tw:border-slate-100 tw:bg-slate-50/70 tw:px-3.5 tw:py-1.5">
                <AppBadge
                  variant="success"
                  className="tw:px-1.5 tw:py-0 tw:text-[10px]"
                >
                  <ShieldCheck size={11} />
                  {t("verified")}
                </AppBadge>
              </div>
            )}

            {/* Dispatch action. */}
            {(canAssign || canVerifyOtp) && (
              <div
                className="tw:border-t tw:border-slate-100 tw:p-3"
                onClick={(event) => event.stopPropagation()}
              >
                {canAssign && (
                  <AppButton
                    size="small"
                    color="dark"
                    className="tw:w-full"
                    onClick={() => callback?.({ action: "assign", data: item })}
                  >
                    <Send size={14} />
                    {t("assignForDelivery")}
                  </AppButton>
                )}
                {canVerifyOtp && (
                  <AppButton
                    size="small"
                    fill="outline"
                    className="tw:w-full"
                    onClick={() =>
                      callback?.({ action: "verify-otp", data: item })
                    }
                  >
                    <Key size={14} />
                    {t("verifyOtp")}
                  </AppButton>
                )}
              </div>
            )}
          </div>
        );
      })}
    </DeliveryCardGrid>
  );
};

export default CardView;
