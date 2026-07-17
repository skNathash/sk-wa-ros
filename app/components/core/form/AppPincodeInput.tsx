import { orderBy } from "lodash";
import { useCallback, useRef, useState } from "react";
import type { RegisterOptions } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import { Input } from "~/components/ui/input";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import InpLabel from "./InpLabel";
import AppSpinner from "../Spinner/AppSpinner";

interface AppPincodeInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  register: any;
  rules?: RegisterOptions;
  error?: string;
  className?: string;
  size?: "sm" | "lg";
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  isRequired?: boolean;
  readOnly?: boolean;
  showMultipleResult?: boolean;
  side?: "top" | "bottom" | "left" | "right";
  alignment?: "start" | "center" | "end";
  onPincodeSelect?: (data: {
    value: number | null;
    status?: string;
    data?: any;
  }) => void;
}

export const AppPincodeInput = ({
  name,
  label,
  placeholder = "Enter pincode...",
  register,
  rules,
  error,
  className,
  size,
  onChange,
  onBlur,
  onFocus,
  disabled,
  isRequired,
  readOnly,
  showMultipleResult = false,
  side = "bottom",
  alignment = "start",
  onPincodeSelect,
}: AppPincodeInputProps) => {
  const [busyLoader, setBusyLoader] = useState({ show: false });
  const [showSuggest, setShowSuggest] = useState(false);
  const [pincodes, setPincodes] = useState<Array<any>>([]);

  const selectedPincodeRef = useRef<any>(null);
  const { show: showToast } = useAppToast();

  const {
    onChange: registerOnChange,
    onBlur: registerOnBlur,
    ...registerRest
  } = register(name, rules);

  const onInpChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      // Only allow numbers and limit to 6 digits
      const numericValue = value.replace(/\D/g, "").slice(0, 6);
      event.target.value = numericValue;

      registerOnChange(event);
      onChange?.(event);

      if (busyLoader.show) {
        return;
      }

      setShowSuggest(false);

      const numValue = Number(numericValue);

      // Call the callback with current value
      onPincodeSelect?.({ value: numericValue ? numValue : null });

      if (numericValue.length === 6) {
        setBusyLoader({ show: true });

        try {
          const r = await FranchiseService.getAddressOnPincode(numValue);
          const d =
            Array.isArray(r.data) && r.data.length > 0
              ? orderBy(r.data, ["town"], ["asc"])
              : [];

          setBusyLoader({ show: false });

          if (d.length > 0) {
            const p = d;
            if (p.length > 1 && showMultipleResult) {
              setPincodes(d);
              setShowSuggest(true);
            } else {
              onPincodeSelect?.({
                value: p[0].pincode,
                data: p[0],
                status: "success",
              });
            }
          } else {
            showToast({ msg: "Invalid pincode", color: "danger" });
            onPincodeSelect?.({ status: "error", value: null });
          }
        } catch (error) {
          setBusyLoader({ show: false });
          showToast({ msg: "Invalid pincode", color: "danger" });
          onPincodeSelect?.({ status: "error", value: null });
        }
      }
    },
    [
      registerOnChange,
      onChange,
      onPincodeSelect,
      busyLoader.show,
      showMultipleResult,
      showToast,
    ]
  );

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    registerOnBlur(event);
    onBlur?.(event);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(event);
  };

  const onDismiss = () => {
    // Only call onPincodeSelect if no selection was made via radio button
    // (since onPincodeSelectHandler already calls it when a radio is selected)
    if (!selectedPincodeRef.current) {
      onPincodeSelect?.({ value: null });
    }
    setShowSuggest(false);
  };

  const onPincodeSelectHandler = (value: string) => {
    selectedPincodeRef.current = value;
    const p = pincodes.find((x) => x._id === value);
    if (p && p._id) {
      onPincodeSelect?.({ value: p.pincode, data: p, status: "success" });
    }
    setShowSuggest(false);
  };

  return (
    <>
      <div className={className}>
        {label && (
          <InpLabel isRequired={isRequired} size={size}>
            {label}
          </InpLabel>
        )}

        <div className="tw:relative">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder={placeholder}
            onChange={onInpChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            readOnly={readOnly}
            disabled={disabled}
            autoComplete="off"
            {...registerRest}
            size={size === "sm" ? "sm" : "default"}
          />
          {busyLoader.show && (
            <AppSpinner className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2 tw:z-10 tw:w-5 tw:h-5" />
          )}
        </div>

        {error && (
          <div className="tw:text-red-500 tw:text-xs tw:mt-1">{error}</div>
        )}
      </div>

      <AppModal show={showSuggest} callback={onDismiss} className="tw:max-w-md">
        <AppModal.Title onClose={() => setShowSuggest(false)}>
          Choose Your Town
        </AppModal.Title>
        <AppModal.Content>
          <div className="tw:space-y-3">
            {pincodes.map((x) => (
              <div key={x._id} className="tw:flex tw:items-center tw:space-x-2">
                <input
                  type="radio"
                  id={x._id}
                  name="pincode"
                  value={x._id}
                  onChange={(e) => onPincodeSelectHandler(e.target.value)}
                  className="tw:w-4 tw:h-4 tw:text-blue-600 tw:bg-gray-100 tw:border-gray-300 tw:focus:ring-blue-500"
                />
                <label
                  htmlFor={x._id}
                  className="tw:font-medium tw:text-sm tw:cursor-pointer tw:flex-1"
                >
                  {x.town}
                </label>
              </div>
            ))}
          </div>
        </AppModal.Content>
      </AppModal>
    </>
  );
};

export default AppPincodeInput;
