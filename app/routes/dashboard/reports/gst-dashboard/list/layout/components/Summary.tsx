import { AlertCircle, Building2, TrendingDown, TrendingUp } from "lucide-react";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import Amount from "~/components/core/amount/Amount";

const icons: Record<string, React.ReactNode> = {
  primary: <Building2 />,
  success: <TrendingUp />,
  danger: <TrendingDown />,
  warning: <AlertCircle />,
};

const Summary = ({ summary }: { summary: any[] }) => {
  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-5 tw:md:gap-4 tw:gap-2 tw:mb-4">
      {summary.map((item) => {
        const isNetLike =
          item.key === "netGstPayable" ||
          item.key === "gstPayable" ||
          item.key === "finalGstToPay";

        const effectiveColor = isNetLike
          ? item.value > 0
            ? "success"
            : item.value < 0
              ? "danger"
              : item.color
          : item.color;

        const cardIcon = icons[effectiveColor] || icons[item.color];

        return (
          <AppStatsCard
            key={item.key}
            label={item.label}
            template={2}
            color={effectiveColor as any}
            icon={cardIcon}
            info={
              item.info ? (
                <div className="tw:text-xs">{item.info}</div>
              ) : undefined
            }
          >
            <div className="tw:text-base tw:md:font-bold tw:font-medium">
              {item.key === "uniqueHsnCodes" ? (
                item.value
              ) : isNetLike ? (
                <Amount
                  value={item.value}
                  className={
                    item.value > 0
                      ? "tw-text-green-600"
                      : item.value < 0
                        ? "tw-text-red-600"
                        : ""
                  }
                />
              ) : (
                <Amount value={item.value} />
              )}
            </div>
          </AppStatsCard>
        );
      })}
    </div>
  );
};

export default Summary;
