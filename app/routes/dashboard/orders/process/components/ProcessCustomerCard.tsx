import AppBadge from "~/components/core/badge/AppBadge";
import WhatsAppGlyph from "~/components/core/icons/WhatsAppGlyph";
import AppLink from "~/components/core/link/AppLink";
import CommonService from "~/services/CommonService";
import DeliveryAddress from "./DeliveryAddress";
import { useTranslation } from "react-i18next";

/** Re-export: the glyph now lives with the other core icons. */
export { default as WhatsAppGlyph } from "~/components/core/icons/WhatsAppGlyph";

type Props = {
  order: any;
};

/**
 * Identity block for the process page: who the order is for, how to reach
 * them, and where it goes. Pure presentation — every field shown here was
 * already on the old header card (ref no, type, customer, view-order link,
 * delivery address block).
 */
const ProcessCustomerCard = ({ order }: Props) => {
  const { t } = useTranslation();

  const name = order?.customerInfo?.name || "N/A";
  const mobile = order?.customerInfo?.mobile;
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="op-card">
      <div className="op-card-pad">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="op-avatar">{initials}</div>
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
              <span className="tw:font-semibold tw:text-gray-900 tw:truncate">
                {name}
              </span>
              <AppBadge variant={order?._typeColor}>
                {order?.orderType}
              </AppBadge>
            </div>
            {mobile ? (
              <div className="tw:text-sm tw:text-gray-500 tw:mt-0.5">
                {mobile}
              </div>
            ) : (
              <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                {t("fulfillOrderType", { orderType: order?.orderType })}
              </div>
            )}
          </div>
          {mobile && (
            <button
              type="button"
              className="op-wa-btn"
              aria-label="Chat on WhatsApp"
              onClick={() =>
                CommonService.windowOpenHandler(
                  `https://wa.me/${String(mobile).replace(/\D/g, "")}`,
                  () => {},
                )
              }
            >
              <WhatsAppGlyph />
            </button>
          )}
        </div>

        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mt-2 tw:pt-2 tw:border-t tw:border-gray-100">
          <div className="tw:text-xs tw:text-gray-500 tw:truncate">
            {order?.orderRefNo}
          </div>
          <AppLink
            asLink
            href={`/dashboard/orders/view/${order?._id}`}
            className="tw:text-xs tw:font-semibold tw:text-primary tw:whitespace-nowrap"
          >
            {t("viewOrder")}
          </AppLink>
        </div>
      </div>

      {!order?.pickUpAtStore && (
        <div className="op-card-pad tw:border-t tw:border-gray-100 tw:pt-3!">
          <DeliveryAddress
            shippingAddress={order?.shippingAddress}
            deliveryDistance={order?.deliveryDistance}
          />
        </div>
      )}
    </div>
  );
};

export default ProcessCustomerCard;
