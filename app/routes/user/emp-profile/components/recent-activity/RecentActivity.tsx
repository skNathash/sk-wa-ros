import { useEffect, useState } from "react";
import EmployeeService from "~/services/EmployeeService";
import PermissionChange from "./PermissionChange";
import type { LogItem } from "./PermissionChange";
import AppCard from "~/components/core/card/AppCard";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import NoData from "~/components/core/no-data/NoData";

const tabs: TabItem[] = [
  {
    key: "permissions-changes",
    name: "Permissions Changes",
  },
  {
    key: "user-activity",
    name: "User Activity",
  },
];

type RecentActivityProps = {
  logs: LogItem[];
  userId: string;
};

const RecentActivity = ({ logs, userId }: RecentActivityProps) => {
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

  return (
    <AppCard title="Recent Activity" icon="activity">
      <AppTab
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab.key)}
        tabs={tabs}
      />

      <div>
        {activeTab === "permissions-changes" ? (
          <PermissionChange logs={logs} />
        ) : loading ? (
          <div className="tw-text-center tw-py-10">Loading...</div>
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
