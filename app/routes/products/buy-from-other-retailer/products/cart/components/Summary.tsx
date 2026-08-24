import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";

const Summary = ({
  totalMRP,
  subTotal,
  totalAmountBeforeTax,
  savings,
  totalCouponDiscount = 0,
  totalItemsLabel,
  totalSellers,
  action,
}: {
  totalMRP: number;
  subTotal: number;
  totalDiscount: number;
  totalAmountBeforeTax: number;
  savings: number;
  totalCouponDiscount?: number;
  totalItemsLabel?: string;
  totalSellers?: number;
  /** Primary action (e.g. checkout) rendered inside the card, under the total. */
  action?: ReactNode;
}) => {
  const { t } = useTranslation();

  const payable = Math.max(subTotal - totalCouponDiscount, 0);
  const totalSaved = Math.max(savings, 0) + Math.max(totalCouponDiscount, 0);

  // Traditional bill ladder: everything is a plain label/value row so the
  // figures line up in one column and the arithmetic reads top to bottom.
  const scope = [
    totalItemsLabel,
    totalSellers
      ? `${totalSellers} ${totalSellers === 1 ? "seller" : "sellers"}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    // The page renders the "Order summary" eyebrow above this card in every
    // viewport, so the card opens straight into the figures.
    <AppCard className="app-thread">
      <div className="tw:divide-y tw:divide-dashed tw:divide-gray-200">
        {scope ? (
          <div className="tw:pb-2 tw:text-xs tw:text-gray-500">{scope}</div>
        ) : null}

        <div className="tw:space-y-2.5 tw:py-3">
          <Row label={`${t("totalMRP")}${scope ? ` (${totalItemsLabel})` : ""}`}>
            <Amount
              value={totalMRP}
              decimalPlaces={2}
              className="tw:text-gray-900"
            />
          </Row>

          {savings > 0 && (
            <Row label={t("retailerMargin")}>
              <span className="tw:text-green-600">
                −<Amount value={savings} decimalPlaces={2} />
              </span>
            </Row>
          )}

          {totalCouponDiscount > 0 && (
            <Row label="Coupon discount">
              <span className="tw:text-green-600">
                −<Amount value={totalCouponDiscount} decimalPlaces={2} />
              </span>
            </Row>
          )}

          <Row label="Subtotal">
            <Amount
              value={totalAmountBeforeTax}
              decimalPlaces={2}
              className="tw:text-gray-900"
            />
          </Row>

          <Row label="Delivery charges">
            <span className="tw:font-medium tw:text-green-600">Free</span>
          </Row>
        </div>

        <div className="tw:flex tw:items-baseline tw:justify-between tw:py-3">
          <div className="tw:text-base tw:font-bold tw:text-gray-900">
            {t("totalAmount")}
          </div>
          <div className="tw:text-right">
            <div className="tw:text-base tw:font-bold tw:text-gray-900">
              <Amount value={payable} decimalPlaces={2} />
            </div>
            <span className="tw:block tw:text-[10px] tw:text-gray-500">
              (incl. GST)
            </span>
          </div>
        </div>

        {totalSaved > 0 && (
          <div className="tw:py-2.5 tw:text-sm tw:font-semibold tw:text-green-600">
            You will save <Amount value={totalSaved} decimalPlaces={2} /> on this
            order
          </div>
        )}
      </div>

      {action ? <div className="tw:pt-3">{action}</div> : null}
    </AppCard>
  );
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="tw:flex tw:items-center tw:justify-between tw:text-sm">
    <span className="tw:text-gray-600">{label}</span>
    <span className="tw:tabular-nums">{children}</span>
  </div>
);

export default Summary;
