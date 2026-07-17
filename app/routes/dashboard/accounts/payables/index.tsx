import { IndianRupee } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import PayablesReceivables from "./components/payables-receivables/PayablesReceivables";
import AppCard from "~/components/core/card/AppCard";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getTotalAmount } from "./components/payables-receivables/helper";
import TotalAmountSummary from "./components/payables-receivables/components/TotalAmountSummary";
import AppTab from "~/components/core/tab/AppTab";

const Payables = () => {
  const appNav = useAppNav();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"payables" | "receivables">(
    "payables",
  );
  const [totals, setTotals] = useState({ payables: 0, receivables: 0 });

  const handleRecordPayment = () => {
    appNav.to("/dashboard/accounts/record-payment");
  };

  const fetchTotals = useCallback(async () => {
    const [payablesTotal, receivablesTotal] = await Promise.all([
      getTotalAmount("payables"),
      getTotalAmount("receivables"),
    ]);
    setTotals({ payables: payablesTotal, receivables: receivablesTotal });
  }, []);

  useEffect(() => {
    fetchTotals();
  }, [fetchTotals]);

  const tabs = [
    {
      key: "payables",
      name: t("payables"),
    },
    {
      key: "receivables",
      name: t("receivables"),
    },
  ];

  return (
    <>
      <AppCard className="tw:border-l-4 tw:border-l-[color:var(--wa-domain-in)] tw:mb-4">
        <div className="tw:flex tw:md:items-center tw:md:justify-between tw:flex-col tw:md:flex-row tw:gap-4">
          <div className="tw:text-sm tw:text-slate-600 tw:font-semibold tw:flex tw:items-center tw:gap-2">
            <IndianRupee size={20} />
            <span className="tw:flex-1">
              Quickly record payments or payouts for vendors and customers.
            </span>
          </div>
          <div>
            <AppButton
              color="success"
              onClick={handleRecordPayment}
              className="tw:w-full tw:md:w-auto"
            >
              <IndianRupee size={14} />
              Record Payment
            </AppButton>
          </div>
        </div>
      </AppCard>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
        <TotalAmountSummary
          type="payables"
          totalAmount={totals.payables}
          title={t("payables")}
        />
        <TotalAmountSummary
          type="receivables"
          totalAmount={totals.receivables}
          title={t("receivables")}
        />
      </div>

      <div className="tw:flex tw:flex-col tw:gap-4">
        <AppTab
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab.key as any)}
          variant="underline"
          className="tw:w-full tw:md:w-auto"
          noShadow
        />

        <PayablesReceivables type={activeTab} />
      </div>
    </>
  );
};

export default Payables;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Payables"),
    },
  ];
}
