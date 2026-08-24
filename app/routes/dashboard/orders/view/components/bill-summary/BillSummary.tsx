import { Info, ShoppingCart, TicketPercent } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppPopover from "~/components/core/popover/AppPopover";
import OmsService from "~/services/OmsService";
import RefundSettlementViewModal from "~/shared/orders/refund-settlement/RefundSettlementViewModal";
import CartDiscountDetails from "../cart-discount/CartDiscountInfo";

interface Props {
  order: any;
}

const BillSummary = ({ order }: Props) => {
  const { t } = useTranslation(["common"]);
  const summary = OmsService.prepareOrderSummary(order);
  const [activeSettlementId, setActiveSettlementId] = useState<
    string | number | null
  >(null);
  const settlements: Array<{
    refundSettlementId?: string;
    status?: string;
    amount?: number;
    remarks?: string;
  }> = order?.refundSettlements || [];
  const canViewRefundSettlement =
    order?.orderType === "B2C" && settlements.length > 0;

  // `discountInfo` is split into coupon vs cart discount in OmsService.
  const couponDiscount = order?.couponAppliedValue || 0;
  const couponCode = order?.couponAppliedCode || "";
  const cartDiscount = order?.cartDiscount || 0;

  const statusStyle = (status?: string) => {
    if (status === "Paid" || status === "Completed")
      return "tw:bg-green-100 tw:text-green-700";
    if (status === "Pending") return "tw:bg-amber-100 tw:text-amber-700";
    if (status === "Failed" || status === "Rejected")
      return "tw:bg-red-100 tw:text-red-700";
    return "tw:bg-gray-100 tw:text-gray-700";
  };

  return (
    <AppCard title={t("billSummary")} icon={<ShoppingCart />}>
      <KeyValue
        label={t("totalMRP")}
        horizontal={true}
        className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-2"
        size="sm"
      >
        <Amount value={summary._totalMrp} decimalPlaces={2} />
      </KeyValue>

      <KeyValue
        label={t("subTotal")}
        horizontal={true}
        className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-2"
        size="sm"
      >
        <Amount value={summary._totalPrice} decimalPlaces={2} />
      </KeyValue>

      {summary._itemSavings > 0 ? (
        <KeyValue
          label={t("savings")}
          horizontal={true}
          className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-2 tw:text-green-500"
          size="sm"
        >
          - <Amount value={summary._itemSavings} decimalPlaces={2} />
        </KeyValue>
      ) : null}

      {cartDiscount > 0 ? (
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-2 tw:-mx-1 tw:px-2 tw:py-1.5 tw:rounded-md tw:bg-green-50 tw:border tw:border-green-200">
          <div className="tw:flex tw:items-center tw:gap-1.5">
            <TicketPercent
              size={15}
              className="tw:text-green-600 tw:shrink-0"
            />
            <span className="tw:text-sm tw:font-semibold tw:text-green-700">
              {t("cartDiscount", "Cart Discount")}
            </span>
            <AppPopover
              triggerContent={
                <button
                  type="button"
                  className="tw:inline-flex tw:items-center tw:text-green-600 hover:tw:text-green-700 focus:tw:outline-none"
                >
                  <Info size={14} />
                </button>
              }
            >
              <CartDiscountDetails order={order} />
            </AppPopover>
          </div>
          <span className="tw:text-sm tw:font-bold tw:text-green-700">
            - <Amount value={cartDiscount} decimalPlaces={2} />
          </span>
        </div>
      ) : null}

      {couponDiscount > 0 ? (
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-2 tw:-mx-1 tw:px-2 tw:py-1.5 tw:rounded-md tw:bg-green-50 tw:border tw:border-green-200">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
            <TicketPercent
              size={15}
              className="tw:text-green-600 tw:shrink-0"
            />
            <span className="tw:text-sm tw:font-semibold tw:text-green-700">
              {t("couponDiscount", "Coupon Discount")}
            </span>
            {couponCode ? (
              <span className="tw:text-[11px] tw:font-semibold tw:text-green-700 tw:bg-white tw:border tw:border-green-300 tw:rounded tw:px-1.5 tw:py-0.5 tw:truncate">
                {couponCode}
              </span>
            ) : null}
          </div>
          <span className="tw:text-sm tw:font-bold tw:text-green-700">
            - <Amount value={couponDiscount} decimalPlaces={2} />
          </span>
        </div>
      ) : null}

      {summary.coinsRedeemedValue > 0 ? (
        <KeyValue
          label={
            <div className="tw:flex tw:items-center tw:gap-2">
              <ImgRender src="kingcoins/logo.png" className="tw:h-4" />{" "}
              {t("redeemed")}
            </div>
          }
          horizontal={true}
          className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-2 tw:text-green-500"
          size="sm"
        >
          - <Amount value={summary.coinsRedeemedValue} decimalPlaces={2} />
        </KeyValue>
      ) : null}

      <KeyValue
        label={t("shippingCharges")}
        horizontal={true}
        className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-2 tw:text-red-500"
        size="sm"
      >
        {summary._shippingCharges > 0 ? (
          <>
            + <Amount value={summary._shippingCharges} />
          </>
        ) : (
          t("free")
        )}
      </KeyValue>
      {order.refundedAmount > 0 ? (
        <>
          <div className="tw:h-px tw:bg-gray-200 tw:my-2" />
          <div className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded tw:px-3 tw:py-2 tw:mb-2">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
              <span className="tw:text-sm tw:font-semibold tw:text-red-600">
                Refunded Amount
              </span>
              <span className="tw:font-bold tw:text-red-600">
                <Amount value={order.refundedAmount} decimalPlaces={2} />
              </span>
            </div>
            {canViewRefundSettlement ? (
              <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-1 tw:max-h-32 tw:overflow-auto">
                {settlements.map((s, idx) => {
                  const isPending = s.status === "Pending";
                  return (
                    <button
                      type="button"
                      key={String(s.refundSettlementId ?? idx)}
                      disabled={isPending}
                      onClick={() =>
                        !isPending &&
                        s.refundSettlementId &&
                        setActiveSettlementId(s.refundSettlementId)
                      }
                      className="tw:flex tw:flex-col tw:gap-1 tw:bg-white tw:border tw:border-red-200 tw:rounded tw:px-2 tw:py-1.5 tw:text-left hover:tw:bg-red-100 disabled:tw:cursor-default disabled:hover:tw:bg-white"
                    >
                      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                        <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
                          <span className="tw:text-[11px] tw:font-semibold tw:text-gray-500">
                            #{idx + 1}
                          </span>
                          <span className="tw:text-sm tw:font-semibold tw:text-red-600">
                            <Amount value={s.amount || 0} decimalPlaces={2} />
                          </span>
                          <span
                            className={`tw:text-[10px] tw:font-semibold tw:px-1.5 tw:py-0.5 tw:rounded ${statusStyle(s.status)}`}
                          >
                            {s.status || "—"}
                          </span>
                        </div>
                        {!isPending ? (
                          <span className="tw:text-xs tw:font-semibold tw:text-red-600">
                            View →
                          </span>
                        ) : null}
                      </div>
                      {s.remarks ? (
                        <p className="tw:text-xs tw:text-gray-500 tw:m-0">
                          {s.remarks}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="tw:mt-3 tw:rounded-lg tw:bg-primary/5 tw:border tw:border-primary/10 tw:px-3 tw:py-2.5 tw:flex tw:items-center tw:justify-between tw:gap-4">
        <span className="app-label tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-600">
          {t("totalAmount")}
        </span>
        <div className="tw:flex tw:items-center tw:gap-2">
          <Amount
            value={summary._payableAmt}
            decimalPlaces={2}
            className="tw:font-bold tw:text-[17px] tw:text-green-600 tw:tabular-nums"
          />
          {order._hasRoundDifference && (
            <AppPopover triggerContent={<Info size={16} />}>
              <KeyValue label="Actual Amount" size="sm" className="tw:mb-2">
                <Amount
                  value={summary.actualOrderAmount}
                  className="tw:font-semibold tw:text-red-500"
                  decimalPlaces={2}
                />
              </KeyValue>
              <KeyValue label="Rounded Amount" size="sm">
                <Amount
                  value={order._payableAmt}
                  className="tw:font-semibold tw:text-green-500"
                  decimalPlaces={2}
                />
              </KeyValue>
            </AppPopover>
          )}
        </div>
      </div>

      {activeSettlementId ? (
        <RefundSettlementViewModal
          show={!!activeSettlementId}
          refundSettlementId={activeSettlementId}
          callback={() => setActiveSettlementId(null)}
        />
      ) : null}
    </AppCard>
  );
};

export default BillSummary;
