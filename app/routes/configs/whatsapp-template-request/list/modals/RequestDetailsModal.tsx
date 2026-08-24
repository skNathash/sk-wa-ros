import { Eye, ImageOff, MessageSquare } from "lucide-react";
import React, { useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppModal from "~/components/core/modal/AppModal";
import WhatsappTemplateRequestService from "~/services/WhatsappTemplateRequestService";
import LinkedTemplatePreviewModal from "./LinkedTemplatePreviewModal";

type Props = {
  show: boolean;
  request: any;
  callback: (payload: { action: string; data?: any }) => void;
};

// Pull the linked-template reference off a request regardless of shape
// (backend may embed the full template or just an id/name).
const getLinkedRef = (request: any) =>
  request?.templateInfo || request?.whatsappTemplate || null;

const getLinkedTemplateId = (request: any) => {
  const ref = getLinkedRef(request);
  return ref?._id || ref?.id || request?.templateId || null;
};

const RequestDetailsModal: React.FC<Props> = ({ show, request, callback }) => {
  const handleClose = () => callback({ action: "close" });

  const linkedRef = getLinkedRef(request);
  const linkedTemplateId = getLinkedTemplateId(request);
  const isLinked = Boolean(linkedTemplateId);

  const [previewModal, setPreviewModal] = useState(false);

  if (!request) {
    return (
      <AppModal
        show={show}
        callback={callback}
        className="tw:max-w-lg tw:w-full tw:h-[90vh]"
      >
        <AppModal.Title onClose={handleClose}>Request details</AppModal.Title>
        <AppModal.Content className="modal-bg ion-padding tw:h-[90vh]">
          <div className="tw:p-6 tw:text-center tw:text-slate-400">
            No request selected
          </div>
        </AppModal.Content>
      </AppModal>
    );
  }

  const images: string[] = Array.isArray(request?.images) ? request.images : [];
  const logs: any[] = Array.isArray(request?.logs) ? request.logs : [];

  return (
    <>
      <AppModal
        show={show}
        callback={callback}
        className="tw:max-w-lg tw:w-full tw:h-[90vh]"
      >
        <AppModal.Title onClose={handleClose}>
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="tw:flex tw:items-center tw:justify-center tw:w-7 tw:h-7 tw:rounded-lg tw:bg-green-100 tw:text-green-600">
              <MessageSquare size={16} />
            </span>
            <div className="tw:font-semibold tw:text-base">Request details</div>
            <AppBadge
              variant={
                WhatsappTemplateRequestService.getStatusBadgeColor(
                  request.status,
                ) as any
              }
              className="tw:ml-1"
            >
              {request?.status || "--"}
            </AppBadge>
          </div>
        </AppModal.Title>

        <AppModal.Content className="tw:h-[90vh]">
          <div className="tw:space-y-4">
            {/* Reference id */}
            {request?.referenceId && (
              <div>
                <div className="tw:text-xs tw:text-slate-400 tw:mb-1">
                  Reference ID
                </div>
                <div className="tw:text-sm tw:font-medium tw:text-slate-800">
                  #{request.referenceId}
                </div>
              </div>
            )}

            {/* Remarks */}
            <div className={request?.referenceId ? "tw:border-t tw:border-slate-100 tw:pt-3" : ""}>
              <div className="tw:text-xs tw:text-slate-400 tw:mb-1">
                Request
              </div>
              <div className="tw:text-sm tw:text-slate-800">
                {request?.remarks || "--"}
              </div>
            </div>

            {/* Requested on */}
            <div className="tw:border-t tw:border-slate-100 tw:pt-3">
              <KeyValue label="Requested on" size="sm">
                <DateFormat
                  value={request.createdAt}
                  formatStr="dd MMM yyyy, hh:mm a"
                />
              </KeyValue>
            </div>

            {/* Images */}
            <div className="tw:border-t tw:border-slate-100 tw:pt-3">
              <div className="tw:text-xs tw:text-slate-400 tw:mb-2">
                Reference images
              </div>
              {images.length ? (
                <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                  {images.map((assetId, i) => (
                    <div
                      key={assetId || i}
                      className="tw:w-16 tw:h-16 tw:rounded-md tw:overflow-hidden tw:bg-slate-100 tw:cursor-pointer"
                      onClick={() =>
                        callback({ action: "preview-image", data: request })
                      }
                    >
                      <ImgRender
                        assetId={assetId}
                        className="tw:w-full tw:h-full tw:object-cover"
                        alt="request"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-slate-400">
                  <ImageOff className="tw:w-4 tw:h-4" />
                  <span className="tw:text-xs">No images</span>
                </div>
              )}
            </div>

            {/* Linked template */}
            {isLinked && (
              <div className="tw:border-t tw:border-slate-100 tw:pt-3">
                <div className="tw:text-xs tw:text-slate-400 tw:mb-2">
                  Linked template
                </div>
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:rounded-lg tw:border tw:border-slate-100 tw:bg-slate-50 tw:px-3 tw:py-2">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
                    <span className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-lg tw:bg-green-100 tw:text-green-600 tw:shrink-0">
                      <MessageSquare size={15} />
                    </span>
                    <div className="tw:text-sm tw:text-slate-700 tw:truncate">
                      {linkedRef?.name || "WhatsApp template linked"}
                    </div>
                  </div>
                  <AppButton
                    fill="outline"
                    size="small"
                    onClick={() => setPreviewModal(true)}
                    className="tw:h-8 tw:px-3 tw:shrink-0"
                  >
                    <Eye size={14} />
                    Preview
                  </AppButton>
                </div>
              </div>
            )}

            {/* Logs / status history */}
            {logs.length > 0 && (
              <div className="tw:border-t tw:border-slate-100 tw:pt-3">
                <div className="tw:text-xs tw:text-slate-400 tw:mb-2">
                  History
                </div>
                <div className="tw:space-y-3">
                  {logs.map((log, i) => (
                    <div key={i} className="tw:flex tw:gap-2.5">
                      <div className="tw:flex tw:flex-col tw:items-center">
                        <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-slate-300 tw:mt-1.5" />
                        {i < logs.length - 1 && (
                          <span className="tw:w-px tw:flex-1 tw:bg-slate-200 tw:mt-1" />
                        )}
                      </div>
                      <div className="tw:flex-1 tw:pb-1">
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <span className="tw:text-sm tw:font-medium tw:text-slate-700">
                            {log?.status}
                          </span>
                          <span className="tw:text-xs tw:text-slate-400">
                            <DateFormat
                              value={log?.createdAt}
                              formatStr="dd MMM yyyy, hh:mm a"
                            />
                          </span>
                        </div>
                        {log?.createdBy?.name && (
                          <div className="tw:text-xs tw:text-slate-400">
                            by {log.createdBy.name}
                          </div>
                        )}
                        {log?.remarks && (
                          <div className="tw:text-xs tw:text-slate-600 tw:mt-0.5">
                            {log.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AppModal.Content>

        <AppModal.Footer>
          <div className="tw:flex tw:w-full tw:justify-end tw:gap-2 tw:p-2">
            <AppButton
              color="light"
              fill="outline"
              size="small"
              onClick={handleClose}
            >
              Close
            </AppButton>
          </div>
        </AppModal.Footer>
      </AppModal>

      <LinkedTemplatePreviewModal
        show={previewModal}
        templateRef={linkedRef}
        templateId={linkedTemplateId}
        callback={() => setPreviewModal(false)}
      />
    </>
  );
};

export default RequestDetailsModal;
