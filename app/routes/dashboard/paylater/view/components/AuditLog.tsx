import { ListOrdered } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";

const AuditLog = ({ logs }: { logs: any[] }) => {
  if (!logs || logs?.length === 0) {
    return null;
  }

  return (
    <AppCard title="Audit Log" icon={<ListOrdered />} noContentPadding>
      {logs.map((item, idx) => (
        <div key={idx} className="tw:mb-4">
          <div className="tw:flex tw:justify-between tw:items-center tw:mb-2 tw:bg-blue-50 tw:px-4 tw:py-2">
            <div className="tw:text-sm tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
              <DateFormat
                value={item.updatedAt}
                formatStr="dd MMM yyyy"
                className="tw:font-semibold"
              />
              <div className="tw:text-xs tw:text-slate-600">
                <DateFormat value={item.updatedAt} formatStr="hh:mm a" />
              </div>
            </div>
            <div>
              <AppBadge variant="primary">by: {item.updatedByName}</AppBadge>
            </div>
          </div>

          <div className="tw:mb-2 tw:px-4 tw:py-2">
            <div className="tw:text-sm tw:text-gray-500">Remarks</div>
            <div className="tw:text-sm tw:italic">{item.remarks}</div>
          </div>

          <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:bg-gray-50 tw:rounded-md">
            <div className="tw:p-3">
              <div className="tw:text-xs tw:text-gray-500">OLD VALUE</div>
              <div className="tw:text-sm tw:font-bold">{item.oldValue}</div>
            </div>
            <div className="tw:p-3 tw:border-l-4 tw:border-green-500">
              <div className="tw:text-xs tw:text-gray-500">NEW VALUE</div>
              <div className="tw:text-sm tw:font-bold tw:text-green-500">
                {item.newValue}
              </div>
            </div>
          </div>
        </div>
      ))}
    </AppCard>
  );
};

export default AuditLog;
