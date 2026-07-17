import React from "react";
import DateFormat from "~/components/core/date/DateFormat";
import NoData from "~/components/core/no-data/NoData";

export type LogItem = {
  features: { name: string };
  loggedBy: { name: string };
  type: "Removed" | "Added";
  loggedOn: string; // ISO date string
  // description will be added dynamically
  [key: string]: any;
};

type PermissionChangeProps = {
  logs: LogItem[];
};

// Helper to generate description
function getDescription(log: LogItem) {
  const { features, loggedBy, type } = log;
  if (type === "Added") {
    return `${features.name} permission was added by ${loggedBy.name}`;
  } else if (type === "Removed") {
    return `${features.name} permission was removed by ${loggedBy.name}`;
  }
  return "";
}

const PermissionChange: React.FC<PermissionChangeProps> = ({ logs }) => {
  // Handle no data case
  if (!logs || logs.length === 0) {
    return (
      <div className="tw:mt-4">
        <NoData />
      </div>
    );
  }

  // Prepare logs with description
  const logsWithDescription = logs.map((log) => ({
    ...log,
    description: getDescription(log),
  }));

  return (
    <div className="tw:mt-4">
      {logsWithDescription.map((log, index) => (
        <div
          key={index}
          className="tw:border-l-4 tw:border-green-500 tw:pl-4 tw:py-2 tw:mb-2"
        >
          <p className="tw:font-medium tw:text-slate-900">{log.description}</p>
          <p className="tw:text-sm tw:text-slate-500">
            <DateFormat value={log.loggedOn} />
          </p>
        </div>
      ))}
    </div>
  );
};

export default PermissionChange;
