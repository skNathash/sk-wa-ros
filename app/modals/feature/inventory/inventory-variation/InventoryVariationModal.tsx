import React, { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { add, sub } from "date-fns";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppModal from "~/components/core/modal/AppModal";
import LocationInput from "~/components/feature/inventory/location-input/LocationInput";
import BarcodeInput from "~/shared/inventory/components/barcode-input/BarcodeInput";
import useAppToast from "~/hooks/useAppToast";
import type { DayPickerProps } from "react-day-picker";

interface InventoryVariationFormData {
  barcode: string;
  qty: number;
  manufactureDate: Date | undefined;
  expiryDate: Date | undefined;
  purchasePrice: number;
  mrp: number;
  notes: string;
  location: string;
  locationDetail: any;
  rack: string;
  rackDetails: any;
  bin: string;
  binDetails: any;
}

interface InventoryVariationModalProps {
  show: boolean;
  callback: (response: {
    action: string;
    data?: {
      barcode: string;
      qty: number;
      manufactureDate?: Date;
      expiryDate?: Date;
      purchasePrice?: number;
      mrp?: number;
      notes?: string;
      location?: string;
      locationDetail?: any;
      rack?: string;
      rackDetails?: any;
      bin?: string;
      binDetails?: any;
    };
  }) => void;
  dealName?: string;
  maxQty?: number;
  defaultMrp?: number;
  dealId?: string;
}

const manufactureDateConfig: DayPickerProps = {
  defaultMonth: new Date(),
  disabled: { after: new Date(), before: sub(new Date(), { years: 10 }) },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
};

const expiryDateConfig: DayPickerProps = {
  defaultMonth: new Date(),
  disabled: { before: new Date(), after: add(new Date(), { years: 10 }) },
  startMonth: new Date(),
  endMonth: add(new Date(), { years: 10 }),
};

const InventoryVariationModal: React.FC<InventoryVariationModalProps> = ({
  show,
  callback,
  dealName,
  maxQty,
  defaultMrp,
  dealId,
}) => {
  const { t } = useTranslation("common");
  // Remove errors state, not needed for toast-based error display
  const appToast = useAppToast();

  const { register, handleSubmit, control, reset, setValue } =
    useForm<InventoryVariationFormData>({
      defaultValues: {
        barcode: "",
        qty: 0,
        manufactureDate: undefined,
        expiryDate: undefined,
        purchasePrice: undefined,
        mrp: defaultMrp || 0,
        notes: "",
        location: "",
        locationDetail: null,
        rack: "",
        rackDetails: null,
        bin: "",
        binDetails: null,
      },
    });

  // Watch location, rack, bin using array destructure
  const [location, rack, bin] = useWatch({
    control,
    name: ["location", "rack", "bin"],
  });

  // Set default MRP when modal opens or defaultMrp changes
  useEffect(() => {
    if (show && defaultMrp && defaultMrp > 0) {
      setValue("mrp", defaultMrp);
    }
  }, [show, defaultMrp, setValue]);

  // Helper to validate expiry date is greater than manufacture date
  const validateExpiryDate = (
    manufactureDate: Date | undefined,
    expiryDate: Date | undefined
  ): boolean => {
    if (!manufactureDate || !expiryDate) return true; // Skip validation if either date is missing

    return expiryDate > manufactureDate;
  };

  // Custom validation function returns error message string or null
  const validateForm = (data: InventoryVariationFormData): string | null => {
    let msg = null;
    if (!data.barcode || data.barcode.trim() === "") {
      msg = t("barcodeRequired");
    } else if (!data.qty || data.qty <= 0) {
      msg = t("quantityMustBeGreaterThanZero");
    } else if (maxQty && data.qty > maxQty) {
      msg = t("quantityCannotExceed", { maxQty });
    } else if (
      data.purchasePrice === undefined ||
      data.purchasePrice === null ||
      isNaN(data.purchasePrice)
    ) {
      msg = t("purchasePriceRequired");
    } else if (data.purchasePrice < 0) {
      msg = t("purchasePriceCannotBeNegative");
    } else if (!data.mrp || data.mrp <= 0) {
      msg = t("mrpRequired");
    } else if (data.mrp < 0) {
      msg = t("mrpCannotBeNegative");
    } else if (
      data.mrp > 0 &&
      data.purchasePrice > 0 &&
      data.mrp < data.purchasePrice
    ) {
      msg = t("mrpShouldBeGreaterThanOrEqualToPurchasePrice");
    } else if (
      data.manufactureDate &&
      data.expiryDate &&
      !validateExpiryDate(data.manufactureDate, data.expiryDate)
    ) {
      msg = t("expiryDateMustBeGreaterThanManufactureDate");
    } else if (!data.location || data.location.trim() === "") {
      msg = t("locationRequired");
    } else if (!data.rack || data.rack.trim() === "") {
      msg = t("rackRequired");
    } else if (!data.bin || data.bin.trim() === "") {
      msg = t("binRequired");
    }
    return msg;
  };

  const onSubmit = (data: InventoryVariationFormData) => {
    const errorMsg = validateForm(data);
    if (!errorMsg) {
      const transformedData = {
        barcode: data.barcode,
        qty: data.qty,
        manufactureDate: data.manufactureDate,
        expiryDate: data.expiryDate,
        purchasePrice: data.purchasePrice,
        mrp: data.mrp,
        notes: data.notes,
        location: data.location,
        locationDetail: data.locationDetail,
        rack: data.rack,
        rackDetails: data.rackDetails,
        bin: data.bin,
        binDetails: data.binDetails,
      };
      callback({ action: "add", data: transformedData });
      reset();
    } else {
      appToast.show({
        msg: errorMsg,
        color: "danger",
      });
    }
  };

  const handleCancel = () => {
    reset();
    callback({ action: "cancel" });
  };

  const handleClose = () => {
    reset();
    callback({ action: "close" });
  };

  // Reusable function for number input validation
  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    minValue: number = 0
  ) => {
    const value = parseFloat(e.target.value);
    if (value < minValue) {
      e.target.value = "";
    }
  };

  // Handle location input changes
  const handleLocationChange = (data: {
    location: string;
    locationDetail: any;
    rack: string;
    rackDetails: any;
    bin: string;
    binDetails: any;
  }) => {
    setValue("location", data.location);
    setValue("locationDetail", data.locationDetail);
    setValue("rack", data.rack);
    setValue("rackDetails", data.rackDetails);
    setValue("bin", data.bin);
    setValue("binDetails", data.binDetails);
  };

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:h-[90vh] tw:md:!max-w-2xl"
    >
      <AppModal.Title onClose={handleClose}>
        <div>
          <h2 className="tw:text-lg tw:font-semibold">
            {t("addInventoryVariation")}
          </h2>
          {dealName && (
            <p className="tw:text-sm tw:text-gray-500 tw:mt-1">
              {t("product")}: {dealName}
            </p>
          )}
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[80vh]">
        <form onSubmit={handleSubmit(onSubmit)} className="tw:p-0.5">
          {/* Barcode and Quantity in a single row */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-6">
            <div>
              <label className="tw:block tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1.5">
                {t("barcode")}
                <span className="tw:text-red-500 tw:ml-0.5">*</span>
              </label>
              <Controller
                name="barcode"
                control={control}
                render={({ field }) => (
                  <BarcodeInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder={t("enterBarcode")}
                    dealId={dealId}
                  />
                )}
              />
            </div>
            <div>
              <AppInput
                name="qty"
                label={t("quantity")}
                type="number"
                register={register}
                isRequired
                placeholder={t("enterQuantity")}
                className="tw:mb-0"
                onChange={(e) => handleNumberInputChange(e, 1)}
              />
            </div>
          </div>

          {/* MRP and Purchase Price in a single row */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-6">
            <div>
              <AppInput
                name="mrp"
                label={t("mrp")}
                type="number"
                register={register}
                isRequired
                placeholder={t("enterMrp")}
                className="tw:mb-0"
                onChange={(e) => handleNumberInputChange(e, 0)}
              />
            </div>
            <div>
              <AppInput
                name="purchasePrice"
                label={t("purchasePrice")}
                type="number"
                register={register}
                isRequired
                placeholder={t("enterPurchasePrice")}
                className="tw:mb-0"
                onChange={(e) => handleNumberInputChange(e, 0)}
              />
            </div>
          </div>

          {/* Manufacturing Date and Expiry Date in a single row */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-6">
            <div>
              <Controller
                control={control}
                name="manufactureDate"
                render={({ field }) => (
                  <AppDateInput
                    label={t("manufacturingDate")}
                    callback={field.onChange}
                    value={field.value as Date | undefined}
                    size="sm"
                    placeholder="MFG. Date"
                    dateConfig={manufactureDateConfig}
                    className="tw:mb-0"
                  />
                )}
              />
            </div>
            <div>
              <Controller
                control={control}
                name="expiryDate"
                render={({ field }) => (
                  <AppDateInput
                    label={t("expiryDate")}
                    callback={field.onChange}
                    value={field.value as Date | undefined}
                    size="sm"
                    placeholder="Expiry Date"
                    dateConfig={expiryDateConfig}
                    className="tw:mb-0"
                  />
                )}
              />
            </div>
          </div>

          {/* Location Input */}
          <div className="tw:mb-6">
            <label className="tw:block tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-2">
              {t("locationDetails")} <span className="tw:text-red-500">*</span>
            </label>
            <LocationInput
              locationId={location}
              rackId={rack}
              binId={bin}
              dealId={dealId}
              qty={maxQty}
              callback={handleLocationChange}
              layout="horizontal"
              locationType="sellable"
              hideLocationDropdown={true}
            />
          </div>

          {/* Notes in a single row */}
          <div className="tw:mb-6">
            <AppInput
              name="notes"
              label={t("notes")}
              register={register}
              placeholder={t("enterNotesOptional")}
              className="tw:mb-0"
            />
          </div>

          {/* Action Buttons */}
          <div className="tw:flex tw:justify-end tw:gap-3">
            <AppButton
              type="button"
              onClick={handleCancel}
              fill="outline"
              color="secondary"
            >
              {t("cancel")}
            </AppButton>
            <AppButton type="submit" color="primary">
              {t("addVariation")}
            </AppButton>
          </div>
        </form>
      </AppModal.Content>
    </AppModal>
  );
};

export default InventoryVariationModal;
