import { MessageCircle } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import WhatsappPreviewContainer from "~/shared/notifications/whatspp-preview/WhatsappPreviewContainer";

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  msg: string;
  headerImg?: string;
};

const ViewWhatsappModal = ({ show, callback, msg, headerImg }: Props) => {
  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-md">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-base tw:font-semibold">
          <MessageCircle size={18} className="tw:text-[#25d366]" />
          WhatsApp Preview
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <WhatsappPreviewContainer msg={msg} headerImage={headerImg} />
      </AppModal.Content>
    </AppModal>
  );
};

export default ViewWhatsappModal;
