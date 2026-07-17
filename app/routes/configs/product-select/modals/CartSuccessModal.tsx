import { CheckCircle } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  title?: string;
  description?: string;
};

const CartSuccessModal = ({
  show,
  callback,
  title = "Update successful",
  description = "The catalog update has been processed successfully.",
}: Props) => {
  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={handleClose} backdropDismiss={false}>
      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-4 tw:items-center tw:justify-center tw:h-full tw:mt-4 tw:mb-2">
          <CheckCircle className="tw:w-12 tw:h-12 tw:text-green-500" />
          <div className="tw:text-xl tw:font-semibold tw:text-center">
            {title}
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:text-center">
            {description}
          </div>
          <AppButton
            size="small"
            className="tw:w-full tw:mt-2"
            color="success"
            onClick={handleClose}
          >
            Done
          </AppButton>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default CartSuccessModal;
