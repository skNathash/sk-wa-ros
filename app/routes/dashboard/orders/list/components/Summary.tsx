import clsx from "clsx";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { defaultSummary } from "../helper";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";

const summaryData = [...defaultSummary];

type SummaryShape = {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  uniqueCustomers: number;
};

const Summary = ({ summary }: { summary: SummaryShape }) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const theme = useTheme();

  // Theme-2 drops the icon-chip dashboard cards for the flat white stat
  // tiles the rest of the theme uses (see InventoryStats): tiny uppercase
  // label, one bold figure, revenue in the money green.
  if (theme === "theme-2") {
    return (
      <div className="tw:mb-4 tw:grid tw:grid-cols-2 tw:gap-3 tw:xl:grid-cols-4">
        {summaryData.map((item) => {
          const value = summary[item.valueKey as keyof SummaryShape] || 0;
          return (
            <div
              key={item.valueKey}
              className="tw:rounded-xl tw:bg-white tw:px-4 tw:py-3.5 tw:ring-1 tw:ring-slate-100"
            >
              <p
                className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {t(item.label)}
              </p>
              <p
                className={clsx(
                  "tw:mt-1.5 tw:text-2xl tw:font-bold tw:tabular-nums",
                  item.valueKey === "totalRevenue"
                    ? "tw:text-emerald-600"
                    : "tw:text-slate-900",
                )}
              >
                {item.isAmount ? (
                  <Amount value={value} decimalPlaces={0} />
                ) : (
                  value
                )}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  const renderCard = (item: any, index: number) => (
    <AppStatsCard
      key={index}
      label={t(item.label)}
      icon={<item.icon size={16} />}
      template={isMobile ? 1 : 2}
      color={item.color as any}
    >
      <div className="tw:text-lg tw:lg:text-2xl tw:font-semibold">
        {item.isAmount ? (
          <Amount
            value={summary[item.valueKey as keyof typeof summary] || 0}
            decimalPlaces={0}
          />
        ) : (
          summary[item.valueKey as keyof typeof summary] || 0
        )}
      </div>
    </AppStatsCard>
  );

  return (
    <div className="tw:mb-4">
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-2">
        {summaryData.map((item, index) => (
          <div key={index} className="tw:w-full">
            {renderCard(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Summary;
