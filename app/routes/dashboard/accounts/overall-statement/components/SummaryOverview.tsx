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
import useTheme from "~/hooks/useTheme";

// Index-aligned with baseSummaryData: money-in cards first (sales, payment
// received), then money-out cards (purchase, payment made, platform fee,
// expense).
const icons = [
  <TrendingUp size={16} />,
  <WalletIcon size={16} />,
  <ShoppingCart size={16} />,
  <WalletIcon size={16} />,
  <IndianRupee size={16} />,
  <IndianRupee size={16} />,
];

type SummaryOverviewProps = {
  summaryData?: any[];
};

// Direction accents reuse the shared theme-2 domain tokens (money in / money
// out) so the cards read in the same green/terracotta language as the rest of
// the Accounts thread. Named by role, not hue.
const accentByColor: Record<
  string,
  { accent: string; dark: string; tint: string }
> = {
  success: {
    accent: "var(--accent-in, #1f8a4f)",
    dark: "var(--accent-in-dark, #0f5a2e)",
    tint: "var(--accent-in-bg, #deefe0)",
  },
  danger: {
    accent: "var(--accent-out, #c85a1d)",
    dark: "var(--accent-out-dark, #5a2506)",
    tint: "var(--accent-out-bg, #fbe4d3)",
  },
};

const defaultAccent = {
  accent: "var(--primary, #075e54)",
  dark: "var(--primary, #075e54)",
  tint: "color-mix(in srgb, var(--primary, #075e54) 12%, #fff)",
};

const SummaryOverview = ({ summaryData }: SummaryOverviewProps) => {
  const { t } = useTranslation(["common"]);
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";

  if (!isTheme2) {
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
                  className={clsx("tw:text-base tw:font-medium", {
                    "tw:text-red-500": item.color === "danger",
                    "tw:text-green-500": item.color === "success",
                  })}
                  decimalPlaces={2}
                />
              )}
            </AppStatsCard>
          </div>
        ))}
      </div>
    );
  }

  // Largest metric drives the proportional bar fill — purely a visual weight,
  // it never changes the numbers shown.
  const maxValue = Math.max(
    1,
    ...(summaryData || []).map((item) => Math.abs(Number(item.value) || 0)),
  );

  return (
    <div className="tw:mb-4 tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
      {summaryData?.map((item, index) => {
        const tone = accentByColor[item.color as string] || defaultAccent;
        const value = Math.abs(Number(item.value) || 0);
        const pct = item.loading
          ? 0
          : Math.min(100, Math.max(6, Math.round((value / maxValue) * 100)));

        return (
          <div
            key={item.labelKey}
            className="tw:relative tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:p-3.5 tw:shadow-sm"
            style={{ borderLeft: `3px solid ${tone.accent}` }}
          >
            <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
              <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2.5">
                <span
                  className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl"
                  style={{ backgroundColor: tone.tint, color: tone.dark }}
                >
                  {icons[index]}
                </span>
                <div className="tw:min-w-0">
                  <div className="tw:truncate tw:text-sm tw:font-bold tw:text-gray-800">
                    {t(item.labelKey)}
                  </div>
                  <div className="tw:line-clamp-2 tw:text-[11px] tw:leading-snug tw:text-gray-500">
                    {t(item.infoKey)}
                  </div>
                </div>
              </div>

              <div className="tw:shrink-0 tw:text-right">
                {item.loading ? (
                  <AppSpinner />
                ) : (
                  <span style={{ color: tone.accent }}>
                    <Amount
                      value={item.value}
                      decimalPlaces={2}
                      className="tw:text-lg tw:font-bold"
                    />
                  </span>
                )}
              </div>
            </div>

            {/* Proportional weight bar — echoes the shared design's in/out
                progress bars. */}
            <div
              className="tw:mt-2.5 tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full"
              style={{ backgroundColor: tone.tint }}
            >
              <div
                className="tw:h-full tw:rounded-full tw:transition-all"
                style={{ width: `${pct}%`, backgroundColor: tone.accent }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryOverview;
