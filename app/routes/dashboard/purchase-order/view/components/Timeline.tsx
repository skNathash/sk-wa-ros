import { CircleCheckBig } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";

interface TimelineProps {
  logs: any[];
  createdAt?: string;
}

function TimelineItem({
  icon,
  title,
  date,
  user,
  remarks,
}: {
  icon?: React.ReactNode;
  title: string;
  date: string;
  user?: string;
  remarks?: string;
}) {
  return (
    <div className="tw:flex tw:items-start tw:gap-4">
      <div className="tw:pt-1">
        <span className="tw:bg-green-100 tw:text-green-600 tw:rounded-full tw:p-2 tw:inline-flex tw:items-center tw:justify-center tw:text-xl">
          {icon || <CircleCheckBig size={16} />}
        </span>
      </div>
      <div className="tw:flex-1">
        <div className="tw:flex tw:justify-between tw:items-center">
          <span className="tw:font-medium tw:text-base">{title}</span>
          <span className="tw:text-sm tw:text-gray-400">
            <DateFormat value={date} />
          </span>
        </div>
        {user && (
          <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">{user}</div>
        )}
        {remarks && (
          <div className="tw:text-gray-600 tw:mt-1 tw:text-xs">{remarks}</div>
        )}
      </div>
    </div>
  );
}

const Timeline = ({ logs, createdAt }: TimelineProps) => {
  return (
    <AppCard title="Order Timeline">
      <div className="tw:flex tw:flex-col tw:gap-8">
        {logs.length === 0 && (
          <div className="tw:text-center tw:text-gray-500">No data found</div>
        )}
        {logs.map((log, idx) => (
          <TimelineItem
            key={idx}
            title={log.event || "-"}
            date={log.timestamp}
            user={log.performedBy?.userName || log.performedBy?.userId}
            remarks={log.description}
          />
        ))}
      </div>
    </AppCard>
  );
};

export default Timeline;
