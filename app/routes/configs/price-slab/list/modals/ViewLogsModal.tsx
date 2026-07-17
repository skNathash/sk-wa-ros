import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import SlabDetails from "../SlabDetails";
import DateFormat from "~/components/core/date/DateFormat";

type Props = {
  show: boolean;
  callback: (args?: { action: string; data?: any }) => void;
  logs?: any[];
};

const getActionInfo = (log: any) => {
  const hasOldData = log?.oldData?.slab && log.oldData.slab.length > 0;
  const hasNewData = log?.newData?.slab && log.newData.slab.length > 0;

  if (!hasOldData && hasNewData) {
    return {
      label: "Created",
      color: "tw:bg-green-100 tw:text-green-700",
      icon: "+",
    };
  } else if (hasOldData && !hasNewData) {
    return {
      label: "Deleted",
      color: "tw:bg-red-100 tw:text-red-700",
      icon: "×",
    };
  } else if (hasOldData && hasNewData) {
    return {
      label: "Updated",
      color: "tw:bg-blue-100 tw:text-blue-700",
      icon: "↻",
    };
  }
  return {
    label: "Action",
    color: "tw:bg-gray-100 tw:text-gray-700",
    icon: "•",
  };
};

const ViewLogsModal = ({ show, callback, logs = [] }: Props) => {
  return (
    <AppModal
      show={show}
      callback={() => callback?.({ action: "close" })}
      className="tw:h-[90vh]"
    >
      <AppModal.Title onClose={() => callback?.({ action: "close" })}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <span>Price Slab Change History</span>
          <span className="tw:text-xs tw:font-normal tw:text-slate-500">
            ({logs.length} {logs.length === 1 ? "change" : "changes"})
          </span>
        </div>
      </AppModal.Title>

      <AppModal.Content className="modal-bg tw:h-[90vh]">
        <div className="tw:flex tw:flex-col tw:gap-3">
          {(!logs || logs.length === 0) && (
            <AppCard>
              <div className="tw:px-4 tw:py-6 tw:text-sm tw:text-slate-500 tw:text-center">
                <div className="tw:text-3xl tw:mb-2">📋</div>
                <div className="tw:font-medium">No audit logs available</div>
                <div className="tw:text-xs tw:mt-1 tw:text-slate-400">
                  Changes will appear here once modifications are made
                </div>
              </div>
            </AppCard>
          )}

          {/* Timeline */}
          <div className="tw:relative">
            {(logs || []).map((log: any, idx: number) => {
              const actionInfo = getActionInfo(log);
              const hasOldData =
                log?.oldData?.slab && log.oldData.slab.length > 0;
              const hasNewData =
                log?.newData?.slab && log.newData.slab.length > 0;
              const isLast = idx === logs.length - 1;

              return (
                <div key={idx} className="tw:relative tw:flex tw:gap-3 tw:pb-4">
                  {/* Timeline Line */}
                  <div className="tw:flex tw:flex-col tw:items-center">
                    <div
                      className={`tw:w-8 tw:h-8 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:font-bold tw:text-sm tw:shrink-0 ${actionInfo.color}`}
                    >
                      {actionInfo.icon}
                    </div>
                    {!isLast && (
                      <div className="tw:w-0.5 tw:flex-1 tw:bg-slate-200 tw:mt-1 tw:min-h-[20px]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="tw:flex-1 tw:min-w-0">
                    <AppCard className="tw:shadow-sm">
                      <div className="tw:space-y-2">
                        {/* Header */}
                        <div className="tw:flex tw:justify-between tw:items-start tw:gap-3">
                          <div className="tw:flex-1 tw:min-w-0">
                            <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                              <span
                                className={`tw:inline-flex tw:items-center tw:gap-1 tw:px-2 tw:py-0.5 tw:rounded-full tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider ${actionInfo.color}`}
                              >
                                {actionInfo.label}
                              </span>
                              <span className="tw:text-sm tw:font-semibold tw:text-slate-900">
                                {log.loggedByName || "Unknown User"}
                              </span>
                            </div>
                            {log.remark && (
                              <div className="tw:text-xs tw:text-slate-600 tw:mt-1 tw:italic">
                                "{log.remark}"
                              </div>
                            )}
                          </div>
                          <div className="tw:text-[10px] tw:text-slate-500 tw:whitespace-nowrap tw:bg-slate-50 tw:px-2 tw:py-1 tw:rounded">
                            {log.loggedAt ? (
                              <DateFormat value={log.loggedAt} />
                            ) : (
                              "-"
                            )}
                          </div>
                        </div>

                        {/* Slab Comparison */}
                        {(hasOldData || hasNewData) && (
                          <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:pt-2 tw:border-t tw:border-slate-100">
                            {/* Previous Value */}
                            <div>
                              <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1.5">
                                <span className="tw:text-[10px] tw:font-bold tw:text-slate-500 tw:uppercase tw:tracking-wider">
                                  {hasOldData ? "Previous" : "—"}
                                </span>
                                {hasOldData && (
                                  <span className="tw:text-[9px] tw:text-slate-400">
                                    ({log.oldData.slab.length} slab
                                    {log.oldData.slab.length !== 1 ? "s" : ""})
                                  </span>
                                )}
                              </div>
                              {hasOldData ? (
                                <SlabDetails
                                  slab={log.oldData.slab}
                                  triggerLabel="📊 View Details"
                                />
                              ) : (
                                <div className="tw:text-xs tw:text-slate-400 tw:italic">
                                  No previous data
                                </div>
                              )}
                            </div>

                            {/* Arrow Separator */}
                            <div className="tw:absolute tw:left-1/2 tw:-translate-x-1/2 tw:top-[50%] tw:text-xl tw:text-slate-300">
                              →
                            </div>

                            {/* New Value */}
                            <div>
                              <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1.5">
                                <span className="tw:text-[10px] tw:font-bold tw:text-primary tw:uppercase tw:tracking-wider">
                                  {hasNewData ? "New" : "—"}
                                </span>
                                {hasNewData && (
                                  <span className="tw:text-[9px] tw:text-slate-400">
                                    ({log.newData.slab.length} slab
                                    {log.newData.slab.length !== 1 ? "s" : ""})
                                  </span>
                                )}
                              </div>
                              {hasNewData ? (
                                <SlabDetails
                                  slab={log.newData.slab}
                                  triggerLabel="📊 View Details"
                                />
                              ) : (
                                <div className="tw:text-xs tw:text-slate-400 tw:italic">
                                  Removed
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </AppCard>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="tw:flex tw:justify-end tw:pt-2 tw:border-t tw:border-slate-200">
            <AppButton
              onClick={() => callback?.({ action: "close" })}
              color="primary"
              size="sm"
            >
              Close
            </AppButton>
          </div>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default ViewLogsModal;
