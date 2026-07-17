import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { useTranslation } from "react-i18next";
import { Users, UserCheck, Clock, UserPlus } from "lucide-react";
import useScreenView from "~/hooks/useScreenView";

type SummaryItem = {
  label: string;
  key: string;
  value?: number | string;
  color?: string;
  icon?: string | React.ReactNode;
  percentage?: number;
  valuePath?: string;
  langKey?: string;
};

const defaultSummary: SummaryItem[] = [
  {
    label: "Total Retailers",
    key: "totalRetailers",
    value: 0,
    color: "primary",
    icon: <Users />,
    percentage: 100,
    valuePath: "total",
    langKey: "totalRetailers",
  },
  {
    label: "Approved",
    key: "approved",
    value: 0,
    color: "success",
    icon: <UserCheck />,
    percentage: 0,
    valuePath: "approved",
    langKey: "approved",
  },
  {
    label: "Pending / Other",
    key: "notApproved",
    value: 0,
    color: "warning",
    icon: <Clock />,
    percentage: 0,
    valuePath: "pending",
    langKey: "pendingOther",
  },
  {
    label: "New This Week",
    key: "newThisWeek",
    value: 0,
    color: "info",
    icon: <UserPlus />,
    percentage: 0,
    valuePath: "registeredThisWeek",
    langKey: "newThisWeek",
  },
];

const getValueFromPath = (
  summary: Record<string, any>,
  path?: string,
  fallback?: any
) => {
  if (!path) return fallback;
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
