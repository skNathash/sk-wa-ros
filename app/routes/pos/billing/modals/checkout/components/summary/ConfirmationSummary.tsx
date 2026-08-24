import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import { Check, Phone } from "lucide-react";

interface ConfirmationSummaryProps {
  callback?: (args: { action: string; data?: any }) => void;
  orderData?: {
    subtotal: number;
    tax: number;
    total: number;
    deals: number;
    customer: string;
    paymentMethod: string;
  };
  summary?: {
    subtotal: number;
    couponDiscount: number;
    coinsDiscount: number;
    totalDiscount: number;
    finalPrice: number;
    orderAmount: number;
  };
  totalDeals: number;
  isSubmitting?: boolean;
  assisted?: boolean;
  discount?: number;
}

const ConfirmationSummary = ({
  callback,
  summary,
  totalDeals,
  isSubmitting = false,
  assisted,
  discount = 0,
}: ConfirmationSummaryProps) => {
  const { t } = useTranslation(["posbilling"]);
  const { control } = useFormContext();

  const [
    customer,
    redemptionValue,
    selectedPaymentMethods,
    roundOffOrderAmount,
    changeToReturn,
  ] = useWatch({
    control,
    name: [
      "customer",
      "redemptionValue",
      "selectedPaymentMethods",
      "roundOffOrderAmount",
      "changeToReturn",
    ],
  });

  const changeAmount = Number(changeToReturn || 0);

  // If the form has a redemptionValue (coins), use it as the coins discount.
  // Normalize potential string values into a number.
  const redemption = redemptionValue ? Number(redemptionValue) : 0;
  const coinsDiscountValue =
    redemption > 0 ? redemption : summary?.coinsDiscount || 0;
  // Subtract redemption and discount from the unrounded total (finalPrice) for display/pay.
  const rawFinalPrice = Math.max(
    0,
    (summary?.finalPrice ?? summary?.orderAmount ?? 0) - redemption - discount,
  );
  // Only round off when the user opts in via the checkbox.
  const hasDecimal = rawFinalPrice % 1 !== 0;
  const computedFinalPrice = roundOffOrderAmount
    ? Math.round(rawFinalPrice)
    : rawFinalPrice;

  const handleBack = () => {
    if (callback) {
      callback({ action: "back" });
    }
  };

  const handlePay = () => {
    if (isSubmitting) return;

    if (callback) {
      callback({ action: "pay", data: { total: computedFinalPrice } });
    }
  };

  const paymentLabels = (selectedPaymentMethods || [])
    .map((m: any) => m.value)
    .join(", ");

  return (
    <div className="tw:space-y-3">
      {/* Header: customer + total */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:bg-gradient-to-r tw:from-blue-50 tw:to-emerald-50 tw:border tw:border-gray-200 tw:rounded tw:px-3 tw:py-2">
        <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
          {customer && (customer.name || customer.mobile) ? (
            <>
              {customer.name && (
                <span className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
                  {customer.name}
                </span>
              )}
              {customer.mobile && (
                <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-600">
                  <Phone className="tw:w-3.5 tw:h-3.5" />
                  {customer.mobile}
                </span>
              )}
            </>
          ) : (
            <span className="tw:text-sm tw:text-gray-600">Walk-in</span>
          )}
        </div>
        <div className="tw:text-right">
          <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-500">
            To Pay
          </div>
          <div className="tw:text-base tw:font-bold tw:text-emerald-700 tw:leading-tight">
            <Amount value={computedFinalPrice} />
          </div>
        </div>
      </div>

      {/* Bill breakdown */}
      <div className="tw:border tw:border-gray-200 tw:rounded tw:divide-y tw:divide-gray-100">
        <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm">
          <span className="tw:text-gray-600">
            {t("checkoutModal.summary.subtotal")}{" "}
            <span className="tw:text-gray-400">· {totalDeals} deals</span>
          </span>
          <span className="tw:text-gray-900">
            <Amount value={summary?.subtotal || 0} />
          </span>
        </div>

        {summary?.couponDiscount && summary?.couponDiscount > 0 ? (
          <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm">
            <span className="tw:text-gray-600">
              {t("checkoutModal.summary.couponDiscount")}
            </span>
            <span className="tw:text-rose-600">
              -<Amount value={summary?.couponDiscount} />
            </span>
          </div>
        ) : null}

        {coinsDiscountValue && coinsDiscountValue > 0 ? (
          <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm">
            <span className="tw:text-gray-600">
              {t("checkoutModal.summary.coinsDiscount")}
            </span>
            <span className="tw:text-rose-600">
              -<Amount value={coinsDiscountValue} />
            </span>
          </div>
        ) : null}

        {summary?.totalDiscount && summary?.totalDiscount > 0 ? (
          <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm">
            <span className="tw:text-gray-600">
              {t("checkoutModal.summary.totalDiscount")}
            </span>
            <span className="tw:text-rose-600">
              -<Amount value={summary?.totalDiscount} />
            </span>
          </div>
        ) : null}

        {discount && discount > 0 ? (
          <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm tw:text-emerald-600 tw:font-semibold">
            <span>
              {t("checkoutModal.summary.cartDiscount", "Cart Discount")}
            </span>
            <span>
              -<Amount value={discount} />
            </span>
          </div>
        ) : null}

        {hasDecimal && roundOffOrderAmount ? (
          <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm">
            <span className="tw:text-gray-600">
              {t("checkoutModal.summary.roundOff", "Round off")}
            </span>
            <span className="tw:text-gray-700">
              {Math.round(rawFinalPrice) - rawFinalPrice >= 0 ? "+" : "−"}
              <Amount
                value={Math.abs(Math.round(rawFinalPrice) - rawFinalPrice)}
                decimalPlaces={2}
              />
            </span>
          </div>
        ) : null}

        <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:bg-gray-50">
          <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
            {t("checkoutModal.summary.total")}
          </span>
          <span className="tw:font-bold tw:text-gray-900">
            <Amount value={computedFinalPrice} />
          </span>
        </div>
      </div>

      {/* Payment methods pill row */}
      {!assisted && paymentLabels && (
        <div className="tw:flex tw:items-center tw:justify-between tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded tw:px-3 tw:py-2">
          <span className="tw:text-xs tw:text-gray-500 tw:uppercase tw:tracking-wide">
            {t("checkoutModal.summary.payment")}
          </span>
          <div className="tw:flex tw:gap-1.5">
            {(selectedPaymentMethods || []).map((m: any) => (
              <span
                key={m.value}
                className="tw:text-[11px] tw:font-medium tw:uppercase tw:bg-white tw:border tw:border-gray-200 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-gray-700"
              >
                {m.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Change to return */}
      {!assisted && changeAmount > 0 ? (
        <div className="tw:flex tw:items-center tw:justify-between tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded tw:px-3 tw:py-2">
          <span className="tw:text-xs tw:text-amber-700 tw:uppercase tw:tracking-wide tw:font-medium">
            {t("checkoutModal.summary.changeToReturn", "Change to return")}
          </span>
          <span className="tw:text-sm tw:font-bold tw:text-amber-700 tw:tabular-nums">
            <Amount value={changeAmount} />
          </span>
        </div>
      ) : null}

      {/* Actions */}
      <div className="tw:flex tw:gap-2 tw:pt-2">
        <AppButton
          size="large"
          fill="outline"
          color="dark"
          className="tw:flex-1"
          onClick={handleBack}
        >
          {t("checkoutModal.summary.actions.back")}
        </AppButton>

        <AppButton
          size="large"
          fill="solid"
          color="success"
          className="tw:flex-1 tw:flex tw:items-center tw:justify-center tw:gap-2"
          onClick={handlePay}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          <Check className="tw:w-5 tw:h-5" />
          {assisted ? (
            "Send OTP"
          ) : (
            <>
              {t("checkoutModal.summary.actions.pay")}{" "}
              <Amount value={computedFinalPrice} />
            </>
          )}
        </AppButton>
      </div>
    </div>
  );
};

export default ConfirmationSummary;
