import React from "react";
import { useFormContext, useFieldArray, useWatch, Controller } from "react-hook-form";
import AppBadge from "~/components/core/badge/AppBadge";
import Amount from "~/components/core/amount/Amount";
import AppDateInput from "~/components/core/form/AppDateInput";
import { FileText, Trash2 } from "lucide-react";
import type { MfgExpFormValues } from "./UpdateMfgExp";
import { mfgDateConfig, expiryDateConfig } from "./helper";

const MobileView: React.FC = () => {
  const { control, setValue, getValues } = useFormContext<MfgExpFormValues>();
  const { fields, remove } = useFieldArray({ control, name: "records" });
  const watchedRecords = useWatch({ control, name: "records" });

  const getStatus = (index: number) =>
    watchedRecords?.[index]?.status || fields[index]?.status;

  const getMessage = (index: number) =>
    watchedRecords?.[index]?.validationMessage ?? fields[index]?.validationMessage;

  if (!fields || fields.length === 0) {
    return (
      <div className="tw:text-center tw:py-8 tw:px-4">
        <div className="tw:text-gray-500">No records to display</div>
      </div>
    );
  }

  return (
    <div className="tw:space-y-3 tw:px-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200 tw:shadow-sm"
        >
          {/* Record Header */}
          <div className="tw:flex tw:items-start tw:mb-3">
            <div className="tw:w-10 tw:h-10 tw:bg-gray-100 tw:rounded tw:flex tw:items-center tw:justify-center tw:mr-3 tw:flex-shrink-0">
              <FileText className="tw:w-5 tw:h-5 tw:text-gray-400" />
            </div>
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:flex tw:justify-between tw:items-start">
                <div className="tw:font-semibold tw:text-sm tw:text-gray-900 tw:line-clamp-2">
                  {field.dealName || `Row ${field.slNo}`}
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="tw:text-red-500 hover:tw:text-red-700 tw:p-1 tw:shrink-0"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1">
                <AppBadge
                  variant={
                    getStatus(index) === "VALID" || getStatus(index) === "Success"
                      ? "success"
                      : "danger"
                  }
                  className="tw:text-xs"
                >
                  {getStatus(index)}
                </AppBadge>
                {field.dealRefId && (
                  <span className="tw:text-xs tw:text-gray-500">
                    {field.dealRefId}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Record Details */}
          <div className="tw:space-y-2">
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-700">MRP</span>
              <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                <Amount value={field.mrp} decimalPlaces={2} />
              </span>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-700">Stock</span>
              <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                {field.quantity}
              </span>
            </div>
            {field.stockMasterId ? (
              <>
                <div className="tw:flex tw:justify-between tw:items-center">
                  <span className="tw:text-sm tw:text-gray-700">MFG Date</span>
                  <div className="tw:w-40">
                    <Controller
                      name={`records.${index}.manufactureDate`}
                      control={control}
                      render={({ field: dateField }) => (
                        <AppDateInput
                          value={dateField.value}
                          callback={(val: string) => {
                            dateField.onChange(val);
                            const expiry = getValues(`records.${index}.expiry`);
                            if (val && expiry && field.snapshotId && field.dealRefId) {
                              setValue(`records.${index}.status`, "VALID", { shouldDirty: true });
                              setValue(`records.${index}.validationMessage`, "", { shouldDirty: true });
                            }
                          }}
                          placeholder="Select date"
                          isRequired
                          dateConfig={mfgDateConfig}
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="tw:flex tw:justify-between tw:items-center">
                  <span className="tw:text-sm tw:text-gray-700">Expiry Date</span>
                  <div className="tw:w-40">
                    <Controller
                      name={`records.${index}.expiry`}
                      control={control}
                      render={({ field: dateField }) => (
                        <AppDateInput
                          value={dateField.value}
                          callback={(val: string) => {
                            dateField.onChange(val);
                            const mfgDate = getValues(`records.${index}.manufactureDate`);
                            if (val && mfgDate && field.snapshotId && field.dealRefId) {
                              setValue(`records.${index}.status`, "VALID", { shouldDirty: true });
                              setValue(`records.${index}.validationMessage`, "", { shouldDirty: true });
                            }
                          }}
                          placeholder="Select date"
                          isRequired
                          dateConfig={expiryDateConfig}
                        />
                      )}
                    />
                  </div>
                </div>
              </>
            ) : null}
            {(getStatus(index) === "VALID" || getStatus(index) === "Success") && field.remarks && (
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-sm tw:text-gray-700">Message</span>
                <span className="tw:text-sm tw:text-gray-900">{field.remarks}</span>
              </div>
            )}
            {getStatus(index) !== "VALID" && getStatus(index) !== "Success" && getMessage(index) && (
              <div className="tw:mt-2 tw:p-2 tw:bg-red-50 tw:rounded tw:text-xs tw:text-red-700">
                {getMessage(index)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
