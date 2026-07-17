import { ArrowDownRight, ArrowUpRight, History } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";

type LogItem = {
  loggedAt: string;
  loggedBy: string;
  message: string;
  newData: any;
  oldData: any;
  paramName: string;
};

type Props = {
  logs?: LogItem[];
};

const RecentPriceChanges = ({ logs = [] }: Props) => {
  const formattedLogs = logs
    .filter((log) => log.paramName === "discount")
    .slice(0, 3);

  if (logs.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
        <History size={16} />
        <div className="tw:text-sm tw:font-medium">Recent Price Changes</div>
      </div>
      {formattedLogs.map((item, idx) => {
        return (
          <div
            key={idx}
            className="tw:bg-slate-50 tw:rounded-xl tw:px-5 tw:p-2 tw:mb-2 tw:flex tw:items-center tw:justify-between"
          >
            <div>
              <div className="tw:flex tw:items-center tw:justify-between">
                <div className="tw:font-semibold tw:text-lg">
                  <Amount value={item.oldData} decimalPlaces={2} />
                  <span className="tw:mx-1">→</span>
                  <Amount value={item.newData} decimalPlaces={2} />
                </div>
                <AppBadge variant="white">{7.4}%</AppBadge>
              </div>
              <span className="tw:text-xs tw:text-gray-500">
                <DateFormat value={item.loggedAt} />
              </span>
            </div>
            <div className="tw:text-xs">
              {item.newData > item.oldData ? (
                <ArrowUpRight className="tw:w-5 tw:h-5 tw:text-green-500" />
              ) : (
                <ArrowDownRight className="tw:w-5 tw:h-5 tw:text-red-500" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentPriceChanges;
