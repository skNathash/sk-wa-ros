import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import { Users, UserCheck, UserLock, UserX } from "lucide-react";
import { useTranslation } from "react-i18next";
import useScreenView from "~/hooks/useScreenView";

type SummaryItem = {
  label: string;
  key: string;
  langKey: string;
  value?: number | string;
  color?: string;
  icon?: React.ReactNode;
  percentage?: number;
  valuePath?: string;
};

const defaultSummary: SummaryItem[] = [
  {
    label: "Total Requests",
    key: "totalRequests",
    langKey: "totalRequests",
    value: 0,
    color: "primary",
    icon: <Users />,
    percentage: 100,
    valuePath: "total",
  },
  {
    label: "Approved",
    key: "approved",
    langKey: "approved",
    value: 0,
    color: "success",
    icon: <UserCheck />,
    percentage: 0,
    valuePath: "approved",
  },
  {
    label: "Pending",
    key: "notApproved",
    langKey: "pending",
    value: 0,
    color: "warning",
    icon: <UserLock />,
    percentage: 0,
    valuePath: "notApproved",
  },
  {
    label: "Rejected",
    key: "rejected",
    langKey: "rejected",
    value: 0,
    color: "danger",
    icon: <UserX />,
    percentage: 0,
    valuePath: "rejected",
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
  const { isMobile } = useScreenView();

  const { t } = useTranslation(["common"]);

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
            label={t(item.langKey)}
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
