import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import OmsService from "~/services/OmsService";

interface Props {
  logs: any[];
}

const Logs = ({ logs }: Props) => {
  if (!logs || logs.length === 0) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  return (
    <AppCard>
      <h3 className="tw:text-sm tw:font-semibold tw:text-slate-900 tw:mb-4">
        Activity timeline
      </h3>
      <ol className="tw:relative tw:border-l tw:border-slate-200 tw:ml-2">
        {logs.map((log, idx) => (
          <li
            key={log._id || idx}
            className="tw:pl-6 tw:pb-5 tw:last:pb-0 tw:relative"
          >
            <span className="tw:absolute tw:-left-[5px] tw:top-1.5 tw:size-2.5 tw:rounded-full tw:bg-blue-500 tw:ring-4 tw:ring-white" />
            <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
              <AppBadge
                variant={OmsService.getRefundStatusColor(log.status || "") as any}
              >
                {OmsService.getRefundDisplayStatus(log.status || "") || "-"}
              </AppBadge>
              <span className="tw:text-xs tw:text-slate-500 tw:tabular-nums">
                <DateFormat
                  value={log.createdAt}
                  formatStr="dd MMM yyyy, hh:mm a"
                />
              </span>
            </div>
            {log.remarks ? (
              <div className="tw:mt-1.5 tw:text-sm tw:text-slate-700 tw:leading-snug">
                {log.remarks}
              </div>
            ) : null}
            {log.createdBy?.name ? (
              <div className="tw:mt-1 tw:text-xs tw:text-slate-500">
                by{" "}
                <span className="tw:font-medium tw:text-slate-700">
                  {log.createdBy.name}
                </span>
                {log.createdBy.userType ? ` · ${log.createdBy.userType}` : ""}
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </AppCard>
  );
};

export default Logs;
