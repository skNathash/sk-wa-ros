import React, { useEffect } from "react";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import PriceSlabGridView from "./PriceSlabGridView";
import AppButton from "~/components/core/button/AppButton";
import { Calendar, ChevronDown, ChevronUp, User } from "lucide-react";
import { produce } from "immer";

type DataType = {
  configType?: string;
  applicableFor?: string;
  isActive?: boolean;
  slab?: any[];
  slabs?: any[];
};

type AuditLog = {
  action?: string;
  oldData?: any | null;
  newData?: any | null;
  loggedAt?: string;
  loggedBy?: string;
  loggedByName?: string;
  remark?: string;
  _id?: string;
  showChanges?: boolean;
};

const PriceSlabConfigLogs: React.FC<{ logs?: AuditLog[] }> = ({
  logs = [],
}) => {
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>(logs);

  useEffect(() => {
    setAuditLogs(logs);
  }, [logs]);

  const renderSummary = (log: DataType) => {
    let configType = log.configType || "";
    let applicableFor = log.applicableFor || "";
    let isActive = log.isActive || false;

    return (
      <div className="tw:flex tw:flex-col tw:gap-2">
        {configType && (
          <KeyValue
            label="Config Type"
            size="xs"
            horizontal
            labelClassName="tw:w-32"
          >
            : {configType}
          </KeyValue>
        )}
        {applicableFor && (
          <KeyValue
            label="Applicable For"
            size="xs"
            horizontal
            labelClassName="tw:w-32"
          >
            : {applicableFor}
          </KeyValue>
        )}

        <KeyValue label="Status" size="xs" horizontal labelClassName="tw:w-32">
          : {isActive ? "Active" : "Inactive"}
        </KeyValue>
      </div>
    );
  };

  const toggleChanges = (index: number) => {
    setAuditLogs(
      produce((draft) => {
        draft[index].showChanges = !draft[index].showChanges;
      }),
    );
  };

  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div className="tw:p-4 tw:text-sm tw:text-gray-600">
        No logs available
      </div>
    );
  }

  return (
    <div className="tw:space-y-3">
      {auditLogs.map((l, index) => (
        <div
          key={l._id || l.loggedAt}
          className="tw:border tw:border-gray-200 tw:rounded-md tw:bg-white tw:p-3"
        >
          <div className="tw:flex tw:justify-between tw:items-start">
            <div>
              <div className="tw:text-sm tw:font-semibold tw:capitalize">
                {l.action || "-"}
              </div>
              {l.remark && (
                <div className="tw:text-xs tw:text-gray-600 tw:mt-1">
                  {l.remark}
                </div>
              )}
              <div className="tw:text-xs tw:text-gray-500 tw:mt-2 tw:flex tw:items-center tw:gap-1">
                <User size={16} />
                {l.loggedByName || l.loggedBy || "--"}
                <span className="tw:inline-flex tw:items-center tw:gap-1">
                  <Calendar size={16} />
                  {l.loggedAt ? (
                    <DateFormat
                      value={l.loggedAt}
                      formatStr="dd MMM yyyy hh:mm a"
                    />
                  ) : (
                    "-"
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="tw:text-end">
            <AppButton
              size="small"
              fill="clear"
              onClick={() => toggleChanges(index)}
            >
              View changes{" "}
              {!l.showChanges ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronUp size={16} />
              )}
            </AppButton>
          </div>

          {l.showChanges && (
            <div className="tw:grid tw:grid-cols-1 md:tw:grid-cols-2 tw:gap-3 tw:mt-3">
              <div>
                <div className="tw:text-xs tw:font-semibold tw:text-gray-600 tw:mb-2 tw:border-y tw:border-gray-200 tw:py-1 tw:bg-gray-50">
                  Old Data
                </div>
                {l.oldData ? (
                  <>
                    <div>{renderSummary(l.oldData)}</div>
                    {Array.isArray(l.oldData?.slab || l.oldData?.slabs) && (
                      <div className="tw:mt-2">
                        <PriceSlabGridView slabs={l.oldData.slab} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="tw:text-xs tw:text-gray-500 tw:italic">
                    No data
                  </div>
                )}
              </div>
              <div>
                <div className="tw:text-xs tw:font-semibold tw:text-gray-600 tw:mb-2 tw:border-y tw:border-gray-200 tw:py-1 tw:bg-gray-50">
                  New Data
                </div>
                {l.newData ? (
                  <>
                    <div>{renderSummary(l.newData)}</div>
                    {Array.isArray(l.newData?.slab || l.newData?.slabs) && (
                      <div className="tw:mt-2">
                        <PriceSlabGridView slabs={l.newData.slab} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="tw:text-xs tw:text-gray-500 tw:italic">
                    No data
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PriceSlabConfigLogs;
