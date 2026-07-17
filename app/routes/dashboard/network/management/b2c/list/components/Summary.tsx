import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { useTranslation } from "react-i18next";
import { Users, UserPlus, Star, IndianRupee } from "lucide-react";
import useScreenView from "~/hooks/useScreenView";

type SummaryItem = {
  label: string;
  key: string;
  value?: number;
  color?: string;
  icon?: string | React.ReactNode;
  percentage?: number;
  // new field to indicate path in the summary prop to read the value from
  valuePath?: string;
  percentagePath?: string;
  langKey?: string;
};

const defaultSummary: SummaryItem[] = [
  {
    label: "Active Customer",
    langKey: "activeCustomer",
    key: "activeCustomer",
    value: 0,
    color: "warning",
    icon: <Users />,
    percentage: 100,
    valuePath: "total",
    percentagePath: "",
  },
  {
    label: "New This Week",
    langKey: "newThisWeek",
    key: "newThisWeek",
    value: 0,
    color: "primary",
    icon: <UserPlus />,
    percentage: 100,
    valuePath: "lastWeekCreated",
    percentagePath: "",
  },
  {
    label: "Loyalty Members",
    langKey: "loyaltyMembers",
    key: "loyaltyMembers",
    value: 0,
    color: "info",
    icon: <Star />,
    percentage: 100,
    valuePath: "loyalty",
    percentagePath: "",
  },
  {
    label: "Avg. Lifetime Value",
    langKey: "avgLifetimeValue",
    key: "avgLifetimeValue",
    value: 0,
    color: "success",
    icon: <IndianRupee />,
    percentage: 100,
    valuePath: "avg",
    percentagePath: "",
  },
];

const getValueFromPath = (
  summary: Record<string, any>,
  path?: string,
  fallback?: any
) => {
  if (!path) return fallback;
  // simple dot-path support
  const parts = path.split(".").filter(Boolean);
  let cur: any = summary;
  for (const p of parts) {
    if (cur == null) return fallback;
    cur = cur[p];
  }
  return cur === undefined ? fallback : cur;
};

const Summary = ({
  summary = {} as Record<string, any>,
}: {
  summary?: Record<string, any>;
}) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-x-2 tw:mb-4">
      {defaultSummary.map((item) => {
        const value = getValueFromPath(
          summary,
          item.valuePath,
          item.value ?? 0
        );
        return (
          <AppStatsCard
            key={item.key}
            label={t(item.langKey || item.key)}
            color={item.color as any}
            icon={item.icon}
            template={isMobile ? 1 : 2}
          >
            <span className="tw:text-2xl tw:font-bold tw:mb-1">{value}</span>
          </AppStatsCard>
        );
      })}
    </div>
  );
};

export default Summary;
