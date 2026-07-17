import { Calendar, FileText, User } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import Divider from "~/components/core/divider/Divider";
import DateFormat from "~/components/core/date/DateFormat";

const Summary = ({ data }: { data: any }) => {
  return (
    <AppCard
      title="Summary"
      icon={<FileText />}
      iconClassName="tw:text-blue-500"
    >
      <KeyValue label="Status" size="sm" className="tw:mb-2">
        <AppBadge variant={data._statusColor || "light"}>
          <span className="tw:font-semibold">{data.summaryStatus}</span>
        </AppBadge>
      </KeyValue>

      <div className="tw:text-xs tw:text-gray-600 tw:mb-4">
        {data?.summaryDescription}
      </div>

      <Divider />

      <KeyValue label="Submitted On" size="sm" className="tw:mb-4">
        <div className="tw:flex tw:items-center tw:gap-2">
          <Calendar size={14} />
          <DateFormat value={data.createdAt} />
        </div>
      </KeyValue>

      <KeyValue label="Reviewed By" size="sm" className="tw:mb-4">
        <div className="tw:flex tw:items-center tw:gap-2">
          <User size={14} />
          {data.updatedByName || "--"}
        </div>
      </KeyValue>

      <KeyValue label="Reviewed On" size="sm">
        {data.updatedByName ? (
          <div className="tw:flex tw:items-center tw:gap-2">
            <Calendar size={14} />
            <DateFormat value={data.updatedAt} />
          </div>
        ) : (
          "--"
        )}
      </KeyValue>
    </AppCard>
  );
};

export default Summary;
