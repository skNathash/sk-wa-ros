import AppTimeline from "app/components/core/timeline/AppTimeline";
import { produce } from "immer";
import React, { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import CommonService from "~/services/CommonService";

type TimelineItem = {
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  status: string;
  date?: string;
  remarks?: string;
  done?: boolean;
};

const timelineData: TimelineItem[] = [
  {
    label: "Order",
    icon: "circle",
    iconColor: "tw:bg-gray-300",
    status: "Created",
  },
  {
    label: "Confirmed",
    icon: "check-circle",
    iconColor: "tw:bg-blue-400 tw:text-white",
    status: "Confirmed",
  },
  {
    label: "Processing",
    icon: "box",
    iconColor: "tw:bg-yellow-400 tw:text-white",
    status: "Processing",
  },
  {
    label: "Ready to Ship",
    icon: "rocket",
    iconColor: "tw:bg-purple-400 tw:text-white",
    status: "Ready to Ship",
  },
  {
    label: "Shipped",
    icon: "truck",
    iconColor: "tw:bg-orange-400 tw:text-white",
    status: "Shipped",
  },
  {
    label: "Delivered",
    icon: "home",
    iconColor: "tw:bg-green-400 tw:text-white",
    status: "Inward",
  },
];

const ClubOrderTimeLine = ({ logs }: { logs: any[] }) => {
  const [timeline, setTimeline] = useState<any[]>([...timelineData]);

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!logs || logs.length === 0) {
        setTimeline([...timelineData]);
        return;
      }
      const loggedByIds = Array.from(new Set(logs.map((log) => log.loggedBy)));
      if (loggedByIds.length === 0) {
        setTimeline([...timelineData]);
        return;
      }
      const res = await CommonService.getUsers({
        select: "name",
        filter: { _id: { $in: loggedByIds } },
      });
      const userMap = (res?.data || []).reduce(
        (acc: Record<string, any>, user: any) => {
          acc[user._id] = user.name;
          return acc;
        },
        {}
      );
      setTimeline(
        produce([...timelineData], (draft) => {
          draft.forEach((item) => {
            const log = logs.find((log) => log.log === item.status);
            if (log) {
              item.date = log.loggedAt;
              const userName = userMap[log.loggedBy]
                ? ` by: ${userMap[log.loggedBy]}`
                : "";
              item.remarks = (log.log || "") + userName;
              item.done = true;
            } else {
              item.done = false;
            }
          });
        })
      );
    };
    fetchTimeline();
  }, [logs]);

  return (
    <AppCard>
      <div className="tw:ml-2">
        <AppTimeline>
          {timeline.map((item, idx) => (
            <AppTimeline.Item
              key={item.label}
              icon={item.icon}
              iconClassName={item.iconColor}
              className={!item.done ? "tw:opacity-50" : ""}
            >
              <div className="tw:ml-2">
                <div className="tw:font-medium">{item.label}</div>
                {item.done && (
                  <>
                    <div className="tw:text-xs tw:text-gray-500">
                      {item.remarks}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      <DateFormat value={item.date} />
                    </div>
                  </>
                )}
              </div>
            </AppTimeline.Item>
          ))}
        </AppTimeline>
      </div>
    </AppCard>
  );
};

export default ClubOrderTimeLine;
