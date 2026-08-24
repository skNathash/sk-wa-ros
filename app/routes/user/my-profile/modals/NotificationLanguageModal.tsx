import React, { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppSelect } from "~/components/core/form/AppSelect";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";

interface NotificationLanguageModalProps {
  show: boolean;
  callback: (a: { action: string }) => void;
  data?: any;
}

const NotificationLanguageModal: React.FC<NotificationLanguageModalProps> = ({
  show,
  callback,
  data,
}) => {
  const [lang, setLang] = useState<string>("en");
  const [submitting, setSubmitting] = useState(false);
  const toast = useAppToast();

  useEffect(() => {
    if (show) {
      setLang(data?.notificationMessageLang || "en");
    }
  }, [show, data]);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      // franchise/profile PUT resolves the franchise from the auth token,
      // so the payload only needs to carry the changed preference.
      const resp = await FranchiseService.updateFranchise({
        notificationMessageLang: lang,
      });
      if (resp && resp.statusCode === 200) {
        toast.show({
          msg: "Notification language updated successfully!",
          color: "success",
        });
        callback({ action: "submit" });
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to update notification language.",
          color: "danger",
        });
      }
    } catch (e) {
      toast.show({
        msg: "Failed to update notification language. Please try again.",
        color: "danger",
      });
    }
    setSubmitting(false);
  };

  return (
    <AppModal show={show} callback={callback} isAutoHeight>
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        Notification Language
      </AppModal.Title>
      <AppModal.Content className="ion-padding modal-bg">
        <AppCard>
          <div className="tw:space-y-4">
            <div className="tw:text-sm tw:text-gray-500">
              Choose the language for your WhatsApp messages.
            </div>
            <AppSelect
              label="Language"
              options={CommonService.getMessageLanguages()}
              value={lang}
              onChange={(val: string) => setLang(val)}
              className="tw:w-full"
            />
            <div className="tw:flex tw:justify-end tw:gap-2 tw:mt-4">
              <AppButton
                type="button"
                color="medium"
                onClick={() => callback({ action: "close" })}
              >
                Cancel
              </AppButton>
              <AppButton
                type="button"
                color="primary"
                onClick={onSubmit}
                isLoading={submitting}
              >
                Save
              </AppButton>
            </div>
          </div>
        </AppCard>
      </AppModal.Content>
    </AppModal>
  );
};

export default NotificationLanguageModal;
