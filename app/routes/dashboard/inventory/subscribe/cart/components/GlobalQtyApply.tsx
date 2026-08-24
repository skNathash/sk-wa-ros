import { CircleQuestionMark } from "lucide-react";
import React, { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppPopover from "~/components/core/popover/AppPopover";
import useAppToast from "~/hooks/useAppToast";
import useTheme from "~/hooks/useTheme";
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
  const isTheme2 = useTheme() === "theme-2";

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

  const helpText = "Apply global quantity to all items in the cart.";

  // theme-2 seats the field and its action in one pill, the same joined-control
  // idiom the cart rows use for the qty stepper. On the top bar the loose
  // input + floating help icon + separate button read as three unrelated
  // controls filling the strip; as one object the row stays a single tool and
  // the tab band above it keeps the visual weight.
  if (isTheme2) {
    return (
      <div className={`tw:flex tw:min-w-0 tw:items-center ${className}`}>
        <div className="tw:flex tw:h-9 tw:min-w-0 tw:flex-1 tw:items-center tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white focus-within:tw:border-primary/40">
          <AppPopover
            triggerContent={
              <button
                type="button"
                aria-label="About global quantity"
                className="tw:flex tw:h-full tw:shrink-0 tw:items-center tw:pl-2.5 tw:pr-1 tw:text-slate-400 hover:tw:text-slate-600"
              >
                <CircleQuestionMark className="tw:h-4 tw:w-4" />
              </button>
            }
          >
            <div className="tw:text-xs tw:text-gray-500">{helpText}</div>
          </AppPopover>

          <input
            type="number"
            min="1"
            placeholder="Qty for all items"
            value={value ?? ""}
            onChange={onQtyChange}
            className="no-spinner tw:h-full tw:w-full tw:min-w-0 tw:bg-transparent tw:px-2 tw:text-sm tw:tabular-nums tw:text-slate-800 tw:outline-none placeholder:tw:text-slate-400"
            aria-label="global-quantity"
          />

          <button
            type="button"
            onClick={handleApply}
            disabled={disabled || value === null}
            className="tw:h-full tw:shrink-0 tw:border-l tw:border-slate-200 tw:px-3 tw:text-xs tw:font-semibold tw:text-primary disabled:tw:text-slate-300"
          >
            Apply
          </button>
        </div>
      </div>
    );
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
        <div className="tw:text-xs tw:text-gray-500">{helpText}</div>
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
