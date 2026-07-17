import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AppProgress from "~/components/core/progress/AppProgress";

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  totalItems: number;
  message?: string;
  successMessage?: string;
  subMessage?: string;
};

const GlobalConfigApplyModal = ({
  show,
  callback,
  totalItems,
  message = "Applying global configuration to all items...",
  successMessage = "Global configuration applied",
  subMessage = "All items in your cart have been updated.",
}: Props) => {
  const [currentItem, setCurrentItem] = useState(0);

  useEffect(() => {
    if (show) {
      setCurrentItem(0);
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      const step = Math.max(1, Math.floor(totalItems / 10));
      const interval = setInterval(() => {
        setCurrentItem((prev) => {
          if (prev >= totalItems) {
            clearInterval(interval);
            return totalItems;
          }
          return Math.min(prev + step, totalItems);
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [show, totalItems]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={handleClose} backdropDismiss={false}>
      <AppModal.Content>
        {currentItem < totalItems ? (
          <div className="tw:flex tw:flex-col tw:gap-4 tw:items-center tw:justify-center tw:h-full tw:mt-4">
            <div className="tw:w-full">
              <div className="tw:flex tw:gap-2 tw:text-sm tw:text-gray-500 tw:justify-between tw:w-full">
                <span>{currentItem}</span>
                <span>{totalItems}</span>
              </div>
              <AppProgress
                value={totalItems > 0 ? (currentItem / totalItems) * 100 : 100}
                color="primary"
              />
            </div>
            <div className="tw:text-lg tw:font-medium tw:text-center">
              {message}
            </div>
            <div className="tw:text-sm tw:text-gray-500">
              This may take a few seconds.
            </div>
          </div>
        ) : (
          <div>
            <div className="tw:flex tw:flex-col tw:gap-4 tw:items-center tw:justify-center tw:h-full tw:mt-4">
              <CheckCircle className="tw:w-10 tw:h-10 tw:text-green-500" />
              <div className="tw:text-lg tw:font-medium tw:text-center">
                {successMessage}
              </div>
              <div className="tw:text-sm tw:text-gray-500 tw:text-center">
                {subMessage}
              </div>
              <AppButton
                size="small"
                className="tw:w-full"
                color="success"
                onClick={handleClose}
              >
                OK
              </AppButton>
            </div>
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default GlobalConfigApplyModal;
