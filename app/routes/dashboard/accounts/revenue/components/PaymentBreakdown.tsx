import clsx from "clsx";
import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AccountService from "~/services/AccountService";

const defaultData = [
  {
    label: "Cash Sales",
    value: 0,
    color: "success",
    key: "cash",
  },
  {
    label: "Card Sales",
    value: 0,
    color: "primary",
    key: "card",
  },
  {
    label: "Cheque Sales",
    value: 0,
    color: "warning",
    key: "cheque",
  },
  {
    label: "UPI Sales",
    value: 0,
    color: "info",
    key: "upi",
  },
];

const PaymentBreakdown = () => {
  const { t } = useTranslation(["common"]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([...defaultData]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await AccountService.getStatements({
        groupbycond: "paymentMethod",
        filter: {
          statementType: "debit",
        },
      });
      const t = response.data?.data || [];
      setData(
        defaultData.map((item) => ({
          ...item,
          value: t.find((t: any) => t._id === item.key)?.totalAmount || 0,
          loading: false,
        }))
      );
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <AppCard title={t("paymentBreakdown")} icon={<CreditCard />}>
      {data.map((item) => (
        <div
          key={item.key}
          className={clsx(
            "tw:flex tw:items-center tw:justify-between tw:mb-4 tw:gap-2 tw:p-4 tw:rounded-md",
            {
              "tw:text-green-700 tw:bg-green-50": item.key === "cash",
              "tw:text-blue-700 tw:bg-blue-50": item.key === "card",
              "tw:text-yellow-700 tw:bg-yellow-50": item.key === "cheque",
              "tw:text-indigo-700 tw:bg-indigo-50": item.key === "upi",
            }
          )}
        >
          <div className="tw:flex tw:items-center tw:gap-2">
            <span
              className={clsx("tw:w-2 tw:h-2 tw:rounded-full", {
                "tw:bg-green-700": item.key === "cash",
                "tw:bg-blue-700": item.key === "card",
                "tw:bg-yellow-700": item.key === "cheque",
                "tw:bg-indigo-700": item.key === "upi",
              })}
            >
              &nbsp;
            </span>
            <h3 className="tw:text-sm tw:font-medium tw:text-gray-700">
              {item.key === "cash"
                ? t("cashSales")
                : item.key === "card"
                ? t("cardSales")
                : item.key === "cheque"
                ? t("chequeSales")
                : t("upiSales")}
            </h3>
          </div>
          {item.loading ? (
            <AppSpinner />
          ) : (
            <Amount
              value={item.value}
              className="tw:text-sm tw:font-semibold"
            />
          )}
        </div>
      ))}
    </AppCard>
  );
};

export default PaymentBreakdown;
