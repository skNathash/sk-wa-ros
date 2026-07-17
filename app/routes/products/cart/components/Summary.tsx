import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";

const Summary = ({
  totalMRP,
  subTotal,
  totalDiscount,
  totalAmountBeforeTax,
  savings,
}: {
  totalMRP: number;
  subTotal: number;
  totalDiscount: number;
  totalAmountBeforeTax: number;
  savings: number;
}) => {
  const { t } = useTranslation();

  return (
    <AppCard>
      <div className="tw:flex tw:flex-row tw:justify-between tw:items-center tw:mb-2">
        <div>{t("totalMRP")}</div>
        <div>
          <Amount value={totalMRP} decimalPlaces={2} />
        </div>
      </div>
      {savings > 0 && (
        <div className="tw:flex tw:flex-row tw:justify-between tw:items-center tw:mb-2">
          <div className="tw:text-green-600">{t("retailerMargin")}</div>
          <div className="tw:text-green-600">
            <Amount value={savings} decimalPlaces={2} />{" "}
            <span className="tw:text-xs tw:text-gray-500 tw:ml-1">
              ({totalDiscount}%)
            </span>
          </div>
        </div>
      )}
      <div className="tw:flex tw:flex-row tw:justify-between tw:font-semibold tw:items-center tw:mb-2 tw:border-t tw:border-gray-200 tw:border-dashed tw:pt-2">
        <div>{t("totalAmount")}</div>
        <div>
          <Amount value={subTotal} decimalPlaces={2} />
          <span className="tw:text-xs tw:text-gray-500 tw:ml-1">
            (incl. GST)
          </span>
        </div>
      </div>
      <div className="tw:flex tw:flex-row tw:justify-between tw:items-center tw:mb-2 tw:text-xs tw:text-gray-500">
        <div>{t("beforeTax")}</div>
        <div>
          <Amount value={totalAmountBeforeTax} decimalPlaces={2} />
        </div>
      </div>
    </AppCard>
  );
};

export default Summary;
