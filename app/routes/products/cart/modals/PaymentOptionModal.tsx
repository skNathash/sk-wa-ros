import { Circle, CircleCheck, CreditCard, HandCoins } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import clsx from "clsx";

const PaymentOptionModal = ({
  show,
  callback,
  orderAmount,
  availableLimit,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  orderAmount: number;
  availableLimit: number;
}) => {
  const appToast = useAppToast();

  const [selectedType, setSelectedType] = useState<string>("");

  useEffect(() => {
    if (show) {
      setSelectedType("");
    }
  }, [show]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleSubmit = () => {
    if (!selectedType) {
      appToast.show({
        msg: "Please select a payment option",
        color: "error",
      });
      return;
    }

    callback({ action: "submit", data: selectedType });
  };

  const onSelect = (type: "paylater" | "cod") => {
    if (type === "paylater" && availableLimit < orderAmount) {
      return;
    }

    setSelectedType(type);
  };

  const renderItem = (options: {
    icon: React.ReactNode;
    title: string;
    description: string;
    availableLimit: number;
    type: "paylater" | "cod";
  }) => {
    return (
      <div
        className={clsx(
          "tw:flex tw:gap-2 tw:border tw:border-gray-200 tw:rounded tw:p-4 tw:mb-4 tw:cursor-pointer",
          {
            "tw:border-green-500": selectedType === options.type,
            "tw:cursor-none tw:opacity-50":
              availableLimit < orderAmount && options.type === "paylater",
          },
        )}
        onClick={() => onSelect(options.type)}
      >
        <div>
          <span className="tw:bg-gray-100 tw:rounded-full tw:p-2 tw:inline-block">
            {options.icon}
          </span>
        </div>
        <div className="tw:flex-1">
          <div className="tw:font-semibold tw:text-lg tw:mb-1">
            {options.title}
          </div>
          <div className="tw:text-sm tw:md:text-xs tw:text-gray-500 tw:mb-1">
            {options.description}
          </div>
          {options.type === "paylater" && selectedType === "paylater" && (
            <div className="tw:text-sm tw:md:text-xs tw:text-orange-500">
              Available Limit: <Amount value={options.availableLimit} />
            </div>
          )}
        </div>
        <div>
          {selectedType === options.type ? (
            <CircleCheck size={20} className="tw:text-green-500" />
          ) : (
            <Circle size={20} className="tw:text-gray-500" />
          )}
        </div>
      </div>
    );
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">Payment Option</div>
        <div className="tw:text-sm tw:md:text-xs tw:text-gray-500">
          Please select a payment option to proceed
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:mb-4 tw:bg-gray-100 tw:rounded-lg tw:p-4">
          <div className="tw:flex tw:justify-between tw:items-center tw:text-base">
            <div className="tw:font-medium">Order Value</div>
            <div className="tw:font-bold">
              <Amount value={orderAmount} />
            </div>
          </div>
        </div>
        {renderItem({
          icon: <CreditCard size={20} />,
          title: "Paylater Wallet",
          description: "Pay using your Paylater wallet",
          availableLimit: availableLimit,
          type: "paylater",
        })}
        {renderItem({
          icon: <HandCoins size={20} />,
          title: "Cash on Delivery",
          description: "Pay at the time of delivery",
          availableLimit: availableLimit,
          type: "cod",
        })}
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton color="light" fill="outline" onClick={handleClose}>
            Close
          </AppButton>
          <AppButton disabled={!selectedType} onClick={handleSubmit}>
            Proceed
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default PaymentOptionModal;
