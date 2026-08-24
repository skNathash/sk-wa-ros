import React, { useEffect, useState } from "react";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import WhatsappTemplatePreview from "~/shared/notifications/whatsapp-template/WhatsappTemplatePreview";
import WhatsappTemplateService from "~/services/WhatsappTemplateService";

type Props = {
  show: boolean;
  // Linked-template reference off a request: may embed the full template
  // (with body/featureImage) or just carry an id.
  templateRef?: any;
  templateId?: string | number | null;
  callback: (payload: { action: string }) => void;
};

const LinkedTemplatePreviewModal: React.FC<Props> = ({
  show,
  templateRef,
  templateId,
  callback,
}) => {
  const handleClose = () => callback({ action: "close" });

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const resolvedId = templateId || templateRef?._id || templateRef?.id || null;

  useEffect(() => {
    if (!show || !resolvedId) {
      setTemplate(null);
      return;
    }

    // Use the embedded template directly if the body is already present.
    if (templateRef && typeof templateRef.body === "string") {
      setTemplate(WhatsappTemplateService.formatTemplate({ ...templateRef }));
      return;
    }

    let active = true;
    setLoading(true);
    WhatsappTemplateService.getById(resolvedId)
      .then((t) => {
        if (active) setTemplate(t);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, resolvedId]);

  const previewBody = template?.renderedBody || template?.body || "";
  const previewImg = template?.featureImage || "";

  return (
    <AppModal show={show} callback={callback} className="tw:max-w-md tw:w-full tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <ImgRender
            src="whatsapp-logo.png"
            alt="WhatsApp"
            className="tw:shrink-0 tw:w-5 tw:h-5"
          />
          <div className="tw:font-semibold tw:text-base">Template Preview</div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="modal-bg ion-padding tw:h-[90vh]">
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:h-48">
            <AppSpinner />
          </div>
        ) : previewBody || previewImg ? (
          <WhatsappTemplatePreview
            body={previewBody}
            imgUrl={previewImg}
            isAssetFeatureImage={template?.isAssetFeatureImage}
          />
        ) : (
          <div className="tw:py-8 tw:text-center tw:text-sm tw:text-slate-400">
            Preview not available
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default LinkedTemplatePreviewModal;
