import clsx from "clsx";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppPopover from "~/components/core/popover/AppPopover";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AccountService from "~/services/AccountService";

type SummaryItem = {
  label: string;
  langkey: string;
  value: number;
  desctiption?: string;
  key: string;
  apiKey: string;
  loading?: boolean;
  info: (t: TFunction) => ReactNode;
};

const defaultSummary: SummaryItem[] = [
  {
    label: "Total Debits",
    langkey: "totalDebits",
    value: 0,
    desctiption: "Money Out",
    key: "debit",
    apiKey: "totalDebitAmount",
    loading: true,
    info: (t) => (
      <div className="tw:text-xs tw:text-gray-500">{t("moneyOut")}</div>
    ),
  },
  {
    label: "Total Credits",
    langkey: "totalCredits",
    value: 0,
    desctiption: "Money In",
    key: "credit",
    apiKey: "totalCreditAmount",
    info: (t) => (
      <div className="tw:text-xs tw:text-gray-500">{t("moneyIn")}</div>
    ),
  },
  {
    label: "Net Balance",
    langkey: "netBalance",
    value: 0,
    desctiption: "Net Balance",
    key: "net-balance",
    apiKey: "currentBalance",
    info: (t) => (
      <div className="tw:text-xs tw:text-gray-500">{t("netBalance")}</div>
    ),
  },
  {
    label: "Total Transactions",
    langkey: "totalTransactions",
    value: 0,
    desctiption: "Entries",
    key: "transactions",
    apiKey: "completedTransactions",
    info: (t) => (
      <div className="tw:text-xs tw:text-gray-500">{t("entries")}</div>
    ),
  },
];

const Summary = () => {
  const { t } = useTranslation();

  const [summary, setSummary] = useState<SummaryItem[]>([...defaultSummary]);

  useEffect(() => {
    const fetchData = async () => {
      setSummary(
        defaultSummary.map((item) => ({
          ...item,
          loading: true,
        }))
      );

      const response = await AccountService.fetchAccountsSummary();
      const data = response?.data?.data?.[0] || {};
      setSummary(
        defaultSummary.map((item) => ({
          ...item,
          loading: false,
          value: data[item.apiKey as keyof typeof data] || 0,
        }))
      );
    };
    fetchData();
  }, []);

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4">
      {summary.map((item) => (
        <AppCard key={item.key} className="tw:py-3">
          <div className="tw:text-center">
            <div className="tw:text-sm tw:text-slate-600 tw:mb-1 tw:inline-flex tw:items-center tw:gap-1">
              {t(item.langkey)}
              {item.info && (
                <AppPopover
                  triggerContent={
                    <button className="tw:text-xs tw:text-gray-500 tw:cursor-pointer">
                      <Info size={12} />
                    </button>
                  }
                >
                  {item.info(t)}
                </AppPopover>
              )}
            </div>
            <div
              className={clsx("wa-amount tw:text-xl tw:font-semibold", {
                "tw:text-[color:var(--wa-domain-out)]":
                  item.key === "debit" || item.key === "net-balance",
                "tw:text-[color:var(--wa-domain-in)]": item.key === "credit",
              })}
            >
              {item.loading ? (
                <AppSpinner />
              ) : (
                <>
                  {item.key == "transactions" ? (
                    item.value
                  ) : (
                    <Amount value={item.value} />
                  )}
                </>
              )}
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
              {item.desctiption}
            </div>
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default Summary;
