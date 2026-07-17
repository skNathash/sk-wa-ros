import { orderBy } from "lodash";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppModal from "~/components/core/modal/AppModal";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  profileRequestLogs: any[];
  // When provided, only logs whose type is in this allowlist are shown.
  // Otherwise the default behaviour (exclude address & FSSAI requests) applies.
  types?: string[];
  title?: string;
};

const ProfileRequestLogModal = ({
  show,
  callback,
  profileRequestLogs,
  types,
  title = "Profile Request History",
}: Props) => {
  const filteredData = orderBy(profileRequestLogs, "createdAt", "desc").filter(
    (log) =>
      Array.isArray(types)
        ? types.includes(log.type)
        : log.type !== "ADDRESS_UPDATE" && log.type !== "FSSAI_UPDATE",
  );

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold tw:text-lg">{title}</div>
        <div className="tw:text-xs tw:text-slate-600">
          {filteredData.length} request{filteredData.length !== 1 ? "s" : ""}{" "}
          found
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh] tw:bg-slate-50">
        <div className="tw:space-y-2 tw:px-2 tw:mt-4">
          {filteredData.length === 0 ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
              <div className="tw:text-center">
                <div className="tw:text-slate-400 tw:text-sm">
                  No profile request logs found
                </div>
              </div>
            </div>
          ) : (
            filteredData.map((log, idx) => (
              <div
                key={idx}
                className="tw:bg-white tw:rounded-md tw:p-3 tw:border tw:border-slate-200 tw:shadow-sm hover:tw:shadow-md tw:transition-shadow"
              >
                {/* Header: Type and Status */}
                <div className="tw:flex tw:items-start tw:justify-between tw:mb-2">
                  <div className="tw:flex-1">
                    <div className="tw:font-semibold tw:text-slate-900 tw:text-xs tw:mb-1">
                      {log.displayType}
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <span className="tw:text-slate-500 tw:text-xs tw:font-medium">
                        Value:
                      </span>
                      <span className="tw:text-primary tw:font-semibold tw:text-xs">
                        {log.displayValue}
                      </span>
                    </div>
                  </div>
                  <AppBadge
                    variant={log.statusColor}
                    className="tw:ml-2 tw:flex-shrink-0"
                  >
                    {log.status}
                  </AppBadge>
                </div>

                {/* Metadata: Dates */}
                <div className="tw:pt-2 tw:border-t tw:border-slate-100 tw:grid tw:grid-cols-1 sm:tw:grid-cols-2 tw:gap-3">
                  <KeyValue label="Updated On" size="sm">
                    {log.createdAt ? (
                      <DateFormat
                        value={log.createdAt}
                        className="tw:text-xs tw:text-slate-700 tw:font-medium"
                      />
                    ) : (
                      <span className="tw:text-slate-400">-</span>
                    )}
                  </KeyValue>
                  {log.approvedAt ? (
                    <KeyValue label="Approved On" size="sm">
                      <DateFormat
                        value={log.approvedAt}
                        className="tw:text-xs tw:text-slate-700 tw:font-medium"
                      />
                    </KeyValue>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default ProfileRequestLogModal;
