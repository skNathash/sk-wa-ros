import { IndianRupee, SlidersHorizontal } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import PayablesReceivables from "./components/payables-receivables/PayablesReceivables";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { getSummary } from "./components/payables-receivables/helper";
import SummaryCard from "./components/payables-receivables/components/SummaryCard";

const Payables = () => {
  const appNav = useAppNav();
  const { t } = useTranslation();

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"payables" | "receivables">(
    searchParams.get("view") === "receivables" ? "receivables" : "payables",
  );
  const [partyType, setPartyType] = useState("all");

  // Honour deep-links from the accounts nav chips (`?view=receivables`).
  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "receivables" || view === "payables") {
      setActiveTab(view);
    }
  }, [searchParams]);
  const [summary, setSummary] = useState({
    payables: { amount: 0, parties: 0 },
    receivables: { amount: 0, parties: 0 },
  });

  const partyTypeOptions = [
    { value: "all", label: "All Parties" },
    { value: "customer", label: "Customer" },
    { value: "vendor", label: "Vendor" },
    { value: "franchise", label: "Retailer" },
  ];

  const handleRecordPayment = () => {
    appNav.to("/dashboard/accounts/record-payment");
  };

  const fetchTotals = useCallback(async () => {
    const [payables, receivables] = await Promise.all([
      getSummary("payables", partyType),
      getSummary("receivables", partyType),
    ]);
    setSummary({ payables, receivables });
  }, [partyType]);

  useEffect(() => {
    fetchTotals();
  }, [fetchTotals]);

  // A specific party filter is echoed on the summary card as a pill; "all" isn't.
  const activePartyLabel =
    partyType === "all"
      ? undefined
      : partyTypeOptions.find((o) => o.value === partyType)?.label;

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
      <div className="party-sticky-bar tw:sticky tw:md:static tw:top-15 tw:z-10 tw:bg-white tw:md:bg-transparent tw:border-b tw:border-gray-200/70 tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:mb-4 tw:-mx-4 tw:-mt-4 tw:px-4 tw:pt-2 tw:pb-2.5">
        {/* Lead affordance: marks this row as a filter set, not a second tab bar. */}
        <SlidersHorizontal
          aria-hidden
          size={15}
          className="tw:shrink-0 tw:text-gray-400"
        />
        {partyTypeOptions.map((option) => {
          const isActive = partyType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setPartyType(option.value)}
              className={`tw:cursor-pointer tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-[13px] tw:font-medium tw:transition-[color,background-color,border-color] tw:duration-150 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-primary/40 tw:focus-visible:ring-offset-1 ${
                isActive
                  ? "party-chip-active tw:font-semibold"
                  : "tw:bg-transparent tw:border-gray-200 tw:text-gray-600 tw:hover:text-gray-800 tw:hover:border-gray-300 tw:hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-3">
        {/* Primary control: choose money direction. A filled segmented control —
            a distinct metaphor from the outlined party-filter pills above — with
            the active segment carrying the direction accent it shares with the
            summary card and list. */}
        <div
          className="dir-seg"
          role="tablist"
          aria-label={`${t("payables")} / ${t("receivables")}`}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() =>
                  setActiveTab(tab.key as "payables" | "receivables")
                }
                className={`dir-seg-btn ${
                  isActive
                    ? `dir-seg-btn-active ${
                        tab.key === "payables" ? "dir-out" : "dir-in"
                      }`
                    : ""
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        <AppButton
          color="primary"
          size="small"
          onClick={handleRecordPayment}
          className="tw:shrink-0"
        >
          <IndianRupee size={14} />
          <span className="tw:hidden tw:sm:inline">Record Payment</span>
          <span className="tw:sm:hidden">Record</span>
        </AppButton>
      </div>

      <SummaryCard
        type={activeTab}
        amount={summary[activeTab].amount}
        parties={summary[activeTab].parties}
        partyLabel={activePartyLabel}
      />

      <div className="tw:flex tw:flex-col tw:gap-4">
        <PayablesReceivables type={activeTab} partyType={partyType} />
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
