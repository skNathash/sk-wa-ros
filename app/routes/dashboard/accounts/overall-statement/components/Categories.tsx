import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { endOfDay, startOfDay } from "date-fns";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import AppPopover from "~/components/core/popover/AppPopover";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AccountService from "~/services/AccountService";
import { useTranslation } from "react-i18next";

const getDefaultCategories = (t: any) => [
  {
    label: t("overallStatementDetails.categories.payment"),
    debits: 0,
    credits: 0,
    netBalance: 0,
    transactions: 0,
    groupTypes: ["PAYMENT", "EXPENSE"],
    loading: true,
    info: (
      <div className="tw:text-xs tw:text-gray-500">
        {t("overallStatementDetails.categories.paymentDescription")}
      </div>
    ),
  },
  {
    label: t("overallStatementDetails.categories.sales"),
    debits: 0,
    credits: 0,
    netBalance: 0,
    transactions: 0,
    groupTypes: ["POS_SALES", "B2B_SALES", "CLUB_SALES", "SALES"],
    loading: true,
    info: (
      <div className="tw:text-xs tw:text-gray-500">
        {t("overallStatementDetails.categories.salesDescription")}
      </div>
    ),
  },
  {
    label: t("overallStatementDetails.categories.purchase"),
    debits: 0,
    credits: 0,
    netBalance: 0,
    transactions: 0,
    groupTypes: ["PO"],
    loading: true,
    info: (
      <div className="tw:text-xs tw:text-gray-500">
        {t("overallStatementDetails.categories.purchaseDescription")}
      </div>
    ),
  },
  {
    label: t("overallStatementDetails.categories.invoice"),
    debits: 0,
    credits: 0,
    netBalance: 0,
    transactions: 0,
    groupTypes: ["INVOICE"],
    loading: true,
    info: (
      <div className="tw:text-xs tw:text-gray-500">
        {t("overallStatementDetails.categories.invoiceDescription")}
      </div>
    ),
  },
  {
    label: t("overallStatementDetails.categories.debitNote"),
    debits: 0,
    credits: 0,
    netBalance: 0,
    transactions: 0,
    groupTypes: ["DEBIT_NOTE"],
    loading: true,
    info: (
      <div className="tw:text-xs tw:text-gray-500">
        {t("overallStatementDetails.categories.debitNoteDescription")}
      </div>
    ),
  },
  {
    label: t("overallStatementDetails.categories.adjustment"),
    debits: 0,
    credits: 0,
    netBalance: 0,
    transactions: 0,
    groupTypes: ["ADJUSTMENT"],
    loading: true,
    info: (
      <div className="tw:text-xs tw:text-gray-500">
        {t("overallStatementDetails.categories.adjustmentDescription")}
      </div>
    ),
  },
];

const Categories = ({
  fromDate,
  toDate,
}: {
  fromDate: string;
  toDate: string;
}) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const defaultCategories = getDefaultCategories(t);
      setCategories(
        defaultCategories.map((item) => ({
          ...item,
          loading: true,
        }))
      );

      let promises = defaultCategories.map(async (item) => {
        try {
          return await AccountService.getStatements({
            filter: {
              sourceType: { $in: item.groupTypes },
              createdAt: {
                $gte: startOfDay(new Date(fromDate)),
                $lte: endOfDay(new Date(toDate)),
              },
            },
            groupbycond: "category",
          });
        } catch (error) {
          return {
            data: {
              data: [],
            },
          };
        }
      });

      const responses = await Promise.all(promises);

      setCategories((prev) => {
        let t = [...prev];

        responses.forEach((response, index) => {
          const d = response.data?.data || [];

          let creditData = d.find(
            (item: any) => item._id?.statementType === "credit"
          );

          let debitData = d.find(
            (item: any) => item._id?.statementType === "debit"
          );

          let credit = creditData?.totalAmount || 0;
          let debit = debitData?.totalAmount || 0;
          let netBalance = credit - debit;
          let transactions = (creditData?.count || 0) + (debitData?.count || 0);

          t[index].debits = debit;
          t[index].credits = credit;
          t[index].netBalance = netBalance;
          t[index].transactions = transactions;
          t[index].loading = false;
        });

        return [...t];
      });
    };
    fetchData();
  }, [t, fromDate, toDate]);

  return (
    <AppCard title={t("categoryBreakdown")} icon="credit-card">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        {categories.map((item) => (
          <div key={item.label} className="tw:bg-gray-50 tw:p-4 tw:rounded-md">
            <div className="tw:text-sm tw:font-semibold tw:mb-2 tw:flex tw:items-center tw:gap-1">
              {item.label}
              {item.info && (
                <AppPopover
                  triggerContent={
                    <button className="tw:text-xs tw:text-gray-500 tw:cursor-pointer">
                      <Info size={12} />
                    </button>
                  }
                >
                  {item.info}
                </AppPopover>
              )}
            </div>

            <div className="tw:flex tw:items-center tw:justify-between tw:text-sm tw:mb-1">
              <span className="tw:text-slate-500">{t("debits")}</span>
              {item.loading ? (
                <AppSpinner />
              ) : (
                <Amount
                  value={item.debits}
                  className="tw:font-medium tw:text-red-500"
                />
              )}
            </div>

            <div className="tw:flex tw:items-center tw:justify-between tw:text-sm">
              <span className="tw:text-slate-500">{t("credits")}</span>
              {item.loading ? (
                <AppSpinner />
              ) : (
                <Amount
                  value={item.credits}
                  className="tw:font-medium tw:text-green-500"
                />
              )}
            </div>

            <Divider className="tw:!my-2" />

            <div className="tw:flex tw:items-center tw:justify-between tw:text-sm tw:mb-1">
              <span className="tw:text-slate-500">{t("net")}</span>
              {item.loading ? (
                <AppSpinner />
              ) : (
                <Amount
                  value={item.netBalance}
                  className="tw:font-semibold tw:text-red-500"
                />
              )}
            </div>
            <div className="tw:text-xs tw:text-slate-400 tw:mt-1">
              {item.loading ? (
                <AppSpinner />
              ) : (
                <>
                  {item.transactions}{" "}
                  {item.transactions === 1
                    ? t("transaction")
                    : t("transactions")}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  );
};

export default Categories;
