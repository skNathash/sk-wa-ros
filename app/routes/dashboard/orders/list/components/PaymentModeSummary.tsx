import clsx from "clsx";
import AppCard from "~/components/core/card/AppCard";
import { useTranslation } from "react-i18next";

const PaymentModeSummary = () => {
  const { t } = useTranslation(["common"]);

  const paymentModes = [
    {
      label: t("cash"),
      value: "cash",
      color: "tw:bg-green-50",
      dotColor: "tw:bg-green-500",
    },
    {
      label: t("card"),
      value: "card",
      color: "tw:bg-blue-50",
      dotColor: "tw:bg-blue-500",
    },
    {
      label: t("upi"),
      value: "upi",
      color: "tw:bg-yellow-50",
      dotColor: "tw:bg-yellow-500",
    },
    {
      label: t("credits"),
      value: "credits",
      color: "tw:bg-red-50",
      dotColor: "tw:bg-red-500",
    },
  ];

  return (
    <AppCard title={t("paymentModeSummary")} icon="credit-card">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4">
        {paymentModes.map((mode) => (
          <div
            className={clsx(
              "tw:flex tw:justify-between tw:mb-2 tw:py-2 tw:px-4 tw:rounded-lg",
              mode.color
            )}
          >
            <div className="tw:flex tw:items-center">
              <div
                className={`tw:w-3 tw:h-3 tw:rounded-full tw:mr-2 ${mode.dotColor}`}
              ></div>
              <div className="tw:text-sm tw:font-medium">{mode.label}</div>
            </div>
            <div className="tw:text-end">
              <div className="tw:text-sm tw:font-semibold">100</div>
              <div className="tw:text-xs tw:text-gray-500">100%</div>
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  );
};

export default PaymentModeSummary;
