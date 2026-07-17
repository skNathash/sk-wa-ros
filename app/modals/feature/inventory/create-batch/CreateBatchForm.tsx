import React, { useEffect } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import BarcodeInput from "~/shared/inventory/components/barcode-input/BarcodeInput";
import { useTranslation } from "react-i18next";
import { addYears } from "date-fns";

interface Props {
  selectedBatch: any;
  modalShow: boolean;
  dealId?: string;
}

// Date picker configurations
const today = new Date();
const manufactureDateConfig: DayPickerProps = {
  defaultMonth: today,
  disabled: { after: today },
};

const expiryDateConfig: DayPickerProps = {
  defaultMonth: today,
  disabled: { after: addYears(today, 8) },
  startMonth: today,
  endMonth: addYears(today, 8),
};

const CreateBatchForm: React.FC<Props> = ({
  selectedBatch,
  modalShow,
  dealId,
}) => {
  const { t } = useTranslation(["common"]);
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useFormContext();

  const [updateMasterDates] = useWatch({
    name: ["updateMasterDates"],
    control,
  });

  useEffect(() => {
    if (selectedBatch) {
      setValue(
        "updateMasterDates",
        !selectedBatch.manufactureDate && !selectedBatch.expiryDate,
      );
    } else {
      setValue("updateMasterDates", false);
    }
  }, [selectedBatch]);

  return (
    <>
      <div className="tw:grid tw:grid-cols-2 tw:gap-4">
        <AppInput
          name="quantity"
          label={t("quantity")}
          type="number"
          register={register}
          isRequired
          placeholder={t("enterQuantity")}
          error={(errors.quantity as any)?.message}
          onChange={(e: any) => {
            const value = parseInt(e.target.value);
            if (value < 1) {
              setValue("quantity", 1);
            } else if (selectedBatch && value > selectedBatch.quantity) {
              setValue("quantity", selectedBatch.quantity);
            }
          }}
        />
        <div className="tw:flex tw:items-end tw:pb-2">
          <span className="tw:text-sm tw:text-gray-600">
            {t("max")}: {selectedBatch?.quantity || 0}{" "}
            {selectedBatch?.uom || "units"}
          </span>
        </div>
      </div>

      <div>
        <label className="tw:block tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1.5">
          {t("barcode")}
        </label>
        <div className="tw:flex tw:items-center tw:gap-2">
          <Controller
            name="barcode"
            control={control}
            render={({ field }) => (
              <BarcodeInput
                value={field.value || ""}
                onChange={field.onChange}
                placeholder={t("enterBarcode")}
                uom={selectedBatch?.uom}
                dealId={dealId || selectedBatch?.dealId}
              />
            )}
          />
          <BarcodeScan
            callback={(r: { action: string; data: any }) => {
              if (r.action === "scan" && r.data) {
                setValue("barcode", r.data);
              }
            }}
            className="tw:cursor-pointer"
          />
        </div>
        {(errors.barcode as any)?.message && (
          <div className="tw:text-xs tw:text-red-600 tw:mt-1">
            {(errors.barcode as any)?.message}
          </div>
        )}
      </div>

      <AppInput
        name="mrp"
        label={t("mrp")}
        type="number"
        register={register}
        isRequired
        placeholder={t("enterMrp")}
        error={(errors.mrp as any)?.message}
        onChange={(e: any) => {
          const value = parseFloat(e.target.value);
          if (Number.isNaN(value) || value < 0) {
            setValue("mrp", 0);
          } else {
            setValue("mrp", value);
          }
        }}
      />

      <div className="tw:grid tw:grid-cols-2 tw:gap-4">
        <Controller
          name="manufactureDate"
          control={control}
          render={({ field }) => (
            <AppDateInput
              label={t("manufactureDate")}
              value={field.value}
              callback={field.onChange}
              error={(errors.manufactureDate as any)?.message}
              placeholder={t("choose")}
              dateConfig={manufactureDateConfig}
              forceClose={!modalShow}
            />
          )}
        />
        <Controller
          name="expiryDate"
          control={control}
          render={({ field }) => (
            <AppDateInput
              label={t("expiryDate")}
              value={field.value}
              callback={field.onChange}
              error={(errors.expiryDate as any)?.message}
              placeholder={t("choose")}
              dateConfig={expiryDateConfig}
              forceClose={!modalShow}
            />
          )}
        />
      </div>

      {/* Checkbox: show only when selectedBatch has no manufactureDate and no expiry */}
      {selectedBatch &&
        !selectedBatch.manufactureDate &&
        !selectedBatch.expiry && (
          <div className="tw:mt-2">
            <AppCheckbox
              name="updateMasterDates"
              label={t("selectedSnapshotHasNoMfgExpiryUseTheseDates")}
              value={updateMasterDates}
              onChange={(checked: boolean) =>
                setValue("updateMasterDates", checked)
              }
              className="tw:text-slate-600"
              size="xs"
            />
          </div>
        )}

      <AppTextarea
        name="remarks"
        label={t("remarks")}
        placeholder={t("enterRemarks")}
        register={register}
        error={(errors.remarks as any)?.message}
        rows={3}
      />
    </>
  );
};

export default CreateBatchForm;
