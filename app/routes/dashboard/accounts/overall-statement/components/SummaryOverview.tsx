import clsx from "clsx";
import {
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";

const icons = [
  <IndianRupee size={12} />,
  <ShoppingCart size={16} />,
  <IndianRupee size={16} />,
  <WalletIcon size={16} />,
  <IndianRupee size={16} />,
  <TrendingUp size={16} />,
];

type SummaryOverviewProps = {
  summaryData?: any[];
};

const SummaryOverview = ({ summaryData }: SummaryOverviewProps) => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="tw:mb-4 tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:gap-x-2">
      {summaryData?.map((item, index) => (
        <div key={item.labelKey}>
          <AppStatsCard
            label={t(item.labelKey)}
            icon={icons[index]}
            template={1}
            color={item.color as any}
            info={
              <div className="tw:text-xs tw:text-gray-500">
                {t(item.infoKey)}
              </div>
            }
          >
            {item.loading ? (
              <AppSpinner />
            ) : (
              <Amount
                value={item.value}
                className={clsx("wa-amount tw:text-base tw:font-medium", {
                  "tw:text-[color:var(--wa-domain-out)]":
                    item.color === "danger",
                  "tw:text-[color:var(--wa-domain-in)]":
                    item.color === "success",
                })}
                decimalPlaces={2}
              />
            )}
          </AppStatsCard>
        </div>
      ))}
    </div>
  );
};

export default SummaryOverview;
