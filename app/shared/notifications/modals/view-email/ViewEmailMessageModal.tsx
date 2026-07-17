import { Mail } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  msg: string;
};

const ViewEmailMessageModal = ({ show, callback, msg }: Props) => {
  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:max-w-2xl tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-base tw:font-semibold">
          <Mail size={18} className="tw:text-primary" />
          Email Preview
        </div>
      </AppModal.Title>
      <AppModal.Content noPadding>
        <div
          className="tw:border-t tw:border-gray-100"
          style={{ height: "calc(90vh - 100px)" }}
        >
          <iframe
            srcDoc={msg}
            title="Email Preview"
            style={{ width: "100%", height: "100%", border: "none" }}
            sandbox="allow-same-origin"
          />
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default ViewEmailMessageModal;
