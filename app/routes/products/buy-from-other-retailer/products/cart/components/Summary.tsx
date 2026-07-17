import { useTranslation } from "react-i18next";
import { IndianRupee } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";

const Summary = ({
  totalMRP,
  subTotal,
  totalDiscount,
  totalAmountBeforeTax,
  savings,
  totalCouponDiscount = 0,
  totalItemsLabel,
  totalSellers,
}: {
  totalMRP: number;
  subTotal: number;
  totalDiscount: number;
  totalAmountBeforeTax: number;
  savings: number;
  totalCouponDiscount?: number;
  totalItemsLabel?: string;
  totalSellers?: number;
}) => {
  const { t } = useTranslation();

  const payable = Math.max(subTotal - totalCouponDiscount, 0);

  return (
    <AppCard>
      <div className="tw:mb-3 tw:flex tw:items-center tw:gap-2 tw:pb-2 tw:border-b tw:border-gray-200">
        <IndianRupee size={18} className="tw:text-gray-700" />
        <h3 className="tw:text-base tw:font-semibold tw:text-gray-900">
          Summary
        </h3>
      </div>

      <div className="tw:space-y-2.5">
        {totalSellers !== undefined && (
          <div className="tw:flex tw:flex-row tw:justify-between tw:items-center">
            <div className="tw:text-sm tw:text-gray-600">Sellers</div>
            <div className="tw:text-sm tw:font-medium tw:text-gray-900">
              {totalSellers}
            </div>
          </div>
        )}
        {totalItemsLabel && (
          <div className="tw:flex tw:flex-row tw:justify-between tw:items-center">
            <div className="tw:text-sm tw:text-gray-600">Quantity</div>
            <div className="tw:text-sm tw:font-medium tw:text-gray-900">
              {totalItemsLabel}
            </div>
          </div>
        )}
        {savings > 0 && (
          <div className="tw:flex tw:flex-row tw:justify-between tw:items-center">
            <div className="tw:text-sm tw:text-gray-600">{t("totalMRP")}</div>
            <div>
              <Amount
                value={totalMRP}
                decimalPlaces={2}
                className="tw:font-medium tw:text-gray-900"
              />
            </div>
          </div>
        )}

        {savings > 0 && (
          <div className="tw:flex tw:flex-row tw:justify-between tw:items-center tw:bg-green-50 tw:px-2 tw:py-1.5 tw:rounded">
            <div className="tw:text-sm tw:text-green-700 tw:font-medium">
              {t("retailerMargin")}
            </div>
            <div className="tw:text-sm tw:text-green-700 tw:font-semibold">
              <Amount value={savings} decimalPlaces={2} />
            </div>
          </div>
        )}

        {totalCouponDiscount > 0 && (
          <div className="tw:flex tw:flex-row tw:justify-between tw:items-center">
            <div className="tw:text-sm tw:text-green-700 tw:font-medium">
              Coupon discount
            </div>
            <div className="tw:text-sm tw:text-green-700 tw:font-semibold">
              −<Amount value={totalCouponDiscount} decimalPlaces={2} />
            </div>
          </div>
        )}

        <div className="tw:flex tw:flex-row tw:justify-between tw:items-center tw:border-t tw:border-gray-200 tw:border-dashed tw:pt-3 tw:mt-3">
          <div className="tw:text-base tw:font-semibold tw:text-gray-900">
            {t("totalAmount")}
          </div>
          <div className="tw:text-right">
            <div className="tw:text-lg tw:font-bold tw:text-primary">
              <Amount value={payable} decimalPlaces={2} />
            </div>
            <span className="tw:text-[10px] tw:text-gray-500 tw:block tw:text-right">
              (incl. GST)
            </span>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default Summary;
