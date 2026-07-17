import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { endOfDay, startOfDay, endOfMonth, startOfMonth, sub } from "date-fns";
import Amount from "~/components/core/amount/Amount";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import AccountService from "~/services/AccountService";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

const baseSummaryData = [
  {
    labelKey: "totalSales",
    infoKey: "accountsummary.description.totalSales",
    value: 0,
    icon: "indian-rupee",
    color: "success",
  },
  {
    labelKey: "totalPurchase",
    infoKey: "accountsummary.description.totalPurchase",
    value: 0,
    icon: "shopping-cart",
    color: "primary",
  },
  {
    labelKey: "totalCharges",
    infoKey: "accountsummary.description.totalCharges",
    value: 0,
    icon: "indian-rupee",
    color: "primary",
  },
  {
    labelKey: "netCashFlow",
    infoKey: "accountsummary.description.netCashFlow",
    value: 0,
    icon: "trending-up",
    color: "primary",
  },
];

const defaultDateRange = [
  startOfMonth(sub(new Date(), { months: 3 })),
  endOfMonth(new Date()),
];

const getStatements = async (filter: Record<string, any>) => {
  try {
    const response = await AccountService.getStatements({
      ...filter,
      outputType: "count",
    });
    return response.data?.totalAmount || 0;
  } catch (error) {
    return 0;
  }
};

const getTransactions = async (filter: Record<string, any>) => {
  const response = await AccountService.getTransactions({
    ...filter,
    outputType: "count",
  });
  return response.data?.data?.totalAmount || 0;
};

const Summary = () => {
  const { t } = useTranslation(["common"]);
  const [summary, setSummary] = useState<any[]>([...baseSummaryData]);
  const [searchParams] = useSearchParams();

  // Extract from and to values from URL
  const fromDate = searchParams.get("from") || "";
  const toDate = searchParams.get("to") || "";

  // Use URL params if available, otherwise use default date range
  const dateRange = useMemo(
    () => [
      fromDate ? startOfDay(new Date(fromDate)) : defaultDateRange[0],
      toDate ? endOfDay(new Date(toDate)) : defaultDateRange[1],
    ],
    [fromDate, toDate]
  );

  useEffect(() => {
    const fetchData = async () => {
      setSummary(
        baseSummaryData.map((item) => ({
          ...item,
          loading: true,
        }))
      );

      // Create date filters for API calls
      const statementDateFilter = {
        createdAt: {
          $gte: dateRange[0].toISOString(),
          $lte: dateRange[1].toISOString(),
        },
      };

      const transactionDateFilter = {
        transactionDate: {
          $gte: dateRange[0].toISOString(),
          $lte: dateRange[1].toISOString(),
        },
      };

      let promises = [
        getStatements({
          filter: {
            ...statementDateFilter,
            sourceType: {
              $in: ["POS_SALES", "B2B_SALES", "CLUB_SALES", "SALES", "EXPENSE"],
            },
            // statementType: "debit",
            statementType: "credit",
          },
        }),
        getStatements({
          filter: {
            ...statementDateFilter,
            sourceType: {
              $in: ["PO", "INVOICE", "EXPENSE"],
            },
            statementType: "credit",
          },
        }),
        getStatements({
          filter: {
            ...statementDateFilter,
            sourceType: {
              $in: ["PO_CHARGE", "PLATFORM_FEE"],
            },
            statementType: "debit",
          },
        }),
        // getTransactions({
        //   filter: {
        //     ...transactionDateFilter,
        //     status: "done",
        //     transactionType: "purchase_charge",
        //   },
        // }),
      ];

      const responses = await Promise.all(promises);

      setSummary(
        baseSummaryData.map((item, index) => {
          if (index === 3) {
            item.value = responses[0] - responses[1];
          } else if (index === 4) {
            item.value = responses[2];
          } else {
            item.value = responses[index];
          }
          return item;
        })
      );
    };
    fetchData();
  }, [fromDate, toDate]);

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
      {summary.map((item) => (
        <AppStatsCard
          key={item.labelKey}
          label={t(item.labelKey)}
          icon={item.icon}
          template={2}
          color={item.color as any}
          info={
            <div className="tw:text-xs tw:text-gray-500">{t(item.infoKey)}</div>
          }
        >
          {item.loading ? (
            <AppSpinner />
          ) : (
            <Amount
              value={item.value}
              className={clsx("tw:text-xl tw:font-bold", {
                "tw:text-red-500": item.value < 0,
              })}
              decimalPlaces={2}
            />
          )}
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
