import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AppProgress from "~/components/core/progress/AppProgress";

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  totalItems: number;
};

const GlobalQtyApplyStatusModal = ({ show, callback, totalItems }: Props) => {
  const [currentItem, setCurrentItem] = useState(1);

  useEffect(() => {
    if (show) {
      setCurrentItem(1);
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      const interval = setInterval(() => {
        setCurrentItem((prev) => {
          if (prev >= totalItems) {
            clearInterval(interval);
            return prev;
          }
          return prev + 4;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [show]);

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
                value={(currentItem / totalItems) * 100}
                color="primary"
              />
            </div>
            <div className="tw:text-lg tw:font-medium">
              Applying global quantity to all items in the cart...
            </div>
            <div className="tw:text-sm tw:text-gray-500">
              This may take a few seconds.
            </div>
          </div>
        ) : (
          <div>
            <div className="tw:flex tw:flex-col tw:gap-4 tw:items-center tw:justify-center tw:h-full tw:mt-4">
              <CheckCircle className="tw:w-10 tw:h-10 tw:text-green-500" />
              <div className="tw:text-lg tw:font-medium">
                Global quantity applied
              </div>
              <div className="tw:text-sm tw:text-gray-500">
                All items in your cart have been updated with the new quantity.
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

export default GlobalQtyApplyStatusModal;
