import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppModal from "~/components/core/modal/AppModal";
import { Input } from "~/components/ui/input";
import { useTranslation } from "react-i18next";

interface ChooseSanpshotModalProps {
  show: boolean;
  masterData: MasterItem[];
  loading?: boolean;
  callback: (a: { action: string; data?: any }) => void;
  maxQty?: number;
  validateOnMaxQty?: boolean;
  dealName?: string;
  minMrp?: number;
  selectedStockUom?: string;
  overridePrice?: number | null;
  billedMrp?: number;
}

interface MasterItem {
  mrp: number;
  barcode: string;
  expiry: string;
  totalQuantity: number;
  remainingDays?: number | null;
  enteredStock?: number;
  displayAvailableStock?: number;
  masters: Array<{
    _id: string;
    quantity: number;
    mrp: number;
    barcode: string;
    expiry: string;
    sellInLooseQty?: boolean;
    _qty?: number;
    [key: string]: any;
  }>;
}

const ChooseSanpshotModal: React.FC<ChooseSanpshotModalProps> = ({
  show,
  masterData,
  callback,
  maxQty = 0,
  validateOnMaxQty = false,
  dealName = "",
  minMrp,
  selectedStockUom,
  overridePrice,
  billedMrp,
}) => {
  const { t } = useTranslation(["common"]);
  const [stockInputs, setStockInputs] = useState<{
    [key: string]: number | "";
  }>({});
  const [error, setError] = useState<string>("");
  const [updatedMasterData, setUpdatedMasterData] = useState<MasterItem[]>([]);

  // current total units entered across all inputs
  const totalUnits = Object.values(stockInputs)
    .map((val) => (typeof val === "number" ? val : 0))
    .reduce((sum, val) => sum + val, 0);

  // Function to update displayAvailableStock for all items
  const updateDisplayAvailableStock = useCallback(
    (inputs: { [key: string]: number | "" }) => {
      const updatedData = masterData.map((item, index) => {
        const enteredQty =
          typeof inputs[`item_${index}`] === "number"
            ? (inputs[`item_${index}`] as number)
            : 0;
        const displayAvailableStock = Math.max(
          0,
          item.totalQuantity - enteredQty,
        );

        return {
          ...item,
          displayAvailableStock,
        };
      });
      setUpdatedMasterData(updatedData);
    },
    [masterData],
  );

  // Common validation for max quantity across input change and submit
  const validateMaxQty = (inputsParam?: {
    [key: string]: number | "";
  }): string | null => {
    const inputsToUse = inputsParam ?? stockInputs;
    const totalUnits = Object.values(inputsToUse)
      .map((val) => (typeof val === "number" ? val : 0))
      .reduce((sum, val) => sum + val, 0);

    if (validateOnMaxQty && totalUnits > maxQty) {
      return `Total units (${totalUnits}) cannot exceed max quantity (${maxQty})`;
    }

    return null;
  };

  useEffect(() => {
    // Initialize stock inputs when masterData changes
    const initialInputs: { [key: string]: number | "" } = {};
    masterData?.forEach((item, index) => {
      // Check if item has enteredStock value and use it for initialization
      initialInputs[`item_${index}`] = item.enteredStock || 0;
    });
    setStockInputs(initialInputs);
    setError("");

    // Initialize updated master data with displayAvailableStock
    updateDisplayAvailableStock(initialInputs);
  }, [masterData, updateDisplayAvailableStock]);

  const handleClose = () => {
    callback({ action: "close" });
    setStockInputs({});
    setError("");
  };

  const handleStockChange = (itemIndex: number, value: string) => {
    // Allow empty string to represent cleared input
    const newStockInputs: { [key: string]: number | "" } = {
      ...stockInputs,
      [`item_${itemIndex}`]: value === "" ? "" : Number(value),
    };

    const maxStock = masterData[itemIndex].totalQuantity;

    if (Number(newStockInputs[`item_${itemIndex}`]) > maxStock) {
      newStockInputs[`item_${itemIndex}`] = maxStock;
    }

    if (Number(newStockInputs[`item_${itemIndex}`]) < 0) {
      newStockInputs[`item_${itemIndex}`] = "";
    }

    setStockInputs(newStockInputs);

    // Update displayAvailableStock for all items
    updateDisplayAvailableStock(newStockInputs);

    // Clear error first
    setError("");

    // If validateOnMaxQty is true, validate on input change
    const validationError = validateMaxQty(newStockInputs);
    if (validationError) setError(validationError);
  };

  const handleSelect = () => {
    // Validate that at least one stock value is entered and not empty/zero
    const hasStockEntered = Object.values(stockInputs).some(
      (stock) => typeof stock === "number" && stock > 0,
    );

    if (!hasStockEntered) {
      setError("Please enter stock for at least one item");
      return;
    }

    // Validate total units against maxQty (reusable)
    const validationError = validateMaxQty();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Filter items with stock > 0 and add the entered stock values
    const selectedItems = updatedMasterData
      .map((item, index) => {
        const rawStock = stockInputs[`item_${index}`];
        const enteredStock = typeof rawStock === "number" ? rawStock : 0;
        if (enteredStock > 0) {
          let remainingStock = enteredStock;
          const mastersWithUsedQty = item.masters.map((master) => {
            const useQty = Math.min(remainingStock, master.quantity);
            remainingStock -= useQty;
            return {
              ...master,
              usedQty: useQty,
            };
          });
          return {
            ...item,
            enteredStock,
            masters: mastersWithUsedQty,
          };
        } else {
          return null;
        }
      })
      .filter((item) => item && item.enteredStock > 0);

    callback({ action: "select", data: selectedItems });
    setStockInputs({});
    setError("");
  };

  const increaseStock = (index: number) => {
    const currentStock = stockInputs[`item_${index}`] || 0;
    handleStockChange(index, (currentStock + 1).toString());
  };

  const decreaseStock = (index: number) => {
    const currentStock = stockInputs[`item_${index}`] || 0;
    handleStockChange(index, (currentStock - 1).toString());
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div>{t("chooseStockVariation")}</div>
        {dealName && (
          <div className="tw:text-base tw:font-semibold tw:text-blue-700 tw:mt-1">
            {dealName}
          </div>
        )}
        {typeof billedMrp === "number" && billedMrp > 0 && (
          <div className="tw:mt-2 tw:inline-flex tw:items-center tw:gap-2 tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-md tw:px-3 tw:py-1.5">
            <span className="tw:text-xs tw:font-medium tw:text-blue-800">
              Ordered MRP
            </span>
            <span className="tw:text-base tw:font-bold tw:text-blue-900">
              <Amount value={billedMrp} decimalPlaces={2} />
            </span>
          </div>
        )}
        {/* <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          Please enter the stock for the items you want to add to the cart.
        </div> */}
      </AppModal.Title>
      <AppModal.Content className="tw:bg-gray-100">
        <div className="tw:space-y-3 tw:p-0.5 tw:py-4">
          <div className="tw:space-y-3">
            {updatedMasterData.map((item, index) => {
              const isBelowMinMrp =
                typeof minMrp === "number" && minMrp > 0 && item.mrp < minMrp;
              // Price was edited at billing — picking a different MRP variant
              // won't change the billed price. Show only once qty is entered
              // for this variant, and not for the billed MRP itself.
              const enteredQty = Number(stockInputs[`item_${index}`]) || 0;
              const showPriceLockedNote =
                overridePrice != null &&
                enteredQty > 0 &&
                (typeof billedMrp !== "number" || item.mrp !== billedMrp);
              return (
                <AppCard
                  key={index}
                  className={clsx("tw:py-3 tw:mb-2", {
                    "tw:border-2 tw:border-blue-500":
                      Number(stockInputs[`item_${index}`]) > 0,
                    "tw:opacity-50 tw:pointer-events-none": isBelowMinMrp,
                  })}
                  bodyClassName="tw:px-3"
                >
                  {isBelowMinMrp && (
                    <div className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded tw:px-2 tw:py-1 tw:mb-2 tw:text-[11px] tw:text-red-700 tw:font-medium">
                      Ordered MRP is below selling price (
                      <Amount value={minMrp} />
                      ). Reset the modified price to add this variant.
                    </div>
                  )}
                  {showPriceLockedNote && (
                    <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded tw:px-2 tw:py-1.5 tw:mb-2 tw:text-xs tw:text-amber-800 tw:font-medium">
                      Ordered MRP is different. Billing price will not change —{" "}
                      <span className="tw:text-sm tw:font-bold">
                        <Amount value={overridePrice} decimalPlaces={2} />
                      </span>
                      .
                    </div>
                  )}
                  {/* Header with key info */}
                  <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:mb-2">
                    <div className="tw:space-y-1">
                      <div className="tw:text-xs tw:text-gray-500 tw:uppercase tw:tracking-wide tw:font-medium">
                        {t("mrp")}
                      </div>
                      <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                        <Amount value={item.mrp} decimalPlaces={2} />
                      </div>
                    </div>
                    <div className="tw:space-y-1">
                      <div className="tw:text-xs tw:text-gray-500 tw:uppercase tw:tracking-wide tw:font-medium">
                        {t("barcode")}
                      </div>
                      <div className="tw:text-xs tw:font-medium tw:text-gray-900 tw:font-mono">
                        {item.barcode || "--"}
                      </div>
                    </div>
                    <div className="tw:space-y-1">
                      <div className="tw:text-xs tw:text-gray-500 tw:uppercase tw:tracking-wide tw:font-medium">
                        {t("expiryDate")}
                      </div>
                      <div className="tw:text-xs  tw:text-gray-900">
                        <div className="tw:flex tw:flex-col">
                          {item.expiry ? (
                            <DateFormat
                              value={item.expiry}
                              formatStr="dd MMM yyyy"
                              className="tw:font-medium"
                            />
                          ) : (
                            "--"
                          )}
                          {item.remainingDays !== null &&
                            item.remainingDays !== undefined && (
                              <span
                                className={clsx(
                                  "tw:text-xs tw:mt-1",
                                  item.remainingDays >= 0
                                    ? "tw:text-gray-500"
                                    : "tw:text-red-500 tw:font-medium",
                                )}
                              >
                                {item.remainingDays > 0
                                  ? `${item.remainingDays} ${t("daysLeft")}`
                                  : item.remainingDays === 0
                                    ? t("expiresToday")
                                    : `${Math.abs(item.remainingDays)} ${t(
                                        "daysExpired",
                                      )}`}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Stock section */}
                  <div className="tw:bg-gray-50 tw:rounded-lg tw:p-2">
                    <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
                      <div className="tw:space-y-1">
                        <div className="tw:text-xs tw:text-gray-500 tw:uppercase tw:tracking-wide tw:font-medium">
                          {t("availableStock")}
                        </div>
                        <div
                          className={clsx("tw:text-base tw:font-bold", {
                            "tw:text-green-600":
                              (item.displayAvailableStock || 0) > 0,
                            "tw:text-red-600":
                              (item.displayAvailableStock || 0) === 0 &&
                              (stockInputs[`item_${index}`] || 0) > 0,
                          })}
                        >
                          <DisplayQty
                            qty={item.displayAvailableStock || 0}
                            isLooseQty={false}
                            uom={selectedStockUom}
                          />
                        </div>
                      </div>
                      <div className="tw:space-y-1 tw:text-center">
                        <div className="tw:text-xs tw:text-gray-500 tw:uppercase tw:tracking-wide tw:font-medium">
                          {t("enterQty")}
                          {selectedStockUom ? ` (${selectedStockUom})` : ""}
                        </div>
                        <div className="tw:flex tw:items-center tw:gap-2 tw:justify-end">
                          <button
                            className={clsx("tw:cursor-pointer", {
                              "tw:opacity-50 tw:cursor-not-allowed":
                                (stockInputs[`item_${index}`] || 0) <= 0,
                            })}
                            onClick={() => decreaseStock(index)}
                            disabled={(stockInputs[`item_${index}`] || 0) <= 0}
                          >
                            <Minus size={16} />
                          </button>
                          <Input
                            type="number"
                            min="0"
                            max={item.totalQuantity}
                            value={
                              stockInputs[`item_${index}`] === undefined
                                ? 0
                                : stockInputs[`item_${index}`]
                            }
                            onChange={(e) =>
                              handleStockChange(index, e.target.value)
                            }
                            placeholder="0"
                            className="tw:text-sm tw:font-medium tw:border-gray-300 focus:tw:border-blue-500 focus:tw:ring-blue-500 tw:h-8 tw:w-20 tw:text-center"
                          />
                          <button
                            className={clsx("tw:cursor-pointer", {
                              "tw:opacity-50 tw:cursor-not-allowed":
                                (item.displayAvailableStock || 0) <= 0,
                            })}
                            onClick={() => increaseStock(index)}
                            disabled={(item.displayAvailableStock || 0) <= 0}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div>
                          {validateOnMaxQty && (
                            <div className="tw:mt-1">
                              {/* remaining global qty shown beneath */}
                              <div className="tw:text-[11px] tw:text-blue-800 tw:mt-0.5">
                                <span className="tw:font-medium tw:mr-1">
                                  {t("qtyToPick")}:
                                </span>
                                <span className="tw:font-semibold tw:text-sm">
                                  {Math.max(0, (maxQty || 0) - totalUnits)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </AppCard>
              );
            })}
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:space-y-3 tw:flex-1">
          {error && (
            <div className="tw:bg-red-50 tw:border tw:border-red-200 tw:rounded-lg tw:p-3">
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:text-red-500 tw:text-sm">⚠️</div>
                <div className="tw:text-red-700 tw:text-xs tw:font-medium">
                  {error}
                </div>
              </div>
            </div>
          )}
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:flex-1">
            {/* Total units display */}
            <div className="tw:text-sm tw:font-semibold tw:text-gray-700">
              {validateOnMaxQty ? (
                <>
                  {t("totalUnits")} : {totalUnits} / {maxQty ?? 0}
                </>
              ) : (
                <>
                  {t("totalUnits")} : {totalUnits}
                </>
              )}
            </div>
            <div className="tw:flex tw:gap-3">
              <AppButton
                fill="outline"
                onClick={handleClose}
                className="tw:px-4 tw:py-1.5 tw:text-sm"
                color="dark"
              >
                {t("cancel")}
              </AppButton>
              <AppButton
                onClick={handleSelect}
                color="dark"
                className="tw:px-4 tw:py-1.5 tw:text-sm"
              >
                {t("proceed")}
              </AppButton>
            </div>
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ChooseSanpshotModal;
