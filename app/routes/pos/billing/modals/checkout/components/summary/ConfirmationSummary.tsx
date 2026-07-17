import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
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
      <div className="wa-incart tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border tw:border-transparent tw:rounded-xl tw:px-3 tw:py-2">
        <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
          {customer && (customer.name || customer.mobile) ? (
            <>
              {customer.name && (
                <span className="tw:text-sm tw:font-semibold tw:truncate">
                  {customer.name}
                </span>
              )}
              {customer.mobile && (
                <span className="wa-mono tw:flex tw:items-center tw:gap-1 tw:text-xs">
                  <Phone className="tw:w-3.5 tw:h-3.5" />
                  {customer.mobile}
                </span>
              )}
            </>
          ) : (
            <span className="tw:text-sm">Walk-in</span>
          )}
        </div>
        <div className="tw:text-right">
          <div className="wa-section-label tw:text-[10px]" style={{ color: "var(--wa-bubble-text)" }}>
            To Pay
          </div>
          <div className="wa-amount tw:text-base tw:font-bold tw:leading-tight">
            <Amount value={computedFinalPrice} />
          </div>
        </div>
      </div>

      {/* Bill breakdown */}
      <div className="tw:border tw:border-border tw:rounded-xl tw:divide-y tw:divide-border tw:overflow-hidden">
        <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm">
          <span className="tw:text-muted-foreground">
            {t("checkoutModal.summary.subtotal")}{" "}
            <span className="wa-mono tw:text-muted-foreground">· {totalDeals} deals</span>
          </span>
          <span className="wa-mono tw:text-foreground">
            <Amount value={summary?.subtotal || 0} />
          </span>
        </div>

        {summary?.couponDiscount && summary?.couponDiscount > 0 ? (
          <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm">
            <span className="tw:text-muted-foreground">
              {t("checkoutModal.summary.couponDiscount")}
            </span>
            <span className="wa-mono tw:text-destructive">
              -<Amount value={summary?.couponDiscount} />
            </span>
          </div>
        ) : null}

        {coinsDiscountValue && coinsDiscountValue > 0 ? (
          <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm">
            <span className="tw:text-muted-foreground">
              {t("checkoutModal.summary.coinsDiscount")}
            </span>
            <span className="wa-mono tw:text-destructive">
              -<Amount value={coinsDiscountValue} />
            </span>
          </div>
        ) : null}

        {summary?.totalDiscount && summary?.totalDiscount > 0 ? (
          <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm">
            <span className="tw:text-muted-foreground">
              {t("checkoutModal.summary.totalDiscount")}
            </span>
            <span className="wa-mono tw:text-destructive">
              -<Amount value={summary?.totalDiscount} />
            </span>
          </div>
        ) : null}

        {discount && discount > 0 ? (
          <div
            className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm tw:font-semibold"
            style={{ color: "var(--wa-bubble-text)" }}
          >
            <span>
              {t("checkoutModal.summary.cartDiscount", "Cart Discount")}
            </span>
            <span className="wa-mono">
              -<Amount value={discount} />
            </span>
          </div>
        ) : null}

        {hasDecimal && roundOffOrderAmount ? (
          <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:text-sm">
            <span className="tw:text-muted-foreground">
              {t("checkoutModal.summary.roundOff", "Round off")}
            </span>
            <span className="wa-mono tw:text-foreground">
              {Math.round(rawFinalPrice) - rawFinalPrice >= 0 ? "+" : "−"}
              <Amount
                value={Math.abs(Math.round(rawFinalPrice) - rawFinalPrice)}
                decimalPlaces={2}
              />
            </span>
          </div>
        ) : null}

        <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:py-2 tw:bg-muted/60">
          <span className="tw:text-sm tw:font-semibold tw:text-foreground">
            {t("checkoutModal.summary.total")}
          </span>
          <span className="wa-amount tw:font-bold tw:text-foreground">
            <Amount value={computedFinalPrice} />
          </span>
        </div>
      </div>

      {/* Payment methods pill row */}
      {!assisted && paymentLabels && (
        <div className="tw:flex tw:items-center tw:justify-between tw:bg-muted/60 tw:border tw:border-border tw:rounded-xl tw:px-3 tw:py-2">
          <span className="wa-section-label">
            {t("checkoutModal.summary.payment")}
          </span>
          <div className="tw:flex tw:gap-1.5">
            {(selectedPaymentMethods || []).map((m: any) => (
              <span
                key={m.value}
                className="wa-mono tw:text-[11px] tw:font-medium tw:uppercase tw:bg-card tw:border tw:border-border tw:rounded-full tw:px-2 tw:py-0.5 tw:text-foreground"
              >
                {m.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Change to return */}
      {!assisted && changeAmount > 0 ? (
        <div className="tw:flex tw:items-center tw:justify-between tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-xl tw:px-3 tw:py-2">
          <span className="tw:text-xs tw:text-amber-700 tw:uppercase tw:tracking-wide tw:font-medium">
            {t("checkoutModal.summary.changeToReturn", "Change to return")}
          </span>
          <span className="wa-mono tw:text-sm tw:font-bold tw:text-amber-700">
            <Amount value={changeAmount} />
          </span>
        </div>
      ) : null}

      {/* Actions */}
      <div className="tw:flex tw:gap-2 tw:pt-2">
        <AppButton
          size="large"
          fill="outline"
          color="light"
          className="tw:flex-1"
          onClick={handleBack}
        >
          {t("checkoutModal.summary.actions.back")}
        </AppButton>

        <button
          type="button"
          onClick={handlePay}
          disabled={isSubmitting}
          className="wa-cta tw:flex-1 tw:flex tw:items-center tw:justify-center tw:gap-2 tw:h-11 tw:rounded-xl tw:text-sm tw:font-bold tw:cursor-pointer tw:transition-all tw:disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <AppSpinner size="xs" />
          ) : (
            <Check className="tw:w-5 tw:h-5" />
          )}
          {assisted ? (
            "Send OTP"
          ) : (
            <>
              {t("checkoutModal.summary.actions.pay")}{" "}
              <Amount value={computedFinalPrice} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationSummary;
