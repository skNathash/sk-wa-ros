import React from "react";
import Amount from "~/components/core/amount/Amount";
import { useTranslation } from "react-i18next";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

interface SummaryProps {
  summaryData: Array<{
    label: string;
    value: number;
    color: string;
    amountClass: string;
    borderClass: string;
    langKey?: string;
    icon?: string | React.ReactNode;
  }>;
}

const Summary: React.FC<SummaryProps> = ({ summaryData }) => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:gap-2 tw:md:gap-4 tw:mb-4">
      {summaryData.map((item, idx) => (
        <AppStatsCard
          key={item.label}
          label={item.langKey ? t(item.langKey) : item.label}
          color={item.color as any}
          template={1}
          icon={item.icon}
        >
          <Amount
            value={item.value}
            className={`tw:font-bold tw:text-base tw:md:text-2xl ${item.amountClass}`}
            showSymbol={true}
          />
        </AppStatsCard>
      ))}
    </div>
  );
};

export default Summary;
