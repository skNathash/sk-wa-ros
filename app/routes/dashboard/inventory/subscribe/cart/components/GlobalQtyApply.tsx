import { CircleQuestionMark, Info, InfoIcon } from "lucide-react";
import React, { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppPopover from "~/components/core/popover/AppPopover";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";

type Props = {
  onApply: (quantity: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const GlobalQtyApply: React.FC<Props> = ({
  onApply,
  placeholder = "Apply Global Qty",
  disabled = false,
  className = "",
}) => {
  const [value, setValue] = useState<number | null>(null);
  const appToast = useAppToast();

  const handleApply = () => {
    const qty = Number(value);
    if (isNaN(qty) || qty < 0) {
      appToast.show({
        msg: "Please enter a valid quantity greater than 0",
        color: "danger",
      });
      return;
    }

    onApply(qty);
    setValue(null);
  };

  const onQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value !== "" && Number(value) >= 0) {
      setValue(Math.round(Number(value)));
    } else {
      setValue(null);
    }
  };

  if (AuthService.isMasterLogin()) {
    return null;
  }

  return (
    <div className={`tw:flex tw:items-center tw:gap-3 ${className}`}>
      <input
        type="number"
        min="1"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onQtyChange}
        className="tw:w-full tw:md:w-40 tw:px-3 tw:py-1.5 tw:border tw:border-gray-500 tw:rounded-md tw:text-sm focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500 focus:tw:border-transparent tw:flex-1"
        aria-label="global-quantity"
      />
      <AppPopover
        triggerContent={<CircleQuestionMark className="tw:w-4 tw:h-4" />}
      >
        <div className="tw:text-xs tw:text-gray-500">
          Apply global quantity to all items in the cart.
        </div>
      </AppPopover>
      <AppButton
        size="small"
        color="primary"
        onClick={handleApply}
        disabled={disabled}
      >
        Apply to All
      </AppButton>
    </div>
  );
};

export default GlobalQtyApply;
