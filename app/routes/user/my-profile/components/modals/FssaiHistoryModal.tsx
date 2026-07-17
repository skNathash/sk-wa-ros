import { History } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppModal from "~/components/core/modal/AppModal";

type FssaiLog = {
  _id?: string;
  id?: string;
  status?: string;
  createdAt?: string;
  approvedAt?: string;
  comment?: string;
  value?: { licenseNo?: string; validity?: string; docs?: string[] };
};

type Props = {
  show: boolean;
  logs: FssaiLog[];
  onClose: () => void;
  onImageClick: (imageId: string) => void;
};

const statusBadge = (status?: string) => {
  const s = String(status || "").toLowerCase();
  if (s === "approved") return <AppBadge variant="success">Approved</AppBadge>;
  if (s === "rejected") return <AppBadge variant="danger">Rejected</AppBadge>;
  if (s === "pending") return <AppBadge variant="warning">Pending</AppBadge>;
  return <AppBadge variant="light">{status || "--"}</AppBadge>;
};

const FssaiHistoryModal = ({ show, logs, onClose, onImageClick }: Props) => {
  return (
    <AppModal show={show} callback={onClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-base tw:font-semibold">
          <History className="tw:w-4 tw:h-4 tw:text-blue-600" />
          FSSAI Request History
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]">
        {logs.length === 0 ? (
          <div className="tw:text-center tw:text-sm tw:text-gray-500 tw:py-6">
            No requests yet.
          </div>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-3">
            {logs.map((log, idx) => {
              const v = log?.value || {};
              const docId =
                Array.isArray(v.docs) && v.docs.length > 0 ? v.docs[0] : null;
              const status = String(log.status || "").toLowerCase();
              return (
                <div
                  key={log?._id || log?.id || idx}
                  className="tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:p-3"
                >
                  <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                    <div className="tw:text-xs tw:text-gray-500">
                      Submitted{" "}
                      {log.createdAt ? (
                        <DateFormat value={log.createdAt} />
                      ) : (
                        "--"
                      )}
                    </div>
                    {statusBadge(log.status)}
                  </div>
                  <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-2">
                    <KeyValue label="License Number" size="sm">
                      <span className="tw:font-mono tw:text-sm">
                        {v.licenseNo || "--"}
                      </span>
                    </KeyValue>
                    <KeyValue label="Validity" size="sm">
                      <span className="tw:text-sm">
                        {v.validity ? (
                          <DateFormat
                            value={v.validity}
                            formatStr="dd MMM yyyy"
                          />
                        ) : (
                          "--"
                        )}
                      </span>
                    </KeyValue>
                  </div>
                  {status === "approved" && log.approvedAt ? (
                    <div className="tw:text-[11px] tw:text-emerald-700 tw:mt-2">
                      Approved on <DateFormat value={log.approvedAt} />
                    </div>
                  ) : null}
                  {status === "rejected" && log.comment ? (
                    <div className="tw:text-xs tw:text-red-700 tw:mt-2">
                      Reason: {log.comment}
                    </div>
                  ) : null}
                  {docId ? (
                    <div className="tw:mt-2">
                      <FileUploadPreview
                        image={docId}
                        hideRemove
                        onImageClick={onImageClick}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default FssaiHistoryModal;
