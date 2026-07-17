import { useEffect, useState } from "react";
import EmployeeService from "~/services/EmployeeService";
import PermissionChange from "./PermissionChange";
import type { LogItem } from "./PermissionChange";
import AppCard from "~/components/core/card/AppCard";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import NoData from "~/components/core/no-data/NoData";
import { useTranslation } from "react-i18next";
import DateFormat from "~/components/core/date/DateFormat";

const buildTabs = (t: (key: string) => string): TabItem[] => [
  {
    key: "permissions-changes",
    name: t("permissionsChanges"),
  },
  {
    key: "audit-log",
    name: t("auditLog"),
  },
  {
    key: "user-activity",
    name: t("userActivity"),
  },
];

type RecentActivityProps = {
  logs: LogItem[];
  userId: string;
};

const RecentActivity = ({ logs, userId }: RecentActivityProps) => {
  const { t } = useTranslation(["common"]);
  const [activeTab, setActiveTab] = useState<string>("permissions-changes");
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      if (activeTab === "user-activity" && userId) {
        setLoading(true);
        try {
          const resp = await EmployeeService.getUserActivities(userId);
          setActivities(resp?.data?.data || []);
        } catch {
          setActivities([]);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchActivities();
  }, [activeTab, userId]);

  const featureLogs = logs.filter((log: any) => log.entityType === "feature");
  const auditLogs = logs.filter((log: any) => log.entityType !== "feature");

  return (
    <AppCard title={t("recentActivity")} icon="activity">
      <AppTab
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab.key)}
        tabs={buildTabs(t)}
      />

      <div>
        {activeTab === "permissions-changes" ? (
          <PermissionChange logs={featureLogs} />
        ) : activeTab === "audit-log" ? (
          auditLogs.length ? (
            <div className="tw:mt-4">
              {auditLogs.map((log: any, index: number) => (
                <div
                  key={index}
                  className="tw:border-l-4 tw:border-blue-500 tw:pl-4 tw:py-2 tw:mb-2"
                >
                  <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                    <span className="tw:font-medium tw:text-slate-900 tw:text-sm">
                      {log.type || log.entityType || "-"}
                    </span>
                    {log.loggedBy?.name && (
                      <span className="tw:text-xs tw:text-slate-500">
                        by {log.loggedBy.name}
                      </span>
                    )}
                  </div>
                  {log.entityData &&
                    Object.keys(log.entityData).length > 0 && (
                      <div className="tw:text-sm tw:text-slate-600 tw:space-y-0.5">
                        {Object.entries(log.entityData)
                          .filter(
                            ([key]) =>
                              !["routeId", "brandId", "franchiseId"].includes(
                                key
                              )
                          )
                          .map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <span className="tw:font-medium tw:uppercase">
                                {key}:
                              </span>{" "}
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value ?? "-")}
                            </div>
                          ))}
                      </div>
                    )}
                  <p className="tw:text-xs tw:text-slate-400 tw:mt-1">
                    <DateFormat value={log.loggedOn} />
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="tw:mt-4">
              <NoData />
            </div>
          )
        ) : loading ? (
          <div className="tw-text-center tw-py-10">{t("loading")}</div>
        ) : activities.length ? (
          <ul className="tw-list-disc tw-pl-5 tw-text-sm">
            {activities.map((act, idx) => (
              <li key={idx}>{act.description || JSON.stringify(act)}</li>
            ))}
          </ul>
        ) : (
          <NoData />
        )}
      </div>
    </AppCard>
  );
};

export default RecentActivity;
