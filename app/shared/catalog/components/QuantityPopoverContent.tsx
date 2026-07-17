import React, { useState } from "react";
import { X } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import { Input } from "~/components/ui/input";
import SellingTypeDisplay from "./SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface QuantityPopoverContentProps {
  initialQty: number;
  minQty: number;
  maxQty: number;
  incrQty: number;
  sellingType?: string;
  selectedStockUom?: string;
  onAdd: (qty: number) => void;
  onRemove: () => void;
  onClose?: () => void;
  isUpdating?: boolean;
}

const QuantityPopoverContent: React.FC<QuantityPopoverContentProps> = ({
  initialQty,
  minQty,
  maxQty,
  incrQty,
  sellingType,
  selectedStockUom,
  onAdd,
  onRemove,
  onClose,
  isUpdating = false,
}) => {
  const isLooseUom =
    selectedStockUom === "gm" || selectedStockUom === "ml";
  const altUom = selectedStockUom === "ml" ? "L" : "kg";

  const [popoverQty, setPopoverQty] = useState<string | number>(() => {
    if (isLooseUom && Number(initialQty) >= 1000) {
      return Number(initialQty) / 1000;
    }
    return initialQty;
  });
  const [uom, setUom] = useState<string>(() => {
    if (!isLooseUom) return selectedStockUom || "";
    if (Number(initialQty) >= 1000) return altUom;
    return selectedStockUom || "";
  });
  const [validationError, setValidationError] = useState("");

  const toBaseQty = (val: number, currentUom: string): number => {
    if (currentUom === "kg" || currentUom === "L") return val * 1000;
    return val;
  };

  const fromBaseQty = (val: number, currentUom: string): number => {
    if (currentUom === "kg" || currentUom === "L") return val / 1000;
    return val;
  };

  const formatInUom = (val: number, currentUom: string): string => {
    const v = fromBaseQty(val, currentUom);
    return `${Number.isInteger(v) ? v : Number(v.toFixed(3))} ${currentUom}`;
  };

  const validateQuantity = (qty: number) => {
    if (qty < minQty) {
      return `Min quantity: ${formatInUom(minQty, uom)}`;
    }
    if (qty > maxQty) {
      return `Max stock: ${formatInUom(maxQty, uom)}`;
    }
    if ((qty - minQty) % incrQty !== 0) {
      return `Qty must be ${formatInUom(minQty, uom)} + multiples of ${formatInUom(incrQty, uom)}`;
    }
    return "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const numVal = Number(val);

    if (isLooseUom) {
      setPopoverQty(val);
      if (val === "" || isNaN(numVal)) {
        setValidationError("Enter a valid quantity");
      } else if (numVal < 0) {
        setValidationError("Quantity cannot be negative");
      } else {
        setValidationError(validateQuantity(toBaseQty(numVal, uom)));
      }
      return;
    }

    if (val !== "" && !isNaN(numVal) && numVal > maxQty) {
      setPopoverQty(maxQty);
      setValidationError(validateQuantity(maxQty));
      return;
    }

    setPopoverQty(val);
    if (val === "" || isNaN(numVal)) {
      setValidationError("Enter a valid quantity");
    } else if (numVal < 0) {
      setValidationError("Quantity cannot be negative");
    } else {
      setValidationError(validateQuantity(numVal));
    }
  };

  const handleUomChange = (newUom: string) => {
    const n = Number(popoverQty);
    let nextQty: string | number = popoverQty;
    if (Number.isFinite(n) && n > 0 && newUom !== uom) {
      const baseUnits = ["gm", "ml"];
      const goingToBigger = !baseUnits.includes(newUom);
      nextQty = goingToBigger ? n / 1000 : n * 1000;
    }
    setUom(newUom);
    setPopoverQty(nextQty);
    const numVal = Number(nextQty);
    if (Number.isFinite(numVal) && numVal > 0) {
      setValidationError(validateQuantity(toBaseQty(numVal, newUom)));
    }
  };

  return (
    <div className="tw:p-3 tw:flex tw:flex-col tw:gap-3 tw:min-w-[200px] tw:relative">
      <div className="tw:flex tw:justify-between tw:items-center">
        <div className="tw:text-sm tw:font-medium tw:text-slate-800">
          Enter Quantity
          {sellingType && !selectedStockUom ? (
            <span className="tw:text-xs tw:font-normal">
              {" "}
              (in <SellingTypeDisplay sellingType={sellingType} />)
            </span>
          ) : (
            ""
          )}
        </div>
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="tw:p-1 tw:hover:tw:bg-slate-100 tw:rounded-full tw:transition-colors tw:cursor-pointer"
          >
            <X size={14} className="tw:text-slate-500" />
          </button>
        )}
      </div>
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        <div className="tw:flex tw:items-center tw:gap-1">
          <Input
            type="number"
            value={popoverQty}
            autoFocus
            min={0}
            onChange={handleInputChange}
            className={`tw:h-9 tw:flex-1 ${
              validationError ? "tw:border-red-500 tw:ring-red-500/20" : ""
            }`}
          />
          {isLooseUom && (
            <select
              value={uom}
              onChange={(e) => handleUomChange(e.target.value)}
              disabled={isUpdating}
              className="tw:h-9 tw:rounded-md tw:border tw:border-input tw:bg-transparent tw:px-2 tw:text-xs"
            >
              <option value={selectedStockUom}>{selectedStockUom}</option>
              <option value={altUom}>{altUom}</option>
            </select>
          )}
        </div>
        <div className="tw:flex tw:justify-between tw:text-[10px] tw:text-slate-500 tw:px-0.5">
          <span>Min: {isLooseUom ? formatInUom(minQty, uom) : minQty}</span>
          <span>
            Max Stock:{" "}
            <DisplayQty
              qty={maxQty}
              isLooseQty={isLooseUom}
              uom={selectedStockUom}
            />
          </span>
        </div>
        {validationError && (
          <div className="tw:text-red-500 tw:text-[10px] tw:font-medium tw:px-0.5">
            {validationError}
          </div>
        )}
      </div>
      <div className="tw:flex tw:gap-2 tw:pt-1">
        <AppButton
          size="small"
          fill="outline"
          color="danger"
          className="tw:flex-1"
          isLoading={isUpdating}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          Remove
        </AppButton>
        <AppButton
          size="small"
          className="tw:flex-1"
          isLoading={isUpdating}
          disabled={!!validationError || !popoverQty}
          onClick={(e) => {
            e.stopPropagation();
            const numVal = Number(popoverQty);
            const finalQty = isLooseUom ? toBaseQty(numVal, uom) : numVal;
            onAdd(finalQty);
          }}
        >
          Add
        </AppButton>
      </div>
    </div>
  );
};

export default QuantityPopoverContent;
