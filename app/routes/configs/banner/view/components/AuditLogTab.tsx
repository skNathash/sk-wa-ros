import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";
import BannerService from "~/services/BannerService";

export default function AuditLogTab({ logs }: { logs: any[] }) {
  if (!logs.length) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  return (
    <AppCard>
      <div className="tw:relative tw:pl-8">
        {/* Timeline line - aligned to center of dots */}
        <div className="tw:absolute tw:left-[7px] tw:top-1.5 tw:bottom-1.5 tw:w-px tw:bg-slate-200" />

        {logs.map((log, idx) => (
          <div key={idx} className="tw:relative tw:pb-5 last:tw:pb-0">
            {/* Dot - centered on the timeline line */}
            <div
              className={`tw:absolute tw:-left-8 tw:top-1 tw:w-[14px] tw:h-[14px] tw:rounded-full tw:border-2 tw:border-white tw:ring-2 ${
                idx === logs.length - 1
                  ? "tw:bg-green-500 tw:ring-green-200"
                  : "tw:bg-slate-400 tw:ring-slate-200"
              }`}
            />
            <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
              <div>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <AppBadge variant={BannerService.getStatusBadgeColor(log.status) as any}>
                    {log.status}
                  </AppBadge>
                  <span className="tw:text-xs tw:text-slate-500">
                    by {log.loggedBy?.name || "--"}
                    <span className="tw:text-slate-400">
                      {" "}({log.loggedBy?.usertype})
                    </span>
                  </span>
                </div>
                {log.remarks && (
                  <p className="tw:text-sm tw:text-slate-600 tw:mt-1">
                    {log.remarks}
                  </p>
                )}
              </div>
              <div className="tw:text-xs tw:text-slate-400 tw:whitespace-nowrap tw:shrink-0">
                {log.loggedAt ? (
                  <DateFormat value={log.loggedAt} formatStr="dd MMM yyyy, hh:mm a" />
                ) : (
                  "--"
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  );
}
