import { TicketPercent, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import AppPopover from "~/components/core/popover/AppPopover";

interface Props {
  order: any;
}

/**
 * Popover body explaining the cart discount: amount + who applied it.
 * Reuses the order's `createdBy` details as the discount author.
 */
const CartDiscountDetails = ({ order }: Props) => {
  const { t } = useTranslation(["common"]);
  const createdBy = order?.createdBy;

  return (
    <div className="tw:w-56 tw:flex tw:flex-col tw:gap-2">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
        <span className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
          {t("cartDiscount", "Cart Discount")}
        </span>
        <span className="tw:text-sm tw:font-bold tw:text-green-600">
          - <Amount value={order?.discount || 0} decimalPlaces={2} />
        </span>
      </div>

      {createdBy?.name ? (
        <div className="tw:border-t tw:border-gray-100 tw:pt-2 tw:flex tw:flex-col tw:gap-1">
          <span className="tw:text-[11px] tw:text-gray-500">
            {t("appliedBy", "Applied by")}
          </span>
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
            <User size={13} className="tw:text-gray-500 tw:shrink-0" />
            {createdBy.redirect ? (
              <AppLink
                href={createdBy.redirect.path}
                className="tw:font-medium tw:text-sm"
                asLink={true}
              >
                {createdBy.name}
              </AppLink>
            ) : (
              <span className="tw:font-medium tw:text-sm tw:text-gray-800">
                {createdBy.name}
              </span>
            )}
            {createdBy.userType ? (
              <AppBadge variant="light">{createdBy.userType}</AppBadge>
            ) : null}
          </div>
          {order?.createdAt ? (
            <span className="tw:text-[11px] tw:text-gray-400">
              <DateFormat value={order.createdAt} />
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

/**
 * Compact green pill shown at the top of the order view (badge row).
 * Tapping/clicking reveals the cart-discount details popover.
 */
export const CartDiscountBadge = ({ order }: Props) => {
  const { t } = useTranslation(["common"]);

  const cartDiscount = order?.cartDiscount || 0;

  if (!(cartDiscount > 0)) return null;

  return (
    <AppPopover
      side="bottom"
      align="start"
      triggerContent={
        <button
          type="button"
          className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:border-green-200 tw:bg-green-50 tw:px-2.5 tw:py-1 tw:text-green-700 tw:transition-colors hover:tw:bg-green-100 focus:tw:outline-none"
        >
          <TicketPercent size={14} className="tw:shrink-0" />
          <span className="tw:text-xs tw:font-semibold tw:whitespace-nowrap">
            {t("cartDiscount", "Cart Discount")}
          </span>
          <span className="tw:text-xs tw:font-bold tw:tabular-nums">
            - <Amount value={cartDiscount} decimalPlaces={2} />
          </span>
        </button>
      }
    >
      <CartDiscountDetails order={order} />
    </AppPopover>
  );
};

export default CartDiscountDetails;
